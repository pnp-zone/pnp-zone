from django.shortcuts import render
from django.views.generic import TemplateView

from pnp_zone import menu


class IndexView(TemplateView):
    template_name = "player/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": menu.get("/player/")})
