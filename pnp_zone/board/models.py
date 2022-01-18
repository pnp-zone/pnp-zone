import uuid

from django.db import models
from django.contrib.auth.models import User


class ToDict(models.Model):

    class Meta:
        abstract = True

    def _dict(self):
        raise NotImplemented

    def to_dict(self, as_tuple=None):
        d = self._dict()
        if as_tuple is None:
            return d
        else:
            return tuple(d for _ in range(as_tuple))


class Room(models.Model):
    name = models.CharField(max_length=255)
    identifier = models.CharField(max_length=255, unique=True, default=uuid.uuid4, blank=True)
    campaign = models.ForeignKey("campaign.CampaignModel", on_delete=models.CASCADE, related_name="rooms")
    defaultBorder = models.CharField(max_length=255, default="black")
    defaultBackground = models.CharField(max_length=255, default="white")

    def get_absolute_url(self):
        return "/board/" + self.identifier

    @property
    def url(self):
        return self.get_absolute_url()

    def __str__(self):
        return self.name


class Character(ToDict):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=255, default="")
    name = models.CharField(max_length=255, default="Unnamed")
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=255, default="#FF0000")

    class Meta:
        unique_together = ("room", "identifier")

    def __str__(self):
        return self.name

    def _dict(self):
        return {"type": "character", "id": self.identifier, "name": self.name,
                "x": self.x, "y": self.y, "color": self.color}


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


class Image(ToDict):
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

    def __str__(self):
        return self.url

    def _dict(self, as_tuple=None):
        return {"type": "image", "id": self.identifier, "url": self.url,
                "x": self.x, "y": self.y, "width": self.width, "height": self.height, "layer": self.layer}
