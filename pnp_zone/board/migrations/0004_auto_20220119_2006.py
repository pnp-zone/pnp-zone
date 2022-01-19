# Generated by Django 3.2 on 2022-01-19 20:06

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('board', '0003_alter_tile_unique_together'),
    ]

    operations = [
        migrations.AlterField(
            model_name='character',
            name='identifier',
            field=models.CharField(blank=True, default=uuid.uuid4, max_length=255),
        ),
        migrations.AlterField(
            model_name='image',
            name='height',
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name='image',
            name='identifier',
            field=models.CharField(blank=True, default=uuid.uuid4, max_length=255),
        ),
        migrations.AlterField(
            model_name='image',
            name='url',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='image',
            name='width',
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name='tile',
            name='background',
            field=models.CharField(blank=True, default='white', max_length=255),
        ),
    ]
