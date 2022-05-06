# PNP Zone

## Compile from source

### Requirements

- `go` Version 1.18
- `rust` 

**Go**:
As of now, Debian 11 ships with golang version 1.15. 
Follow the [offical installation instructions](https://go.dev/doc/install) to install the current version.

**Rust**:
The same problem rises with the installation of rust. 
Follow the [installation instructions](https://www.rust-lang.org/tools/install) from rust.

With rustup installed, `wasm-pack` can be installed:
```bash
apt update && apt install build-essential
cargo install wasm-pack
```

### Compilation

First of all, clone pnp-zone as well as its submodules:

```bash
git clone https://github.com/pnp-zone/pnp-zone.git --recursive && cd pnp-zone
```

Now, compile and install pnp-zone and its submodules:
```bash
make && make install
```

## Configuration

To configure pnp-zone, copy `/etc/pnp-zone/example.config.toml` to `/etc/pnp-zone/config.toml` and modify 
it to match your needs.

After changing the configuration, pnp-zone has to be reloaded:
```bash
systemctl reload pnp-zone
```

### Reverse Proxy
It is recommended to deploy pnp-zone behind a reverse proxy. Nginx is used as reference.

Install nginx:
```bash
apt-get install nginx
```

Copy nginx configuration file:
```bash
cp pnp-zone.nginx /etc/nginx/sites-available/pnp-zone.conf
ln -s /etc/nginx/sites-available/pnp-zone.conf /etc/nginx/sites-enabled/
```

Set `SERVER_NAME` to the vhost, your server can be accessed by:
```bash
sed -i -E 's/SERVER_NAME/your-server-name/' /etc/nginx/sites-available/pnp-zone.conf
```

Set `CERT_PATH` and `CERT_KEY_PATH` to a certificate, that is valid for `SERVER_NAME`:
```bash
sed -i -E 's/CERT_PATH/\/path\/to\/cert\.pem/' /etc/nginx/sites-available/pnp-zone.conf
sed -i -E 's/CERT_KEY_PATH/\/path\/to\/key\.pem/' /etc/nginx/sites-available/pnp-zone.conf
```

Finally, start nginx:
```bash
systemctl start nginx
```

