from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView

from campaign.models import CampaignModel
from pnp_zone import menu


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/index.html"

    def get(self, request, *args, **kwargs):
        campaigns = CampaignModel.objects.all()
        return render(
            request, self.template_name,
            {
                "title": "here be dragons",
                "menu": menu.get("/"),
                "campaign_list": [x for x in campaigns if x.is_part_of(request.user.username)],
            })
