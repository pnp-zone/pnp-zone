import re

from django.db import models
from django.db.models import CharField, ForeignKey, IntegerField, ManyToManyField, TextField, BooleanField


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


class CheckModel(models.Model):
    fst = ForeignKey(AttributeModel, related_name="fst_attribute", on_delete=models.CASCADE)
    snd = ForeignKey(AttributeModel, related_name="snd_attribute", on_delete=models.CASCADE)
    trd = ForeignKey(AttributeModel, related_name="trd_attribute", on_delete=models.CASCADE)

    def __iter__(self):
        yield self.fst
        yield self.snd
        yield self.trd

    def __str__(self):
        return "/".join(map(str, self))

    @staticmethod
    def from_string(string):
        match = re.findall("(\w+)/(\w+)/(\w+)", string)
        if match is None:
            raise ValueError()

        fst, snd, trd = match[0]
        check, new = CheckModel.objects.get_or_create(
            fst=AttributeModel.objects.get(abbreviation=fst),
            snd=AttributeModel.objects.get(abbreviation=snd),
            trd=AttributeModel.objects.get(abbreviation=trd)
        )
        if new:
            check.save()
        return check


class LevelingCostModel(models.Model):
    label = CharField(max_length=255, default="")
    increase_after = IntegerField()
    base = IntegerField()

    def for_level(self, lvl):
        if lvl < self.increase_after:
            return self.base * (lvl - self.increase_after + 1)
        else:
            return self.base

    def __str__(self):
        return self.label


class SkillTypeModel(models.Model):
    name = CharField(max_length=255, default="")

    def __str__(self):
        return self.name


class SkillModel(models.Model):
    name = CharField(max_length=255, default="")
    type = ForeignKey(SkillTypeModel, on_delete=models.CASCADE, null=True)

    trial = ForeignKey(CheckModel, on_delete=models.CASCADE, null=True)
    """what to roll on"""
    applications = CharField(max_length=255, default="")
    """comma separated list of subfield this skill applies to"""
    encumbrance = CharField(max_length=255, default="")
    """whether the skill is affected by encumbrance"""
    tools = CharField(max_length=255, default="")
    """"""
    quality = CharField(max_length=255, default="")
    """what better quality means for a success"""
    failed_check = CharField(max_length=255, default="")
    """what happens on a failed check"""
    critical_success = CharField(max_length=255, default="")
    """what happens on a critical success"""
    critical_failure = CharField(max_length=255, default="")
    """what happens on a critical failure"""
    leveling_cost = ForeignKey(LevelingCostModel, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name
