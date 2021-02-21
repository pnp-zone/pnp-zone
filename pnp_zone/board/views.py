from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http.response import Http404

from board.models import Room
from pnp_zone import menu


class IndexView(LoginRequiredMixin, TemplateView):
    template_name = "board/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, template_name=self.template_name, context={
            "title": "Boards",
            "menu": menu.get("/board/"),
            "rooms": Room.objects.all()
        })


class BoardView(LoginRequiredMixin, TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = kwargs["room"]

        try:
            room = Room.objects.get(identifier=room)
        except Room.DoesNotExist:
            raise Http404

        return render(request, template_name=self.template_name, context={
            "title": room.name,
            "menu": menu.get(),
            "room": room,
            "is_moderator": request.user in room.moderators.all() or request.user.is_superuser,
            "x_range": list(range(25)), "y_range": list(range(17)),
        })
