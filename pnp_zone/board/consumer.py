from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from board.events import Event
from board.models import Room


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_moderator = ["reload", "new"]

    # attributes are not initialized in `__init__`,
    # but in `connect` via `database_lookups` to wait for the scope attribute
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
        # Get the event's type
        if "type" not in event:
            await self.send_json({"type": "error", "message": "Missing type attribute"})
            return
        event_type = event["type"]

        # Wrap the data with the type's class
        try:
            event_cls = Event[event_type]
        except KeyError:
            await self.send_json({"type": "error", "message": f"Unknown event type: {event_type}"})
            return

        try:
            event = event_cls(event, room=self.room)
        except ValueError as error:
            await self.send_json({"type": "error", "message": str(error)})
            return

        # Check if sender has required privileges
        if event.type in self.requires_moderator and not self.is_moderator:
            await self.send_json({"type": "error", "message": f"'{event.type}' can only be used by moderators"})
            return

        # Perform db operations
        await event.update_db()

        # Respond to sender
        response = event.response_sender()
        if response:
            await self.send_json(response)

        # Respond to / notify all users
        response = event.response_all_users()
        if response:
            await self.channel_layer.group_send(self.room.identifier, {"type": "board.event", "event": response})

    async def board_event(self, message):
        await self.send_json(message["event"])

    @database_sync_to_async
    def database_lookups(self):
        self.room = Room.objects.get(identifier=self.scope["url_route"]["kwargs"]["room"])
        self.is_moderator = self.user in self.room.moderators.all()
