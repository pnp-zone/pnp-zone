# Generated by Django 3.1.2 on 2020-10-06 02:10

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0005_auto_20201006_0209'),
    ]

    operations = [
        migrations.AlterField(
            model_name='charactermodel',
            name='culture',
            field=models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, to='character.culturemodel'),
        ),
        migrations.AlterField(
            model_name='charactermodel',
            name='species',
            field=models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, to='character.speciesmodel'),
        ),
    ]