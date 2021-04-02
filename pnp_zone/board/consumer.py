from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from board.events import *
from board.models import Room


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_moderator = ["new"]

    # attributes are not initialized in `__init__`,
    # but in `connect` via `database_lookups` to wait for the scope attribute
    room: Room
    is_moderator: bool

    @database_sync_to_async
    def database_lookups(self):
        """
        This method is called in `connect` after the scope attribute was set and should
        initialise all attributes which require a database lookup.
        """
        self.room = Room.objects.get(identifier=self.scope["url_route"]["kwargs"]["room"])
        self.is_moderator = self.user in self.room.moderators.all() or self.user.is_superuser

    @database_sync_to_async
    def init_events(self):
        events = []

        try:
            session = UserSession.objects.get(room=self.room, user=self.user)
        except UserSession.DoesNotExist:
            session = UserSession.objects.create(room=self.room, user=self.user, board_x=0, board_y=0, board_scale=1)
        events.append(
            UpdateSessionEvent(
                {"type": "session", "x": session.board_x, "y": session.board_y, "scale": session.board_scale},
                consumer=self
            )
        )

        for c in self.room.character_set.all():
            events.append(
                NewEvent(
                    {"type": "new", "id": c.identifier, "x": c.x, "y": c.y, "color": c.color},
                    consumer=self
                )
            )

        for t in self.room.tile_set.all():
            events.append(
                ColorTileEvent(
                    {"type": ColorTileEvent.type, "x": t.x, "y": t.y, "background": t.background, "border": t.border},
                    consumer=self
                )
            )

        events.append(
            WelcomeEvent({"type": "welcome"}, consumer=self)
        )
        return events

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

        # Send events to initialize board
        for event in await self.init_events():
            response = await event.response_sender() or await event.response_all_users()
            await self.send_json(response)

    async def receive_json(self, event, **kwargs):
        try:
            # Wrap event data with matching event class
            if "type" not in event:
                raise EventError("Missing type attribute")
            event = Event[event["type"]](event, consumer=self)

            # Check if sender has required privileges
            if event.type in self.requires_moderator and not self.is_moderator:
                await self.send_json({"type": "error", "message": f"'{event.type}' can only be used by moderators"})
                return

            # Perform db operations
            await event.update_db()

            # Respond to sender
            response = await event.response_sender()
            if response:
                await self.send_json(response)

            # Respond to / notify all users
            response = await event.response_all_users()
            if response:
                await self.channel_layer.group_send(self.room.identifier, {"type": "board.event", "event": response})

        except EventError as err:
            await self.send_json({"type": "error", "message": str(err)})

    async def board_event(self, message):
        await self.send_json(message["event"])
