from django.shortcuts import render
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.http.response import Http404

from board.models import Room


class BoardView(TemplateView):
    template_name = "board/board.html"

    def get(self, request, room=None, **kwargs):
        try:
            room = Room.objects.get(identifier=room)
        except Room.DoesNotExist:
            raise Http404

        characters = []
        for character in room.character_set.all():
            characters.append(render_to_string(
                template_name="board/character.html",
                context={"model": character},
                request=request,
            ))

        # A list of alternating booleans the template iterates over to generate the grid
        bool_list = list(map(lambda x: x % 2 == 0, range(26)))

        return render(request, template_name=self.template_name, context={
            "characters": characters, "title": room.name,
            "x_range": bool_list, "y_range": bool_list,
        })
