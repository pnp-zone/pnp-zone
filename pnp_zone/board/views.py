from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http.response import Http404, HttpResponse

from board.models import Room, UserSession
from campaign.models import CampaignModel
from pnp_zone import menu


class BoardView(LoginRequiredMixin, TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = kwargs["room"]

        try:
            room = Room.objects.get(identifier=room)
        except Room.DoesNotExist:
            raise Http404

        campaign = CampaignModel.objects.filter(room__in=[room.id])[0]
        if request.user.username not in [x.user.username for x in campaign.players.all()] and\
                request.user.username not in [x.user.username for x in campaign.game_master.all()]:
            return HttpResponse("You're not allowed in this room")

        try:
            session = UserSession.objects.get(room=room, user=request.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=room, user=request.user, board_x=0, board_y=0, board_scale=1)

        return render(request, template_name=self.template_name, context={
            "title": room.name,
            "menu": menu.get(),
            "room": room,
            "characters": room.character_set.all(),
            "session": session,
            "tiles": room.tile_set.all(),
            "is_moderator": request.user.id in [x.user.id for x in campaign.game_master.all()] or request.user.is_superuser,
            "x_range": list(range(25)), "y_range": list(range(17)),
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
        })
