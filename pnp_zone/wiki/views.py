from django.shortcuts import render
from django.views.generic import TemplateView


class IndexView(TemplateView):
    template_name = "wiki/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": [{"link": "/", "text": "Dashboard"},
                                                             {"link": "/player/", "text": "Player Tools"},
                                                             {"link": "/dm/", "text": "DM Tools"},
                                                             {"active": True, "link": "/wiki/", "text": "Wiki"}, ]})
