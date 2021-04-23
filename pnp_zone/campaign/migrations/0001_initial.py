# Generated by Django 3.2 on 2021-04-20 12:35

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CharacterModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('character_name', models.CharField(default='', max_length=255)),
                ('creator', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='accounts.accountmodel')),
            ],
        ),
        migrations.CreateModel(
            name='CampaignModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('characters', models.ManyToManyField(blank=True, to='campaign.CharacterModel')),
                ('game_master', models.ManyToManyField(related_name='campaign_gm', to='accounts.AccountModel')),
                ('players', models.ManyToManyField(blank=True, related_name='campaign_players', to='accounts.AccountModel')),
            ],
        ),
    ]