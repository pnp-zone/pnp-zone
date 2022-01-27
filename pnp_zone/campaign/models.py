from django.contrib.auth.models import User
from django.db import models
from django.db.models import CharField, OneToOneField, ManyToManyField, Q, QuerySet

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

    @property
    def moderators(self) -> QuerySet[AccountModel]:
        """
        Return a queryset of this campaign's gamemasters combined with all admins.

        :return: Queryset of moderator accounts
        :rtype: QuerySet[AccountModel]
        """
        gm = Q(campaign_gm=self)
        admin = Q(user__is_superuser=True)
        return AccountModel.objects.filter(gm | admin).distinct()

    @property
    def members(self) -> QuerySet[AccountModel]:
        """
        Return a queryset of all accounts who should have access to this campaign.

        :return: Queryset of accounts with access
        :rtype: QuerySet[AccountModel]
        """
        gm = Q(campaign_gm=self)
        player = Q(campaign_players=self)
        admin = Q(user__is_superuser=True)
        return AccountModel.objects.filter(gm | player | admin).distinct()
