# Generated by Django 3.1.2 on 2020-10-08 02:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0025_blessingsmodel'),
    ]

    operations = [
        migrations.AddField(
            model_name='blessingsmodel',
            name='target_category',
            field=models.CharField(default='', max_length=255),
        ),
    ]
