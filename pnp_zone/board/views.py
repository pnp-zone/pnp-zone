from django.shortcuts import render

# Create your views here.
from django.views.generic import TemplateView


class BoardView(TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        return render(request, template_name=self.template_name)