from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.views import View

from accounts.models import AccountModel
from campaign.models import CampaignModel


class CreateCampaignView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        name = request.POST["name"]
        account = AccountModel.objects.get(user__username=request.user)
        campaign = CampaignModel.objects.create(name=name)
        campaign.game_master.add(account)
        campaign.save()
        return redirect(request.META["HTTP_REFERER"])
