from typing import Optional

from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from board.events import event_handlers, EventError
from board.models import Room
from campaign.models import CampaignModel


class BoardConsumer(AsyncJsonWebsocketConsumer):

    requires_moderator = ["new"]

    # attributes are not initialized in `__init__`,
    # but in `connect` via `database_lookups` to wait for the scope attribute
    room: Room
    is_moderator: bool
    campaign: Optional[CampaignModel] = None

    @database_sync_to_async
    def database_lookups(self):
        """
        This method is called in `connect` after the scope attribute was set and should
        initialise all attributes which require a database lookup.
        """
        self.room = Room.objects.select_related("campaign").get(identifier=self.scope["url_route"]["kwargs"]["room"])
        self.is_moderator = self.user.is_superuser or self.room.campaign.game_master.filter(account__user=self.user).exists()

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
        try:
            # Wrap event data with matching event class
            if "type" not in event:
                raise EventError("Missing type attribute")
            handler = event_handlers[event["type"]]

            # Check if sender has required privileges
            if hasattr(handler, "moderators_only") and not self.is_moderator:
                await self.send_json({"type": "error", "message": f"'{event['type']}' can only be used by moderators"})
                return

            # Run the event handler
            try:
                response_sender, response_others = await handler(self.room, self.user, event)
            except KeyError as err:
                raise EventError(f"Missing attribute {err} for event '{event['type']}'")

            # Respond to sender
            if response_sender:
                await self.send_json(response_sender)

            # Respond to / notify all users
            if response_others:
                await self.channel_layer.group_send(
                    self.room.identifier,
                    {"type": "board.event", "event": response_others, "consumer": self.channel_name}
                )

        except EventError as err:
            await self.send_json({"type": "error", "message": str(err)})

    async def board_event(self, message):
        if message["consumer"] != self.channel_name:
            await self.send_json(message["event"])
