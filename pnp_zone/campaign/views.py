import uuid

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404, HttpResponseRedirect, HttpRequest
from django.shortcuts import redirect, render
from django.views import View
from django.views.generic import TemplateView

from accounts.models import AccountModel
from board.models import Room
from campaign.models import CampaignModel


class CreateCampaignView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        campaign = CampaignModel.objects.create(
            name=request.POST["name"],
            lobby=Room.objects.create(name="Lobby")
        )
        campaign.game_master.add(AccountModel.objects.get(user__username=request.user))
        campaign.room.add(campaign.lobby)
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

    def get(self, request: HttpRequest, cid="", *args, **kwargs):
        try:
            campaign = CampaignModel.objects.get(id=cid)
        except CampaignModel.DoesNotExist:
            return Http404

        if not campaign.game_master.filter(user=request.user).exists():
            return redirect(campaign.lobby.get_absolute_url())
        else:
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
