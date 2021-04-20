from django.contrib import admin
from django.contrib.admin import ModelAdmin

from campaign.models import *


@admin.register(CampaignModel)
class CampaignAdmin(ModelAdmin):
    list_display = ("__str__",)
