"""
This module defines the events send received over the websockets

An event is some json object sent over the websocket. It always contains a attribute type
which will determines what to do with it. The json object is called the event's data and will be
wrap with a class determined by its type.

An event class defines attributes the event requires and associate a type with it.
- The type is a string class attribute. When this string is encountered in an events data,
  this class will be used to wrap the data.
  If a class doesn't define a type, it will be considered abstract.
- To define which attributes an event should have use type annotations.
  They can be inherited.
"""

from channels.db import database_sync_to_async

from board.models import Character, Tile


class EventError(RuntimeError):
    pass


class _EventRegistry(type):
    """
    This meta class registers classes with their type attribute in a dictionary.
    It also propagates annotations down the inheritance tree.
    """
    _types = {}

    def __init__(cls, name, bases, dct):
        super().__init__(name, bases, dct)

        # Register class under its type
        try:
            _EventRegistry._types[cls.type] = cls
        except AttributeError:
            pass

        # Add all attributes from base classes
        for base in bases:
            cls.__annotations__.update(base.__annotations__)

    def __getitem__(cls, key):
        try:
            return _EventRegistry._types[key]
        except KeyError:
            raise EventError(f"Unknown event type: {key}") from None


class Event(metaclass=_EventRegistry):
    """
    This is the base class all events should inherit from.

    It stores the events data and provides access to it via __getattr__.
    It also checks whether the given attributes match the expected ones.
    Finally it provides some methods to be overwritten:
        - response_sender
        - response_all_users
        - update_db
    """
    type: str

    def __init__(self, data, **kwargs):
        for key, value in data.items():
            if key not in self.__annotations__:
                raise EventError(f"Unknown attribute '{key}' for type '{self.type}'")

        for key in self.__annotations__:
            if key not in data:
                raise EventError(f"Missing attribute '{key}' for type '{self.type}'")

        self._data = data

    def __getattr__(self, key):
        """
        Provide attributes using the wrapped data.
        """
        return self._data[key]

    async def response_sender(self):
        """
        Get the response for the sender.

        Return `None` to send nothing.
        """
        return None

    async def response_all_users(self):
        """
        Get the response for all users.
        This also includes the sender even if `response_sender` has already returned something.

        Return `None` to send nothing.
        """
        return self._data

    @database_sync_to_async
    def update_db(self):
        """
        This function should handle all database operations resulting from this event.

        Remember to add the `@database_sync_to_async` decorator!!!
        """
        return NotImplemented


class UserEvent(Event):
    """
    This abstract event extends `Event` to also store the user who send it.
    """
    def __init__(self, data, user=None, **kwargs):
        super().__init__(data)
        assert user
        self.user = user


class WelcomeEvent(UserEvent):
    """
    This event is send upon socket connection to give the client it's user id.
    """
    async def response_all_users(self):
        return {"type": "welcome", "yourId": self.user.id}


class CursorEvent(UserEvent):
    """
    """
    type = "cursor"

    x: int
    y: int

    async def response_all_users(self):
        if self.user.is_authenticated:
            return dict(self._data, name=self.user.get_username(), id=self.user.id)


class RoomEvent(Event):
    """
    This abstract event extends `Event` to also store the room it occurred in.
    """
    def __init__(self, data, room=None, **kwargs):
        super().__init__(data)
        assert room
        self.room = room


class CharacterEvent(RoomEvent):
    """
    This abstract event extends `RoomEvent` and requires a id specifying a character.
    """
    id: str


class MoveEvent(CharacterEvent):
    """
    This event occurs when a character is moved.
    """
    type = "move"

    x: int
    y: int

    @database_sync_to_async
    def update_db(self):
        if self.room.character_set.filter(x=self.x, y=self.y).count() > 0:
            raise EventError("This space is already occupied!")
        else:
            character = Character.objects.get(room=self.room, identifier=self.id)
            character.x = self.x
            character.y = self.y
            character.save()


class NewEvent(CharacterEvent):
    """
    This event occurs when a character is created.
    """
    type = "new"

    x: int
    y: int
    color: str

    @database_sync_to_async
    def update_db(self):
        character = Character(identifier=self.id, x=self.x, y=self.y, color=self.color, room=self.room)
        character.save()


class DeleteEvent(CharacterEvent):
    """
    This event occurs when a character is deleted
    """
    type = "delete"

    @database_sync_to_async
    def update_db(self):
        try:
            Character.objects.get(identifier=self.id, room=self.room).delete()
        except Character.DoesNotExist:
            raise EventError(f"No character with id: {self.id}") from None


class ColorTileEvent(RoomEvent):
    """
    """
    type = "colorTile"
    x: int
    y: int
    background: str
    border: str

    @database_sync_to_async
    def update_db(self):
        if self.background or self.border:
            tile, _ = Tile.objects.get_or_create(room=self.room, x=self.x, y=self.y)
            tile.background = self.background
            tile.border = self.border
            tile.save()
        else:
            try:
                Tile.objects.get(room=self.room, x=self.x, y=self.y).delete()
            except Tile.DoesNotExist:
                pass
