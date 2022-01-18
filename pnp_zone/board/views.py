import json

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.views.generic import TemplateView
from django.http.response import Http404, HttpResponse, JsonResponse

from board.models import Room, UserSession
from campaign.models import CampaignModel
from campaign.views import JoinBBBView
from accounts.models import AccountModel


class BoardView(LoginRequiredMixin, TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = get_object_or_404(Room, identifier=kwargs["room"])
        account = AccountModel.objects.select_related("user").get(user=request.user)
        campaign: CampaignModel = room.campaignmodel_set.first()

        if account not in campaign.players.all() and account not in campaign.game_master.all():
            return HttpResponse("You're not allowed in this room")

        return render(request, template_name=self.template_name, context={
            # "menu": menu.get(),  # deprecated
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
            "initial_board": repr(json.dumps(BoardData.get_data(request, room=room))),
            "initial_data": repr(json.dumps({
                "boards": dict((b.identifier, b.name) for b in campaign.room.all()),
                "bbb": (JoinBBBView.get_link(campaign, account) if settings.BBB_INTEGRATION else None),
                "isModerator": request.user.is_superuser or campaign.game_master.filter(user=request.user).exists(),
            })),
        })


class BoardData(LoginRequiredMixin, View):

    @staticmethod
    def get_data(request, room: Room):
        campaign: CampaignModel = room.campaignmodel_set.first()
        if not campaign.players.filter(user__username=request.user.username).exists() and \
                not campaign.game_master.filter(user__username=request.user.username).exists():
            return JsonResponse({"success": False})

        try:
            session = UserSession.objects.get(room=room, user=request.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=room, user=request.user, board_x=0, board_y=0, board_scale=1)

        return {
            "title": room.name,
            "background": room.defaultBackground,
            "border": room.defaultBorder,
            "characters": dict((c.identifier, c.to_dict()) for c in room.character_set.all()),
            "tiles": dict((f"{t.x} | {t.y}", {"x": t.x, "y": t.y, "border": t.border, "background": t.background}) for t in room.tile_set.all()),
            "images": dict((i.identifier, i.to_dict()) for i in room.image_set.all()),

            # User session
            "x": session.board_x,
            "y": session.board_y,
            "scale": session.board_scale,
        }

    def get(self, request, *args, room: str = None, **kwargs):
        return JsonResponse(self.get_data(request, get_object_or_404(Room, identifier=room)))
