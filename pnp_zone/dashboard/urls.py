from django.urls import path, include

import chants.urls
import character.urls
from dashboard.views import *


urlpatterns = [
    path("", DashboardView.as_view()),
    path("chants/", include(chants.urls)),
    path("character/", include(character.urls)),
]
