from django.shortcuts import render
from django.views.generic import TemplateView


class ChantView(TemplateView):
    template_name = "chants/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, template_name=self.template_name)
