from django.db import models


class Character(models.Model):
    room = models.CharField(max_length=255)
    identifier = models.CharField(max_length=255)
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=255)

    class Meta:
        unique_together = ("room", "identifier")

    def __str__(self):
        return self.identifier
