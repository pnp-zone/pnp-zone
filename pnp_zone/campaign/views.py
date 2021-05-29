import hashlib
import uuid

from bigbluebutton_api_python import BigBlueButton
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import redirect, render
from django.views import View
from django.views.generic import TemplateView

from accounts.models import AccountModel
from board.models import Room
from campaign.models import CampaignModel
from pnp_zone import settings


class CreateCampaignView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        name = request.POST["name"]
        account = AccountModel.objects.get(user__username=request.user)
        campaign = CampaignModel.objects.create(name=name)
        campaign.game_master.add(account)
        campaign.save()
        return redirect(f"/campaign/show/{campaign.id}")


class ShowCampaignView(LoginRequiredMixin, TemplateView):
    template_name = "campaign/show.html"

    def post(self, request, cid="", *args, **kwargs):
        try:
            campaign = CampaignModel.objects.get(id=cid)
        except CampaignModel.DoesNotExist:
            return Http404

        if "invite" in request.POST:
            try:
                account = AccountModel.objects.get(user__username=request.POST["invite"])
                campaign.players.add(account)
            except AccountModel.DoesNotExist:
                pass

        return HttpResponseRedirect(request.path)

    def get(self, request, cid="", *args, **kwargs):
        try:
            campaign = CampaignModel.objects.get(id=cid)
        except CampaignModel.DoesNotExist:
            return Http404

        return render(request, self.template_name, {
            "title": campaign.name,
            "added_players": campaign.players.all(),
            "added_gamemasters": campaign.game_master.all(),
            "not_added_players": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "not_added_gamemasters": AccountModel.objects.exclude(user__username__in=[x.user.username for x in campaign.players.all()]),
            "boards": campaign.room.all(),
            "cid": campaign.id,
        })


class CreateBoardView(LoginRequiredMixin, View):

    def post(self, request, cid="", *args, **kwargs):
        try:
            campaign = CampaignModel.objects.get(id=cid)
        except CampaignModel.DoesNotExist:
            return Http404
        room = Room.objects.create(name=request.POST["name"], identifier=uuid.uuid4())
        room.save()
        campaign.room.add(room)
        campaign.save()
        return redirect(request.META["HTTP_REFERER"])


class JoinBBB(LoginRequiredMixin, View):

    def post(self, request, cid="", *args, **kwargs):
        try:
            campaign = CampaignModel.objects.get(id=cid)
        except CampaignModel.DoesNotExist:
            return Http404
        try:
            account = AccountModel.objects.get(user__username=request.user)
        except AccountModel.DoesNotExist:
            return Http404

        bbb = BigBlueButton(settings.BBB_HOST, settings.BBB_SECRET)
        # TODO: INSECURE AS SHIT
        attendee = hashlib.md5((campaign.name + "mod").encode("utf-8")).hexdigest().replace("&", "-")
        moderator = hashlib.md5((campaign.name + "att").encode("utf-8")).hexdigest().replace("&", "-")
        meeting_id = hashlib.md5(campaign.name.encode("utf-8")).hexdigest().replace("&", "-")

        try:
            bbb.create_meeting(meeting_id, params={"attendeePW": attendee, "moderatorPW": moderator})
        except Exception:
            pass

        is_moderator = request.user.id in [x.user.id for x in campaign.game_master.all()] or request.user.is_superuser
        url = bbb.get_join_meeting_url(request.POST["name"], meeting_id, moderator if is_moderator else attendee)
        return redirect(url)
