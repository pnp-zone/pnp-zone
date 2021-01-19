from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    name = models.CharField(max_length=255)
    identifier = models.CharField(max_length=255, unique=True)
    moderators = models.ManyToManyField(User)

    def get_absolute_url(self):
        return "/board/" + self.identifier

    @property
    def url(self):
        return self.get_absolute_url()

    def __str__(self):
        return self.name


class Character(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=255)
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=255)

    class Meta:
        unique_together = ("room", "identifier")

    def __str__(self):
        return self.identifier
