import json

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.views.generic import TemplateView
from django.http.response import HttpResponse, JsonResponse

from board.models import Room, UserSession, TileLayer, CharacterLayer, ImageLayer
from campaign.views import JoinBBBView
from accounts.models import AccountModel


class BoardView(LoginRequiredMixin, TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = get_object_or_404(Room, identifier=kwargs["room"])
        campaign = room.campaign
        try:
            account = campaign.members.select_related("user").get(user=request.user)
        except AccountModel.DoesNotExist:
            raise PermissionDenied("You are not part of this campaign!")

        return render(request, template_name=self.template_name, context={
            # "menu": menu.get(),  # deprecated
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
            "initial_board": repr(json.dumps(BoardData.get_data(request, room=room))),
            "initial_data": repr(json.dumps({
                "boards": dict((b.identifier, b.name) for b in campaign.rooms.all()),
                "bbb": (JoinBBBView.get_link(campaign, account) if settings.BBB_INTEGRATION else None),
                "isModerator": request.user.is_superuser or campaign.game_master.filter(user=request.user).exists(),
            })),
        })


class BoardData(LoginRequiredMixin, View):

    @staticmethod
    def get_data(request, room: Room):
        campaign = room.campaign
        if not campaign.members.filter(user=request.user).exists():
            return JsonResponse({"success": False})

        try:
            session = UserSession.objects.get(room=room, user=request.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=room, user=request.user, board_x=0, board_y=0, board_scale=1)

        return {
            "title": room.name,
            "background": room.defaultBackground,
            "border": room.defaultBorder,
            "layers": dict(
                ((layer.identifier, layer.to_dict())
                 for LayerModel in (TileLayer, ImageLayer, CharacterLayer)
                 for layer in LayerModel.objects.filter(room=room)),
                cursors={
                    "level": 100,
                    "type": "cursor",
                    "children": {},
                }
            ),
            # User session
            "x": session.board_x,
            "y": session.board_y,
            "scale": session.board_scale,
        }

    def get(self, request, *args, room: str = None, **kwargs):
        return JsonResponse(self.get_data(request, get_object_or_404(Room, identifier=room)))
