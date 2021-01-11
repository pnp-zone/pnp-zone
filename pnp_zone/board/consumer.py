from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from board.models import Character


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_auth = ["reload"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @property
    def room(self):
        return self.scope["url_route"]["kwargs"]["room"]

    async def connect(self):
        try:
            await self.channel_layer.group_add(self.room, self.channel_name)
        except AttributeError:
            raise InvalidChannelLayerError(
                "BACKEND is unconfigured or doesn't support groups"
            )
        self.groups.append(self.room)

        print(self.scope["user"])

        await self.accept()

    async def receive_json(self, event, **kwargs):
        event_type = event["type"]
        if event_type in self.requires_auth and isinstance(self.scope["user"], AnonymousUser):
            await self.send_json({"type": "error", "message": f"'{event_type}' requires authentication"})
            return

        if event_type == "move":
            await self._move_character(room=self.room, **event)

        await self.channel_layer.group_send(self.room, {"type": "board.event", "event": event})

    async def board_event(self, message):
        await self.send_json(message["event"])

    @database_sync_to_async
    def _move_character(self, /, room, id, x, y, **kwargs):
        character = Character.objects.get(room=room, identifier=id)
        character.x = x
        character.y = y
        character.save()
