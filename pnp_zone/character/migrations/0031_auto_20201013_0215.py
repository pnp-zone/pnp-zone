# Generated by Django 3.1.2 on 2020-10-13 02:15

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0030_auto_20201013_0039'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='ceremonymodel',
            name='aspect',
        ),
        migrations.RemoveField(
            model_name='ceremonymodel',
            name='source',
        ),
        migrations.DeleteModel(
            name='CeremonyExtensionModel',
        ),
        migrations.DeleteModel(
            name='CeremonyModel',
        ),
    ]
