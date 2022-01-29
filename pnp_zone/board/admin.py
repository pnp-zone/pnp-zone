from django.contrib import admin
from django.utils.html import format_html

from board import models


def clickable_url(obj):
    return format_html("<a href=\"{0}\">{0}</a>", obj.url)


clickable_url.__name__ = "url"


@admin.register(models.Room)
class RoomAdmin(admin.ModelAdmin):
    readonly_fields = ("identifier", "last_modified")
    list_display = ("__str__", clickable_url, "last_modified")


@admin.register(models.Layer)
class LayerAdmin(admin.ModelAdmin):
    list_display = ("name", "room", "identifier", "level")


@admin.register(models.ImageLayer)
class ImageLayerAdmin(LayerAdmin):
    pass


@admin.register(models.TileLayer)
class TileLayerAdmin(LayerAdmin):
    pass


@admin.register(models.CharacterLayer)
class CharacterLayerAdmin(LayerAdmin):
    pass
