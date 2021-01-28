# Generated by Django 3.1.2 on 2020-10-08 03:35

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0028_auto_20201008_0304'),
    ]

    operations = [
        migrations.RenameField(
            model_name='blessingsmodel',
            old_name='aspect',
            new_name='spread',
        ),
        migrations.CreateModel(
            name='SpellModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('description', models.TextField(default='')),
                ('trial', models.CharField(default='', max_length=255)),
                ('effect', models.TextField(default='')),
                ('casting_time', models.CharField(default='', max_length=255)),
                ('casting_cost', models.CharField(default='', max_length=255)),
                ('range', models.CharField(default='', max_length=255)),
                ('duration', models.CharField(default='', max_length=255)),
                ('target_category', models.CharField(default='', max_length=255)),
                ('spread', models.CharField(default='', max_length=255)),
                ('leveling_cost', models.CharField(default='', max_length=255)),
                ('attribute', models.CharField(default='', max_length=255)),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SpellExtensionModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
                ('spell', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='character.spellmodel')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RitualModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('description', models.TextField(default='')),
                ('trial', models.CharField(default='', max_length=255)),
                ('effect', models.TextField(default='')),
                ('casting_time', models.CharField(default='', max_length=255)),
                ('casting_cost', models.CharField(default='', max_length=255)),
                ('range', models.CharField(default='', max_length=255)),
                ('duration', models.CharField(default='', max_length=255)),
                ('target_category', models.CharField(default='', max_length=255)),
                ('spread', models.CharField(default='', max_length=255)),
                ('leveling_cost', models.CharField(default='', max_length=255)),
                ('attribute', models.CharField(default='', max_length=255)),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RitualExtensionModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('ritual', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='character.ritualmodel')),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CantripModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('effect', models.TextField()),
                ('range', models.CharField(default='', max_length=255)),
                ('duration', models.CharField(default='', max_length=255)),
                ('target_category', models.CharField(default='', max_length=255)),
                ('spread', models.CharField(default='', max_length=255)),
                ('attribute', models.CharField(default='', max_length=255)),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
