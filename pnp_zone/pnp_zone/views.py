from django.contrib.auth.views import LoginView, LogoutView

from pnp_zone import menu


class Login(LoginView):
    template_name = "auth/login.html"
    extra_context = {
        "title": "Login"
    }


class Logout(LogoutView):
    pass
