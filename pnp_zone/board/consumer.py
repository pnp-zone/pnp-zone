from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from board.models import Character


class BoardConsumer(AsyncJsonWebsocketConsumer):

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

        await self.accept()

    async def receive_json(self, content, **kwargs):
        await self._move_character(room=self.room, **content)
        await self.channel_layer.group_send(self.room, {"type": "board.event", "event": content})

    async def board_event(self, obj):
        await self.send_json(obj["event"])

    @database_sync_to_async
    def _move_character(self, /, room, id, x, y, **kwargs):
        character = Character.objects.get(room=room, identifier=id)
        character.x = x
        character.y = y
        character.save()
