# Go compiler
GO = go

# Directory containing Go source files
FILE_DIR = .

# Directory containing compiled executables
OUT_DIR = bin

all: clean build

.PHONY: clean
clean:
	rm -rf ${OUT_DIR}/

.PHONY: build
build:
	${GO} build -o ${OUT_DIR}/ ${FILE_DIR}/...

.PHONY: install
install:
	useradd -U -r pnp-zone
	cp ${OUT_DIR}/pnp-zone /usr/local/bin/pnp-zone
	cp pnp-zone.service /usr/lib/systemd/system/pnp-zone.service
	if [ -L /etc/systemd/system/multi-user.target.wants/pnp-zone.service ] ; then \
		if [ -e /etc/systemd/system/multi-user.target.wants/pnp-zone.service ]; then \
			echo "Service file is already linked properly"; \
		else \
			rm /etc/systemd/system/multi-user.target.wants/pnp-zone.service; \
			ln -s /usr/lib/systemd/system/pnp-zone.service /etc/systemd/system/multi-user.target.wants/; \
		fi \
	else \
		ln -s /usr/lib/systemd/system/pnp-zone.service /etc/systemd/system/multi-user.target.wants/; \
	fi
	systemctl daemon-reload
	systemctl enable pnp-zone
	cp -r templates/ /var/lib/pnp-zone/
	cp -r static/ /var/lib/pnp-zone/
	cp example.config.toml /etc/pnp-zone/
	mkdir -p /var/lib/pnp-zone/plugins