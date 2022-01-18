import hashlib

from bigbluebutton_api_python import BigBlueButton
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect, HttpRequest
from django.shortcuts import redirect, render, get_object_or_404
from django.views import View
from django.views.generic import TemplateView

from accounts.models import AccountModel
from board.models import Room
from campaign.models import CampaignModel, CharacterModel


class CreateCampaignView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        campaign = CampaignModel.objects.create(
            name=request.POST["name"],
        )
        campaign.lobby = Room.objects.create(name="Lobby", campaign=campaign)
        campaign.save()
        campaign.game_master.add(AccountModel.objects.get(user=request.user))
        return redirect(f"/campaign/show/{campaign.id}")


class ShowCampaignView(LoginRequiredMixin, TemplateView):
    template_name = "campaign/show.html"

    def post(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)

        if "invite" in request.POST:
            try:
                account = AccountModel.objects.get(user__username=request.POST["invite"])  # TODO use id not name!
                campaign.players.add(account)
            except AccountModel.DoesNotExist:
                pass

        return HttpResponseRedirect(request.path)

    def get(self, request: HttpRequest, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        account = AccountModel.objects.get(user=request.user)

        return render(request, self.template_name, {
            "title": campaign.name,
            "is_moderator": account in campaign.game_master.all() or request.user.is_superuser,
            "added_players": campaign.players.all(),
            "added_gamemasters": campaign.game_master.all(),
            "not_added_players": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "not_added_gamemasters": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "boards": campaign.rooms.all(),
            "lobby": campaign.lobby,
            "bbb": settings.BBB_INTEGRATION,
            "cid": campaign.id,
        })


class CreateBoardView(LoginRequiredMixin, View):

    def post(self, request, cid="", *args, **kwargs):
        Room.objects.create(
            name=request.POST["name"],
            campaign=get_object_or_404(CampaignModel, id=cid)
        )
        return redirect(request.META["HTTP_REFERER"])


class JoinBBBView(LoginRequiredMixin, View):

    def get(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        account = AccountModel.objects.select_related("user").get(user=request.user)
        return HttpResponseRedirect(self.get_link(campaign, account))

    @staticmethod
    def get_link(campaign: CampaignModel, account: AccountModel):
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
