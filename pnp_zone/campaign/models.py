from django.db import models
from django.db.models import CharField, OneToOneField, ManyToManyField

from accounts.models import AccountModel
from board.models import Room


class CharacterModel(models.Model):
    character_name = CharField(default="", max_length=255)
    creator = OneToOneField(AccountModel, on_delete=models.CASCADE)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.character_name


class CampaignModel(models.Model):
    name = CharField(default="", max_length=255)
    room = ManyToManyField(Room, blank=True)
    lobby = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="+")
    players = ManyToManyField(AccountModel, blank=True, related_name="campaign_players")
    game_master = ManyToManyField(AccountModel, related_name="campaign_gm")
    characters = ManyToManyField(CharacterModel, blank=True)

    def __str__(self):
        return self.name

    def is_part_of(self, username):
        if username in [x.user.username for x in self.game_master.all()] or\
                username in [x.user.username for x in self.players.all()]:
            return True
        return False
