# Generated by Django 3.2 on 2022-02-05 21:38
from django.db.models import F

import board.models
from django.db import migrations, models


def increase_level(apps, _):
    Layer = apps.get_model("board", "Layer")
    Layer.objects.filter(level__gte=0).update(level=F("level")+1)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('board', '0004_auto_20220129_2242'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='layer',
            unique_together={('room', 'identifier')},
        ),
        migrations.RunPython(increase_level),
        migrations.AlterField(
            model_name='layer',
            name='level',
            field=models.IntegerField(validators=[board.models.not_zero]),
        ),
    ]