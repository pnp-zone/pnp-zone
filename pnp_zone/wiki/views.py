import os

from django.shortcuts import render
from django.views.generic import TemplateView

from pnp_zone import menu
from wiki.models.chants import ChantModel


class IndexView(TemplateView):
    template_name = "wiki/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"title": "here be dragons",
                                                    "menu": menu.get("/wiki/")})


class ChantIndexView(TemplateView):
    template_name = "chants/index.html"

    def get(self, request, *args, **kwargs):
        chants = sorted(ChantModel.objects.all(), key=lambda x: x.name)
        return render(request, template_name=self.template_name, context={
            "title": "Chants",
            "menu": menu.get(),
            "chants": chants
        })


class ChantView(TemplateView):
    template_name = "chants/chant.html"

    def get(self, request, *args, **kwargs):
        chant = ChantModel.objects.get(name=os.path.basename(request.path))
        return render(request, template_name=self.template_name, context={
            "title": chant.name,
            "menu": menu.get(),
            "chant": chant,
            "aspects": ", ".join(map(str, chant.aspects.all())),
        })
