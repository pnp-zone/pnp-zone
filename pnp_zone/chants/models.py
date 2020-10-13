from django.db import models
from django.db.models import CharField, TextField, ForeignKey, ManyToManyField

from character.models import SourceModel, GodAspectModel


class ChantModel(models.Model):
    name = CharField(max_length=255, default="")
    description = TextField(default="")
    trial = CharField(max_length=255, default="")
    effect = TextField(default="")
    casting_time = CharField(max_length=255, default="")
    casting_cost = CharField(max_length=255, default="")
    range = CharField(max_length=255, default="")
    duration = CharField(max_length=255, default="")
    target_category = CharField(max_length=255, default="")
    aspects = ManyToManyField(GodAspectModel)
    leveling_cost = CharField(max_length=255, default="")
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name


class ChantExtensionModel(models.Model):
    name = CharField(max_length=255)
    description = TextField()
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)
    chant = ForeignKey(ChantModel, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
