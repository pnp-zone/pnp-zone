# Generated by Django 3.1.2 on 2020-10-13 02:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('character', '0032_delete_blessingsmodel'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlessingModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('effect', models.TextField()),
                ('range', models.CharField(default='', max_length=255)),
                ('duration', models.CharField(default='', max_length=255)),
                ('target_category', models.CharField(default='', max_length=255)),
                ('spread', models.CharField(default='', max_length=255)),
                ('source', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='character.sourcemodel')),
            ],
        ),
    ]
