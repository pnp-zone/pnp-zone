# Generated by Django 3.1.2 on 2020-10-06 02:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0002_auto_20201006_0202'),
    ]

    operations = [
        migrations.RenameField(
            model_name='spellextensionmodel',
            old_name='_spell',
            new_name='spell',
        ),
    ]
