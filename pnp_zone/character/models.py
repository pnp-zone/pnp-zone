from django.db import models
from django.db.models import CharField, ForeignKey, IntegerField, ManyToManyField


class DisadvantageModel(models.Model):
    name = CharField(max_length=255)
    description = CharField(max_length=1024, default="")
    adventurer_point_cost = IntegerField()

    def __str__(self):
        return self.name


class AdvantageModel(models.Model):
    name = CharField(max_length=255)
    description = CharField(max_length=1024, default="")
    adventurer_point_cost = IntegerField()

    def __str__(self):
        return self.name


class SpeciesModel(models.Model):
    name = CharField(max_length=255)
    health_base = IntegerField()
    soul_resistance_base = IntegerField()
    body_resistance_base = IntegerField()
    speed_base = IntegerField()
    ability_max_modifier = CharField(max_length=255, default="")
    advantages = ManyToManyField(AdvantageModel, blank=True)
    disadvantages = ManyToManyField(DisadvantageModel, blank=True)
    adventurer_point_cost = IntegerField()

    def __str__(self):
        return self.name


class CultureModel(models.Model):
    name = CharField(max_length=255)
    description = CharField(max_length=1024, default="")

    def __str__(self):
        return self.name


class CharacterModel(models.Model):
    name = CharField(max_length=255)
    family = CharField(max_length=255, default="", blank=True)
    birth_date = CharField(max_length=255, default="", blank=True)
    birth_place = CharField(max_length=255, default="", blank=True)
    age = IntegerField(default=0, blank=True)
    hair_color = CharField(max_length=255, default="", blank=True)
    species = ForeignKey(SpeciesModel, on_delete=models.CASCADE, null=True, blank=True)
    culture = ForeignKey(CultureModel, on_delete=models.CASCADE, null=True, blank=True)
    title = CharField(max_length=255, default="", blank=True)
    characteristics = CharField(max_length=255, default="", blank=True)
    other = CharField(max_length=255, default="", blank=True)

    def __str__(self):
        return self.name


class BaseSpellModel(models.Model):
    class Meta:
        abstract = True

    name = CharField(max_length=255, default="")
    description = CharField(max_length=1024, default="")
    trial = CharField(max_length=255, default="")
    effect = CharField(max_length=1024, default="")
    casting_time = CharField(max_length=255, default="")
    casting_cost = CharField(max_length=255, default="")
    range = CharField(max_length=255, default="")
    duration = CharField(max_length=255, default="")
    target_category = CharField(max_length=255, default="")
    aspect = CharField(max_length=255, default="")
    spread = CharField(max_length=255, default="")
    leveling_cost = CharField(max_length=255, default="")
    rule_book = CharField(max_length=255, default="")

    def __str__(self):
        return self.name


class ChantModel(BaseSpellModel):
    pass


class CeremonyModel(BaseSpellModel):
    pass


class BaseSpellExtensionModel(models.Model):
    class Meta:
        abstract = True

    name = CharField(max_length=255, null=False)
    description = CharField(max_length=255)
    required_skill_value = IntegerField()
    adventurer_point_cost = IntegerField()
    rule_book = CharField(max_length=255, default="")

    def __str__(self):
        return self.name


class ChantExtensionModel(BaseSpellExtensionModel):
    chant = ForeignKey(ChantModel, on_delete=models.CASCADE)


class CeremonyExtensionModel(BaseSpellExtensionModel):
    ceremony = ForeignKey(CeremonyModel, on_delete=models.CASCADE)
