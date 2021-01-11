from django.urls import path

from dm.views import *


urlpatterns = [
    path('', IndexView.as_view())
]
