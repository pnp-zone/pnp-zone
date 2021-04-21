from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView, LogoutView

from accounts.models import AccountModel


class Login(LoginView):
    template_name = "auth/login.html"
    extra_context = {
        "title": "Login"
    }

    def get_success_url(self):
        try:
            user = User.objects.get(username=self.request.user)
        except User.DoesNotExist:
            return False
        account, created = AccountModel.objects.get_or_create(user=user)
        account.save()
        return super().get_success_url()


class Logout(LogoutView):
    pass
