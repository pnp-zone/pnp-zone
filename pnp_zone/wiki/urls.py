from django.urls import path

from wiki.views import *


urlpatterns = [
    path('', IndexView.as_view())
]
