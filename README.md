# PNP Zone

## Installation

In order to deploy the project with the LDAP features, the openldap libraries has to be installed on the system.

### Arch

```bash
sudo pacman -S openldap
```

### Debian

```bash
sudo apt install build-essential python3-dev libldap2-dev libsasl2-dev ldap-utils tox lcov valgrind
```
(maybe some of these packages are unnecessary, but at least they work)
