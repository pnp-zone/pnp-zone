from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.shortcuts import render

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


def permission_denied(request, exception: PermissionDenied):
    if exception.args and isinstance(exception.args[0], str):
        message = exception.args[0]
    else:
        message = "Permission Denied"
    return render(request, template_name="error.html", context={"message": message})


def page_not_found(request, exception: Http404):
    return render(request, template_name="error.html", context={"message": "Page not found"})


def react_test(request):
    return render(request, template_name="test.html")
