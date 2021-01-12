from django.shortcuts import render
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.http.response import Http404
from django.core.exceptions import SuspiciousOperation

from board.models import Room, Character
from pnp_zone import menu


class IndexView(TemplateView):
    template_name = "board/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, template_name=self.template_name, context={
            "title": "Boards",
            "menu": menu.get("/board/"),
            "rooms": Room.objects.all()
        })


class BoardView(TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = kwargs["room"]

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
        bool_list = list(map(lambda x: x % 2 == 0, range(25)))

        return render(request, template_name=self.template_name, context={
            "title": room.name,
            "menu": menu.get(),
            "characters": characters,
            "x_range": bool_list, "y_range": bool_list,
        })


class CharacterView(TemplateView):
    template_name = "board/character.html"

    def get(self, request, *args, **kwargs):
        if "room" not in request.GET and "character" not in request.GET:
            raise SuspiciousOperation("Missing parameters: 'room' and 'character' required")
        else:
            try:
                return render(request, template_name=self.template_name, context={
                    "model": Character.objects.get(room__identifier=request.GET["room"], identifier=request.GET["character"])
                })
            except:
                raise Http404
