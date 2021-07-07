from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    name = models.CharField(max_length=255)
    identifier = models.CharField(max_length=255, unique=True)
    defaultBorder = models.CharField(max_length=255, default="black")
    defaultBackground = models.CharField(max_length=255, default="white")

    def get_absolute_url(self):
        return "/board/" + self.identifier

    @property
    def url(self):
        return self.get_absolute_url()

    def __str__(self):
        return self.name


class Character(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=255, default="")
    name = models.CharField(max_length=255, default="Unnamed")
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=255, default="#FF0000")

    class Meta:
        unique_together = ("room", "identifier")

    def __str__(self):
        return self.identifier


class Tile(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    x = models.IntegerField()
    y = models.IntegerField()
    background = models.CharField(max_length=255, default="none", blank=True)
    border = models.CharField(max_length=255, default="black", blank=True)

    def __str__(self):
        return f"{self.x} {self.y}"


class UserSession(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board_x = models.IntegerField()
    board_y = models.IntegerField()
    board_scale = models.FloatField()

    class Meta:
        unique_together = ("room", "user")

    def __str__(self):
        return f"{self.user} in {self.room}"


class Image(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=255)
    url = models.CharField(max_length=255)
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    layer = models.CharField(max_length=1, choices=(("T", "Top"), ("M", "Middle"), ("B", "Bottom")), default="B")

    class Meta:
        unique_together = ("room", "identifier")
