import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User


def uuid4():
    return str(uuid.uuid4())


class Room(models.Model):
    name = models.CharField(max_length=255)
    identifier = models.CharField(max_length=255, unique=True, default=uuid4, blank=True)
    campaign = models.ForeignKey("campaign.CampaignModel", on_delete=models.CASCADE, related_name="rooms")
    defaultBorder = models.CharField(max_length=255, default="black")
    defaultBackground = models.CharField(max_length=255, default="white")
    last_modified = models.DateTimeField(auto_now=True)

    @staticmethod
    def create_with_layers(**kwargs):
        room = Room.objects.create(**kwargs)
        ImageLayer.objects.create(room=room, level=-1, identifier="background-images", name="Background Images")
        TileLayer.objects.create(room=room, level=0, identifier="tiles", name="Colored Tiles")
        ImageLayer.objects.create(room=room, level=1, identifier="foreground-images", name="Foreground Images")
        CharacterLayer.objects.create(room=room, level=2, identifier="characters", name="Character Tokens")
        return room

    def get_absolute_url(self):
        return "/board/" + self.identifier

    @property
    def url(self):
        return self.get_absolute_url()

    def __str__(self):
        return self.name


def not_zero(value):
    if value == 0:
        raise ValidationError("0 is not a valid level")


class Layer(models.Model):
    component_type: str = NotImplemented
    children = NotImplemented  # Be sure to make the ForeignKey relation name be children
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=255, default=uuid4, blank=True)
    name = models.CharField(max_length=255, default="Unnamed layer", blank=True)
    level = models.IntegerField(validators=[not_zero])

    class Meta:
        unique_together = ("room", "identifier")

    def to_dict(self):
        return {"type": self.component_type, "level": self.level, "name": self.name,
                "children": dict((child.identifier, child.to_dict()) for child in self.children.all())}

    def __str__(self):
        return f"{self.level} - {self.identifier[:8]}{'...' if len(self.identifier) > 8 else ''}"


class CharacterLayer(Layer):
    component_type: str = "character"


class Character(models.Model):
    layer = models.ForeignKey(CharacterLayer, on_delete=models.CASCADE, related_name="children")
    identifier = models.CharField(max_length=255, default=uuid4, blank=True)
    name = models.CharField(max_length=255, default="Unnamed")
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=255, default="#FF0000")

    class Meta:
        unique_together = ("layer", "identifier")

    def __str__(self):
        return self.name

    def to_dict(self):
        return {"id": self.identifier, "name": self.name,
                "x": self.x, "y": self.y, "color": self.color}


class TileLayer(Layer):
    component_type: str = "tile"


class Tile(models.Model):
    layer = models.ForeignKey(TileLayer, on_delete=models.CASCADE, related_name="children")
    x = models.IntegerField()
    y = models.IntegerField()
    background = models.CharField(max_length=255, default="white", blank=True)
    border = models.CharField(max_length=255, default="black", blank=True)

    class Meta:
        unique_together = ("layer", "x", "y")

    @property
    def identifier(self):
        return str(self)

    def __str__(self):
        return f"{self.x} {self.y}"

    def to_dict(self):
        return {"x": self.x, "y": self.y, "background": self.background, "border": self.border}


class UserSession(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board_x = models.IntegerField(default=0, blank=True)
    board_y = models.IntegerField(default=0, blank=True)
    board_scale = models.FloatField(default=1, blank=True)

    class Meta:
        unique_together = ("room", "user")

    def __str__(self):
        return f"{self.user} in {self.room}"


class ImageLayer(Layer):
    component_type: str = "image"


class Image(models.Model):
    layer = models.ForeignKey(ImageLayer, on_delete=models.CASCADE, related_name="children")
    identifier = models.CharField(max_length=255, default=uuid4, blank=True)
    url = models.CharField(max_length=255, default="")
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()

    class Meta:
        unique_together = ("layer", "identifier")

    def __str__(self):
        return self.url

    def to_dict(self):
        return {"id": self.identifier, "url": self.url,
                "x": self.x, "y": self.y, "width": self.width, "height": self.height}
