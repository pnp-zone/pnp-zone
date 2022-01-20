from django.urls import path

from campaign.views import *


urlpatterns = [
    path("create", CreateCampaignView.as_view()),
    path("show/<str:cid>/boards", ManageBoardView.as_view()),
    path("show/<str:cid>", ShowCampaignView.as_view()),
]

if settings.BBB_INTEGRATION:
    urlpatterns.append(
        path("show/<str:cid>/joinBBB", JoinBBBView.as_view())
    )
