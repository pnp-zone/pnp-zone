from django.contrib import admin
from django.contrib.admin import ModelAdmin

from accounts.models import *


@admin.register(AccountModel)
class AccountAdmin(ModelAdmin):
    list_display = ("__str__",)
