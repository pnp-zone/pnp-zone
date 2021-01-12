from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from board.models import Character, Room


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_moderator = ["reload", "new"]

    # attributes are not initialized in __init__ but in connect via database_lookups to wait for scope
    room: Room
    is_moderator: bool

    @property
    def user(self):
        return self.scope["user"]

    async def connect(self):
        await super().connect()
        await self.database_lookups()

        try:
            await self.channel_layer.group_add(self.room.identifier, self.channel_name)
        except AttributeError:
            raise InvalidChannelLayerError(
                "BACKEND is unconfigured or doesn't support groups"
            )
        self.groups.append(self.room.identifier)

    async def receive_json(self, event, **kwargs):
        event_type = event["type"]
        if event_type in self.requires_moderator and not self.is_moderator:
            await self.send_json({"type": "error", "message": f"'{event_type}' can only be used by moderators"})
            return

        if event_type == "move":
            await self._move_character(**event)

        if event_type == "new":
            print(event)
            await self._new_character(**event)

        await self.channel_layer.group_send(self.room.identifier, {"type": "board.event", "event": event})

    async def board_event(self, message):
        await self.send_json(message["event"])

    @database_sync_to_async
    def _move_character(self, /, id, x, y, **_):
        character = Character.objects.get(room=self.room, identifier=id)
        character.x = x
        character.y = y
        character.save()

    @database_sync_to_async
    def _new_character(self, /, id, x, y, color, **_):
        character = Character(identifier=id, x=x, y=y, color=color, room=self.room)
        character.save()

    @database_sync_to_async
    def database_lookups(self):
        self.room = Room.objects.get(identifier=self.scope["url_route"]["kwargs"]["room"])
        self.is_moderator = self.user in self.room.moderators.all()
