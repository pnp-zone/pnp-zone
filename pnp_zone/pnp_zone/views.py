from django.contrib.auth.views import LoginView, LogoutView

from pnp_zone import menu


class Login(LoginView):
    template_name = "auth/login.html"
    extra_context = {
        "title": "Login",
        "menu": menu.get("login")
    }


class Logout(LogoutView):
    pass
