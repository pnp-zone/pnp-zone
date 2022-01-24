# Generated by Django 3.2 on 2022-01-24 12:18

import board.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Character',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(blank=True, default=board.models.uuid4, max_length=255)),
                ('name', models.CharField(default='Unnamed', max_length=255)),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('color', models.CharField(default='#FF0000', max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(blank=True, default=board.models.uuid4, max_length=255)),
                ('url', models.CharField(default='', max_length=255)),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('width', models.PositiveIntegerField()),
                ('height', models.PositiveIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Layer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(blank=True, default=board.models.uuid4, max_length=255)),
                ('level', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('identifier', models.CharField(blank=True, default=board.models.uuid4, max_length=255, unique=True)),
                ('defaultBorder', models.CharField(default='black', max_length=255)),
                ('defaultBackground', models.CharField(default='white', max_length=255)),
                ('last_modified', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('background', models.CharField(blank=True, default='white', max_length=255)),
                ('border', models.CharField(blank=True, default='black', max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='CharacterLayer',
            fields=[
                ('layer_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='board.layer')),
            ],
            bases=('board.layer',),
        ),
        migrations.CreateModel(
            name='ImageLayer',
            fields=[
                ('layer_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='board.layer')),
            ],
            bases=('board.layer',),
        ),
        migrations.CreateModel(
            name='TileLayer',
            fields=[
                ('layer_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='board.layer')),
            ],
            bases=('board.layer',),
        ),
        migrations.CreateModel(
            name='UserSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('board_x', models.IntegerField()),
                ('board_y', models.IntegerField()),
                ('board_scale', models.FloatField()),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='board.room')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
