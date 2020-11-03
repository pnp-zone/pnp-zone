from django.shortcuts import render
from django.views.generic import TemplateView


class DashboardView(TemplateView):
    template_name = "dashboard/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": [{"active": True, "link": "/", "text": "Dashboard"},
                                                             {"link": "/player/", "text": "Player Tools"},
                                                             {"link": "/dm/", "text": "DM Tools"},
                                                             {"link": "/wiki/", "text": "Wiki"}, ]})

