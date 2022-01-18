from typing import Union

from django.contrib.auth.models import User
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
    lobby = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="+", null=True, blank=True)
    players = ManyToManyField(AccountModel, blank=True, related_name="campaign_players")
    game_master = ManyToManyField(AccountModel, related_name="campaign_gm")
    characters = ManyToManyField(CharacterModel, blank=True)

    def __str__(self):
        return self.name

    def is_part_of(self, user: Union[User, AccountModel], include_admin: bool = True) -> bool:
        if isinstance(user, User):
            user = AccountModel.objects.get(user=user)

        return user in self.game_master.all() \
            or user in self.players.all() \
            or (include_admin and user.user.is_superuser)
