# Generated by Django 3.1.2 on 2020-10-15 18:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0035_auto_20201015_1834'),
        ('chants', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chantmodel',
            name='trial',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='character.checkmodel'),
        ),
    ]
