from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http.response import Http404, HttpResponse

from board.models import Room
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

        campaign = CampaignModel.objects.get(room__identifier=room.identifier)
        if request.user not in campaign.players.all() or request.user not in campaign.game_master.all():
            HttpResponse("You're not allowed in this room")

        return render(request, template_name=self.template_name, context={
            "title": room.name,
            "menu": menu.get(),
            "room": room,
            "is_moderator": request.user in campaign.game_master.all() or request.user.is_superuser,
            "x_range": list(range(25)), "y_range": list(range(17)),
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
        })
