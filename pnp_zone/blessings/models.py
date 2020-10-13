from django.db import models
from django.db.models import CharField, TextField, ForeignKey

from character.models import SourceModel


class BlessingModel(models.Model):
    name = CharField(max_length=255, default="")
    effect = TextField()
    range = CharField(max_length=255, default="")
    duration = CharField(max_length=255, default="")
    target_category = CharField(max_length=255, default="")
    spread = CharField(max_length=255, default="")
    source = ForeignKey(SourceModel, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name
