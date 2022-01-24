import hashlib

from bigbluebutton_api_python import BigBlueButton
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.http import HttpResponseRedirect, HttpRequest
from django.shortcuts import redirect, render, get_object_or_404
from django.views import View
from django.views.generic import TemplateView

from accounts.models import AccountModel
from board.models import Room
from campaign.models import CampaignModel, CharacterModel


class CreateCampaignView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        campaign = CampaignModel.objects.create(name=request.POST["name"])
        campaign.lobby = Room.create_with_layers(name="Lobby", campaign=campaign)
        campaign.save()
        campaign.game_master.add(AccountModel.objects.get(user=request.user))
        return redirect(f"/campaign/show/{campaign.id}")


class DeleteCampaignView(LoginRequiredMixin, View):

    def post(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        if campaign.moderators.filter(user=request.user).exists():
            campaign.delete()
            return redirect("/")
        else:
            raise PermissionDenied("You are not allowed to delete this campaign!")


class ShowCampaignView(LoginRequiredMixin, TemplateView):
    template_name = "campaign/show.html"

    def post(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        try:
            account = campaign.members.select_related("user").get(user=request.user)
        except AccountModel.DoesNotExist:
            raise PermissionDenied("You are not part of this campaign!")

        if "invite" in request.POST:
            try:
                campaign.players.add(
                    AccountModel.objects.get(user__username=request.POST["invite"])  # TODO use id not name!
                )
            except AccountModel.DoesNotExist:
                pass

        if "character_name" in request.POST:
            character = campaign.characters.filter(creator=account).first()
            if character is None:
                campaign.characters.add(
                    CharacterModel.objects.create(creator=account, character_name=request.POST["character_name"])
                )
            else:
                character.character_name = request.POST["character_name"]
                character.save()

        return HttpResponseRedirect(request.path)

    def get(self, request: HttpRequest, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        try:
            account = campaign.members.select_related("user").get(user=request.user)
        except AccountModel.DoesNotExist:
            raise PermissionDenied("You are not part of this campaign!")
        character = campaign.characters.filter(creator=account).first()

        return render(request, self.template_name, {
            "title": campaign.name,
            "is_moderator": account in campaign.moderators,
            "added_players": campaign.players.all(),
            "added_gamemasters": campaign.game_master.all(),
            "not_added_players": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "not_added_gamemasters": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "boards": campaign.rooms.all(),
            "lobby": campaign.lobby,
            "bbb": settings.BBB_INTEGRATION,
            "character_name": character.character_name if character is not None else "",
            "cid": campaign.id,
        })


class ManageBoardView(LoginRequiredMixin, View):

    def post(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        if not campaign.moderators.filter(user=request.user).exists():
            raise PermissionDenied("You are not allowed to modify this campaign's boards")

        action = request.POST["action"]
        name = request.POST.get("name", None)
        identifier = request.POST.get("identifier", None)

        if action == "create":
            Room.create_with_layers(name=name, campaign=campaign)
        elif action == "delete":
            Room.objects.filter(identifier=identifier).delete()

        return redirect(request.META["HTTP_REFERER"])


class JoinBBBView(LoginRequiredMixin, View):

    def get(self, request, cid="", *args, **kwargs):
        campaign = get_object_or_404(CampaignModel, id=cid)
        try:
            account = campaign.members.select_related("user").get(user=request.user)
        except AccountModel.DoesNotExist:
            raise PermissionDenied("You are not part of this campaign!")
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

        return bbb.get_join_meeting_url(name, meeting_id, moderator if account in campaign.moderators else attendee)
