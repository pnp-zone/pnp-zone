from django.contrib.auth.models import User
from django.db import models
from django.db.models import OneToOneField, CharField


class AccountModel(models.Model):
    user = OneToOneField(User, on_delete=models.CASCADE)
    display_name = CharField(default="", blank=True, null=True, max_length=255)

    def __str__(self):
        return self.user.username
