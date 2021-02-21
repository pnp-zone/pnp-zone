from django.contrib import admin
from django.utils.html import format_html

from board import models


def clickable_url(obj):
    return format_html("<a href=\"{0}\">{0}</a>", obj.url)


clickable_url.__name__ = "url"


@admin.register(models.Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("__str__", clickable_url)
