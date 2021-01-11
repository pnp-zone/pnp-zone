from django.shortcuts import render
from django.template.loader import render_to_string

from django.views.generic import TemplateView

from board.models import Character


class BoardView(TemplateView):
    template_name = "board/board.html"

    def get(self, request, room=None, **kwargs):
        characters = []
        for character in Character.objects.filter(room=room):
            characters.append(render_to_string(
                template_name="board/character.html",
                context={"model": character},
                request=request,
            ))

        return render(request, template_name=self.template_name, context={"characters": characters})
