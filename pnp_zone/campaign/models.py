from django.db import models
from django.db.models import CharField, OneToOneField, ManyToManyField

from accounts.models import AccountModel


class CharacterModel(models.Model):
    character_name = CharField(default="", max_length=255)
    creator = OneToOneField(AccountModel, on_delete=models.CASCADE)

    def __str__(self):
        return self.character_name


class CampaignModel(models.Model):
    name = CharField(default="", max_length=255)
    players = ManyToManyField(AccountModel, blank=True, related_name="campaign_players")
    game_master = ManyToManyField(AccountModel, related_name="campaign_gm")
    characters = ManyToManyField(CharacterModel, blank=True)

    def __str__(self):
        return self.name
