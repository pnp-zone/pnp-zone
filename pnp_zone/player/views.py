from django.shortcuts import render
from django.views.generic import TemplateView


class IndexView(TemplateView):
    template_name = "player/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": [{"link": "/", "text": "Dashboard"},
                                                             {"active": True, "link": "/player/", "text": "Player Tools"},
                                                             {"link": "/dm/", "text": "DM Tools"},
                                                             {"link": "/wiki/", "text": "Wiki"}, ]})
