from django.shortcuts import render
from django.views.generic import TemplateView


class DashboardView(TemplateView):
    template_name = "dashboard/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, template_name=self.template_name)

