#!/bin/bash

apt install python3-pip git build-essential python3-dev libldap2-dev libsasl2-dev ldap-utils tox lcov valgrind ansible
ansible-playbook install.yml
