from django.urls import path

from campaign.views import *


urlpatterns = [
    path("create", CreateCampaignView.as_view()),
    path("show/<str:cid>/createBoard", CreateBoardView.as_view()),
    path("show/<str:cid>", ShowCampaignView.as_view()),
    path("show/<str:cid>/joinBBB", JoinBBB.as_view()),
]
