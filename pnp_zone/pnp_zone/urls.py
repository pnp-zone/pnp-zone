"""pnp_zone URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from pnp_zone.views import Login, Logout, permission_denied, page_not_found
import dashboard.urls
import board.urls
import campaign.urls

urlpatterns = [
    path("", include(dashboard.urls)),
    path("admin/", admin.site.urls),
    path("board/", include(board.urls)),
    path("campaign/", include(campaign.urls)),
    path("login", Login.as_view()),
    path("logout", Logout.as_view()),
]

if settings.DEBUG:
    urlpatterns.extend(
        staticfiles_urlpatterns()
    )

handler403 = permission_denied
handler404 = page_not_found
