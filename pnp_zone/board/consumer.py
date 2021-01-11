from channels.exceptions import InvalidChannelLayerError
from channels.generic.websocket import AsyncJsonWebsocketConsumer


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

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        await self.channel_layer.group_send(self.room, {"type": "chat.message", "message": text_data})

    async def chat_message(self, obj):
        await self.send(obj["message"])
