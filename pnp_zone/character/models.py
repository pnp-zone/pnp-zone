from django.db import models
from django.db.models import CharField, DateField, ForeignKey, IntegerField, ManyToManyField


class DisadvantageModel(models.Model):
    name = CharField(max_length=255, null=False)
    description = CharField(max_length=1024, default="")
    adventurer_point_cost = IntegerField()


class AdvantageModel(models.Model):
    name = CharField(max_length=255, null=False)
    description = CharField(max_length=1024, default="")
    adventurer_point_cost = IntegerField()


class SpeciesModel(models.Model):
    name = CharField(max_length=255, null=False)
    health_base = IntegerField()
    soul_resistance_base = IntegerField()
    body_resistance_base = IntegerField()
    speed_base = IntegerField()
    ability_max_modifier = CharField(max_length=255, default="")
    advantages = ManyToManyField(AdvantageModel, on_delete=models.CASCADE)
    disadvantages = ManyToManyField(DisadvantageModel, on_delete=models.CASCADE)
    adventurer_point_cost = IntegerField()


class CultureModel(models.Model):
    name = CharField(max_length=255, null=False)
    description = CharField(max_length=1024, default="")


class CharacterModel(models.Model):
    name = CharField(max_length=255, null=False)
    family = CharField(max_length=255, default="")
    birth_date = DateField()
    hair_color = CharField(max_length=255, default="")
    species = ForeignKey(SpeciesModel, on_delete=models.CASCADE)
    culture = ForeignKey(CultureModel, on_delete=models.CASCADE)
    title = CharField(max_length=255, default="")

