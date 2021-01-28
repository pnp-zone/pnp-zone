from django.shortcuts import render
from django.views.generic import TemplateView

from pnp_zone import menu


class DashboardView(TemplateView):
    template_name = "dashboard/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": menu.get("/")})

