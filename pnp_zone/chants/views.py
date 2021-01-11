import os

from django.shortcuts import render
from django.views.generic import TemplateView

from chants.models import ChantModel
from pnp_zone import menu


class IndexView(TemplateView):
    template_name = "chants/index.html"

    def get(self, request, *args, **kwargs):
        chants = sorted(ChantModel.objects.all(), key=lambda x: x.name)
        return render(request, template_name=self.template_name, context={
            "title": "Chants",
            "menu": menu.get("/chants/"),
            "chants": chants
        })


class ChantView(TemplateView):
    template_name = "chants/chant.html"

    def get(self, request, *args, **kwargs):
        chant = ChantModel.objects.get(name=os.path.basename(request.path))
        return render(request, template_name=self.template_name, context={
            "title": chant.name,
            "menu": menu.get(),
            "trial": f"{chant.trial} {chant.trial_modifier}",
            "chant": chant,
            "aspects": ", ".join(map(str, chant.aspects.all())),
            "publication": f"{chant.source.book}, Seite {chant.source.page.page}"
        })
