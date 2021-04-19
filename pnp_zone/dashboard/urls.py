from django.urls import path, include

from dashboard.views import *


urlpatterns = [
    path("", DashboardView.as_view()),
]
