import hashlib
import json

from bigbluebutton_api_python import BigBlueButton
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views import View
from django.views.generic import TemplateView
from django.http.response import Http404, HttpResponse, JsonResponse

from board.models import Room, UserSession
from campaign.models import CampaignModel
from pnp_zone import menu
from accounts.models import AccountModel


def bbb_join_link(account: AccountModel, campaign: CampaignModel):
    character = campaign.characters.filter(creator=account).first()
    if character:
        name = character.character_name
    elif account.display_name:
        name = account.display_name
    else:
        name = account.user.username

    bbb = BigBlueButton(settings.BBB_HOST, settings.BBB_SECRET)
    # TODO: INSECURE AS SHIT
    attendee = hashlib.md5((campaign.name + "mod").encode("utf-8")).hexdigest().replace("&", "-")
    moderator = hashlib.md5((campaign.name + "att").encode("utf-8")).hexdigest().replace("&", "-")
    meeting_id = hashlib.md5(campaign.name.encode("utf-8")).hexdigest().replace("&", "-")

    try:
        bbb.create_meeting(meeting_id, params={"name": campaign.name, "attendeePW": attendee, "moderatorPW": moderator})
    except Exception as err:
        pass

    is_moderator = account in campaign.game_master.all() or account.user.is_superuser
    return bbb.get_join_meeting_url(name, meeting_id, moderator if is_moderator else attendee)


class BoardView(LoginRequiredMixin, TemplateView):
    template_name = "board/board.html"

    def get(self, request, *args, **kwargs):
        room = kwargs["room"]
        account = AccountModel.objects.get(user=request.user)

        try:
            room = Room.objects.get(identifier=room)
        except Room.DoesNotExist:
            raise Http404

        campaign: CampaignModel = room.campaignmodel_set.first()
        if account not in campaign.players.all() and account not in campaign.game_master.all():
            return HttpResponse("You're not allowed in this room")

        return render(request, template_name=self.template_name, context={
            # "menu": menu.get(),  # deprecated
            "jitsi_domain": settings.JITSI_DOMAIN if settings.JITSI_INTEGRATION else None,
            "jitsi_room": settings.JITSI_PREFIX + room.identifier if settings.JITSI_INTEGRATION else None,
            "initial_data": json.dumps(BoardData.get_data(request, room=room.identifier)),
        })


class BoardData(LoginRequiredMixin, View):

    @staticmethod
    def get_data(request, room: str):
        try:
            room = Room.objects.get(identifier=room)
        except Room.DoesNotExist:
            raise Http404

        campaign: CampaignModel = room.campaignmodel_set.first()
        if not campaign.players.filter(user__username=request.user.username).exists() and \
                not campaign.game_master.filter(user__username=request.user.username).exists():
            return JsonResponse({"success": False})

        try:
            session = UserSession.objects.get(room=room, user=request.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=room, user=request.user, board_x=0, board_y=0, board_scale=1)

        return {
            # Campaign specific
            "boards": dict((b.identifier, b.name) for b in campaign.room.all()),
            "bbb": (bbb_join_link(AccountModel.objects.get(user=request.user), campaign)
                    if settings.BBB_INTEGRATION else None),
            "isModerator": request.user.is_superuser or campaign.game_master.filter(user=request.user).exists(),
            # Board specific
            "title": room.name,
            "background": room.defaultBackground,
            "border": room.defaultBorder,
            "characters": dict((c.identifier, c.to_dict()) for c in room.character_set.all()),
            "tiles": dict((f"{t.x} | {t.y}", {"x": t.x, "y": t.y, "border": t.border, "background": t.background}) for t in room.tile_set.all()),
            "images": dict((i.identifier, i.to_dict()) for i in room.image_set.all()),
            # User specific
            "x": session.board_x,
            "y": session.board_y,
            "scale": session.board_scale,
        }

    def get(self, request, *args, room: str = None, **kwargs):
        return JsonResponse(self.get_data(request, room))
