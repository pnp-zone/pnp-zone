from django import forms
from django.contrib import admin
from django.contrib.admin import ModelAdmin

from campaign.models import *


class RoomInline(admin.TabularInline):
    model = Room
    extra = 0


class CampaignForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['lobby'].queryset = Room.objects.filter(campaign_id=self.instance.id)


@admin.register(CampaignModel)
class CampaignAdmin(ModelAdmin):
    form = CampaignForm
    list_display = ("__str__",)
    inlines = (RoomInline,)
