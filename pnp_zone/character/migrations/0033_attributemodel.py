# Generated by Django 3.1.2 on 2020-10-15 17:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('character', '0032_delete_blessingsmodel'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttributeModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=255)),
                ('abbreviation', models.CharField(default='', max_length=255)),
            ],
        ),
    ]
