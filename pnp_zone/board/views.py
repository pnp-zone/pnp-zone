import hashlib

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
    else:
        name = account.display_name

    bbb = BigBlueButton(settings.BBB_HOST, settings.BBB_SECRET)
    # TODO: INSECURE AS SHIT
    attendee = hashlib.md5((campaign.name + "mod").encode("utf-8")).hexdigest().replace("&", "-")
    moderator = hashlib.md5((campaign.name + "att").encode("utf-8")).hexdigest().replace("&", "-")
    meeting_id = hashlib.md5(campaign.name.encode("utf-8")).hexdigest().replace("&", "-")

    try:
        bbb.create_meeting(meeting_id, params={"attendeePW": attendee, "moderatorPW": moderator})
    except Exception:
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
            "bbb_join": bbb_join_link(account, campaign) if settings.BBB_INTEGRATION else "",
        })


class BoardData(LoginRequiredMixin, View):

    def get(self, request, *args, room: str = None, **kwargs):
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

        return JsonResponse({
            "success": True,
            "x": session.board_x,
            "y": session.board_y,
            "scale": session.board_scale,
            "characters": dict((c.identifier, c.to_dict()) for c in room.character_set.all()),
            "tiles": dict((f"{t.x} | {t.y}", {"x": t.x, "y": t.y, "border": t.border, "background": t.background}) for t in room.tile_set.all()),
            "images": dict((i.identifier, i.to_dict()) for i in room.image_set.all()),
        })
