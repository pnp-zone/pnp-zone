from django.urls import path

from campaign.views import *


urlpatterns = [
    path("create", CreateCampaignView.as_view()),
]
