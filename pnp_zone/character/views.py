from django.http import JsonResponse
from django.views.generic import TemplateView

from chants.models import ChantModel
from character import models


class ExportView(TemplateView):
    def get(self, request, *args, **kwargs):
        cls = models.__dict__[request.GET["class"]]
        data = []
        for obj in ChantModel.objects.all():
            data.append(dict([(key, value) for key, value in obj.__dict__.items() if key != "_state"]))
        return JsonResponse(data, safe=False)
