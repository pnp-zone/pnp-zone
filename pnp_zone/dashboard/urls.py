from django.urls import path, include

import chants.urls
from dashboard.views import *


urlpatterns = [
    path("", DashboardView.as_view()),
    path("chants/", include(chants.urls))
]
