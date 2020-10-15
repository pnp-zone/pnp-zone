from django.db import models
from django.db.models import CharField, ForeignKey, IntegerField, ManyToManyField, TextField


class DisadvantageModel(models.Model):
    name = CharField(max_length=255)
    description = TextField(default="")
    adventurer_point_cost = IntegerField()

    def __str__(self):
        return self.name


class AdvantageModel(models.Model):
    name = CharField(max_length=255)
    description = TextField(default="")
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
    description = TextField(default="")

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


class RulebookModel(models.Model):
    name = CharField(max_length=255, default="")
    cover = CharField(max_length=255, default="", blank=True)

    def __str__(self):
        return self.name


class PageModel(models.Model):
    page = IntegerField(unique=True)

    def __str__(self):
        return f"Page {self.page}"


class SourceModel(models.Model):
    book = ForeignKey(RulebookModel, on_delete=models.CASCADE)
    page = ForeignKey(PageModel, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.book}, page {self.page.page}"


class GodModel(models.Model):
    name = CharField(max_length=255, default="")

    def __str__(self):
        return self.name


class GodAspectModel(models.Model):
    name = CharField(max_length=255, default="")
    god = ForeignKey(GodModel, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.god} ({self.name})"


class AttributeModel(models.Model):
    name = CharField(max_length=255, default="")
    abbreviation = CharField(max_length=255, default="")

    def __str__(self):
        return self.abbreviation


# Base for magic and holy casting
class BaseSpellModel(models.Model):
    class Meta:
        abstract = True

    name = CharField(max_length=255, default="")
    description = TextField(default="")
    trial = CharField(max_length=255, default="")
    effect = TextField(default="")
    casting_time = CharField(max_length=255, default="")
    casting_cost = CharField(max_length=255, default="")
    range = CharField(max_length=255, default="")
    duration = CharField(max_length=255, default="")
    target_category = CharField(max_length=255, default="")
    leveling_cost = CharField(max_length=255, default="")
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name


class BaseSpellExtensionModel(models.Model):
    class Meta:
        abstract = True

    name = CharField(max_length=255)
    description = TextField()
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)


class BaseCantripModel(models.Model):
    class Meta:
        abstract = True

    name = CharField(max_length=255, default="")
    effect = TextField()
    range = CharField(max_length=255, default="")
    duration = CharField(max_length=255, default="")
    target_category = CharField(max_length=255, default="")
    spread = CharField(max_length=255, default="")
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name


# Magical Stuff
class SpellModel(BaseSpellModel):
    spread = CharField(max_length=255, default="")
    attribute = CharField(max_length=255, default="")


class RitualModel(BaseSpellModel):
    spread = CharField(max_length=255, default="")
    attribute = CharField(max_length=255, default="")


class SpellExtensionModel(BaseSpellExtensionModel):
    spell = ForeignKey(SpellModel, on_delete=models.CASCADE)


class RitualExtensionModel(BaseSpellExtensionModel):
    ritual = ForeignKey(RitualModel, on_delete=models.CASCADE)


class CantripModel(BaseCantripModel):
    attribute = CharField(max_length=255, default="")

