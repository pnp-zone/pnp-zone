# Generated by Django 3.1.5 on 2021-01-25 14:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('character', '0041_auto_20201021_1058'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChantModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('description', models.TextField(default='')),
                ('trial_modifier', models.CharField(default='', max_length=255)),
                ('effect', models.TextField(default='')),
                ('casting_time', models.CharField(default='', max_length=255)),
                ('casting_cost', models.CharField(default='', max_length=255)),
                ('range', models.CharField(default='', max_length=255)),
                ('duration', models.CharField(default='', max_length=255)),
                ('target_category', models.CharField(default='', max_length=255)),
                ('aspects', models.ManyToManyField(to='character.GodAspectModel')),
                ('leveling_cost', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.levelingcostmodel')),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
                ('trial', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.checkmodel')),
            ],
        ),
        migrations.CreateModel(
            name='ChantExtensionModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('chant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='wiki.chantmodel')),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
        ),
    ]