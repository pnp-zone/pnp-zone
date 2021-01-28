# Generated by Django 3.1.2 on 2020-10-19 07:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0037_auto_20201015_1857'),
    ]

    operations = [
        migrations.CreateModel(
            name='LevelingCostModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(default='', max_length=255)),
                ('increase_after', models.IntegerField()),
                ('base', models.IntegerField()),
            ],
        ),
    ]