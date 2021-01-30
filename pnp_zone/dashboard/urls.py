from django.urls import path, include

import character.urls
from dashboard.views import *


urlpatterns = [
    path("", DashboardView.as_view()),
    path("character/", include(character.urls)),
]
