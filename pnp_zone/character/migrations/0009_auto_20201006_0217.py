# Generated by Django 3.1.2 on 2020-10-06 02:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0008_auto_20201006_0216'),
    ]

    operations = [
        migrations.AlterField(
            model_name='charactermodel',
            name='culture',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='character.culturemodel'),
        ),
        migrations.AlterField(
            model_name='charactermodel',
            name='species',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='character.speciesmodel'),
        ),
    ]