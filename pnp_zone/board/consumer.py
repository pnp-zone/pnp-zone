from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import PermissionDenied

from accounts.models import AccountModel
from board.events import event_handlers, EventError, Response
from board.models import Room


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_moderator = ["new"]

    # attributes are not initialized in `__init__`,
    # but in `connect` via `database_lookups` to wait for the scope attribute
    room: Room
    account: AccountModel
    is_moderator: bool

    @database_sync_to_async
    def database_lookups(self):
        """
        This method is called in `connect` after the scope attribute was set and should
        initialise all attributes which require a database lookup.
        """
        self.room = Room.objects.select_related("campaign").get(identifier=self.scope["url_route"]["kwargs"]["room"])
        try:
            self.account = self.room.campaign.members.select_related("user").get(user=self.scope["user"])
        except AccountModel.DoesNotExist:
            raise PermissionDenied()
        self.is_moderator = self.account in self.room.campaign.moderators

    async def connect(self):
        await super().connect()
        await self.database_lookups()

        try:
            await self.channel_layer.group_add(self.room.identifier, self.channel_name)
            await self.channel_layer.group_add(str(self.room.campaign_id), self.channel_name)
        except AttributeError:
            raise InvalidChannelLayerError(
                "BACKEND is unconfigured or doesn't support groups"
            )
        self.groups.append(self.room.identifier)
        self.groups.append(str(self.room.campaign_id))

    async def receive_json(self, event, **kwargs):
        try:
            # Get event handler registered for received type
            if "type" not in event:
                raise EventError("Missing type attribute")
            if event["type"] not in event_handlers:
                raise EventError(f"Unknown type: '{event['type']}'")
            handler = event_handlers[event["type"]]

            # Check if sender has required privileges
            if hasattr(handler, "moderators_only") and not self.is_moderator:
                await self.send_json({"type": "error", "message": f"'{event['type']}' can only be used by moderators"})
                return

            # Check if the action is allowed on the board
            if self.room.read_only and not hasattr(handler, "const"):
                await self.send_json({"type": "error", "message": f"'{event['type']}' can't be used in a read only room"})
                return

            # Run the event handler
            response: Response = await handler(self.room, self.account, event)

            # Respond to sender
            if response.sender:
                await self.send_json(response.sender)

            # Respond to / notify all users in the same room
            if response.room:
                await self.channel_layer.group_send(
                    self.room.identifier,
                    {"type": "board.event", "event": response.room, "consumer": self.channel_name}
                )

            # Respond to / notify all users in the same campaign
            if response.campaign:
                await self.channel_layer.group_send(
                    str(self.room.campaign_id),
                    {"type": "board.event", "event": response.campaign, "consumer": self.channel_name}
                )

        except EventError as err:
            await self.send_json({"type": "error", "message": str(err)})

    async def board_event(self, message):
        if message["consumer"] != self.channel_name:
            await self.send_json(message["event"])

    async def campaign_event(self, message):
        if message["consumer"] != self.channel_name:
            await self.send_json(message["event"])
