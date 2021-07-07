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

        campaign: CampaignModel = room.campaignmodel_set.first()
        if not campaign.players.filter(user__username=request.user.username).exists() and \
                not campaign.game_master.filter(user__username=request.user.username).exists():
            return HttpResponse("You're not allowed in this room")

        try:
            session = UserSession.objects.get(room=room, user=request.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=room, user=request.user, board_x=0, board_y=0, board_scale=1)

        return render(request, template_name=self.template_name, context={
            "title": room.name,
            "menu": menu.get(),
            "room": room,
            "session": session,
            "characters": room.character_set.all(),
            "tiles": room.tile_set.all(),
            "images": room.image_set.all(),
            "is_moderator": campaign.game_master.filter(user=request.user).exists() or request.user.is_superuser,
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
        })
