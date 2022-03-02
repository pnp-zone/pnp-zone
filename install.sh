#!/bin/bash

apt install python3-pip git build-essential python3-dev libldap2-dev libsasl2-dev ldap-utils tox lcov valgrind ansible mariadb-server mariadb-client default-libmysqlclient-dev
ansible-playbook install.yml
