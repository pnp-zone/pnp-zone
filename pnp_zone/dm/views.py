from django.shortcuts import render
from django.views.generic import TemplateView


class IndexView(TemplateView):
    template_name = "dm/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": [{"link": "/", "text": "Dashboard"},
                                                             {"link": "/player/", "text": "Player Tools"},
                                                             {"active": True, "link": "/dm/", "text": "DM Tools"},
                                                             {"link": "/wiki/", "text": "Wiki"}, ]})

