from django_auth_ldap.backend import LDAPBackend

from accounts.models import AccountModel


class CustomLDAPBackend(LDAPBackend):

    def authenticate_ldap_user(self, ldap_user, password):
        user = ldap_user.authenticate(password)
        account, created = AccountModel.objects.get_or_create(user=user)
        if ldap_user.attrs[self._settings.USER_ATTR_MAP["display_name"]]:
            account.display_name = ldap_user.attrs[self._settings.USER_ATTR_MAP["display_name"]][0]
        else:
            account.display_name = user.username
        account.save()
        return user
