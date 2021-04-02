from uuid import uuid4

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http.response import Http404, JsonResponse, HttpResponseRedirect

from board.models import Room
from pnp_zone import menu


class IndexView(LoginRequiredMixin, TemplateView):
    template_name = "board/index.html"

    def post(self, request, *args, **kwargs):
        if "name" in request.POST:
            name = request.POST.get("name")
            if name:
                room = Room.objects.create(name=name, identifier=str(uuid4()))
                room.moderators.add(request.user)

        elif "identifier" in request.POST:
            identifier = request.POST.get("identifier")
            try:
                room = Room.objects.get(identifier=identifier)
                if request.user in room.moderators.all():
                    room.delete()
            except Room.DoesNotExist:
                pass

        return HttpResponseRedirect(request.path)

    def get(self, request, *args, **kwargs):
        your_rooms = Room.objects.filter(moderators=request.user)
        others_rooms = Room.objects.exclude(moderators=request.user)
        return render(request, template_name=self.template_name, context={
            "title": "Boards",
            "menu": menu.get("/board/"),
            "your_rooms": your_rooms,
            "others_rooms": others_rooms,
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
