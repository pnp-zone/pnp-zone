# Generated by Django 3.2 on 2022-01-18 15:50

from django.db import migrations, models
import django.db.models.deletion


def task(*args):
    from board.models import Room

    for room in Room.objects.all():
        campaign = room.campaignmodel_set.first()
        if campaign is None:
            room.delete()
        else:
            room.campaign = campaign
            room.save()


class Migration(migrations.Migration):

    dependencies = [
        ('campaign', '0005_campaignmodel_lobby'),
        ('board', '0022_alter_room_identifier'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='campaign',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='rooms', to='campaign.campaignmodel'),
            preserve_default=False,
        ),
        migrations.RunPython(task),
    ]
