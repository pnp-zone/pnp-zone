from django.contrib.auth.views import LoginView as _LoginView

from pnp_zone import menu


class LoginView(_LoginView):

    template_name = "auth/login.html"
    extra_context = {"title": "Login",
                     "menu": menu.get("login")}
