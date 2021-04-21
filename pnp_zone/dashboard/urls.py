from django.urls import path

from dashboard.views import *


urlpatterns = [
    path("", DashboardView.as_view()),
]
