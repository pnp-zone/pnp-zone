# Generated by Django 3.1.2 on 2020-10-06 03:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0012_auto_20201006_0355'),
    ]

    operations = [
        migrations.AddField(
            model_name='ceremonymodel',
            name='description',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AddField(
            model_name='chantmodel',
            name='description',
            field=models.CharField(default='', max_length=255),
        ),
    ]
