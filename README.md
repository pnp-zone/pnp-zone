# PNP Zone

## Installation

### BBB integration
As of the "new" policies from Firefox, Chromium and Safari, Cookies with no `SameSite` attribute get treated as `SameSite=Lax`. This prohibits embedding in iframes.

To workaround this issue (requires access to the bbb server):
 ```bash
sed -iE '8i\                        proxy_cookie_path \/ "\/; secure; SameSite=none";' /etc/bigbluebutton/nginx/web.nginx
```

### LDAP
In order to deploy the project with the LDAP features, the openldap libraries has to be installed on the system.

#### Arch

```bash
sudo pacman -S openldap
```

#### Debian

```bash
sudo apt install build-essential python3-dev libldap2-dev libsasl2-dev ldap-utils tox lcov valgrind
```
(maybe some of these packages are unnecessary, but at least they work)
