# Generated by Django 3.1.5 on 2021-01-31 14:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('board', '0006_auto_20210119_1928'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='background',
            field=models.CharField(default='', max_length=255),
        ),
    ]