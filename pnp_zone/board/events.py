from dataclasses import dataclass
from typing import Any, Callable, Awaitable, Dict

from channels.db import database_sync_to_async
from django.db.models import Q

from accounts.models import AccountModel
from board.models import Character, Tile, UserSession, Image, Room


@dataclass
class Response:
    sender: Any = None
    room: Any = None
    campaign: Any = None


EventHandler = Callable[[Room, AccountModel, Dict], Awaitable[Response]]
event_handlers: Dict[str, EventHandler] = {}


def register(event_type: str):
    def inner_register(event_handler: EventHandler) -> EventHandler:
        event_handlers[event_type] = event_handler
        return event_handler
    return inner_register


def _moderators_only(func):
    func.moderators_only = True
    return func


class EventError(RuntimeError):
    pass


@register("session")
@database_sync_to_async
def _process_session(room: Room, account: AccountModel, data: Dict):
    session, _ = UserSession.objects.get_or_create(room=room, user=account.user)
    session.board_x = data["x"]
    session.board_y = data["y"]
    session.board_scale = data["scale"]
    session.save()
    return Response()


@register("cursor")
async def _process_cursor(room: Room, account: AccountModel, data: Dict):
    if account.display_name:
        name = account.display_name
    else:
        name = account.user.get_username()
    return Response(room=dict(data, name=name))


@register("switch")
@_moderators_only
async def _process_switch(room: Room, account: AccountModel, data: Dict):
    return Response(sender=data, campaign=data)


# --------- #
# Character #
# --------- #
@register("character.new")
@_moderators_only
@database_sync_to_async
def _process_new_character(room: Room, account: AccountModel, data: Dict):
    if room.character_set.filter(x=data["x"], y=data["y"]).count() > 0:
        raise EventError("This space is already occupied!")
    else:
        room.save()  # Update last modified
        character = Character.objects.create(
            name=data["name"],
            x=data["x"],
            y=data["y"],
            color=data["color"],
            room=room
        )
        return Response(sender=character.to_dict(), room=character.to_dict())


@register("character.move")
@database_sync_to_async
def _process_move_character(room: Room, account: AccountModel, data: Dict):
    if room.character_set.filter(x=data["x"], y=data["y"]).count() > 0:
        raise EventError("This space is already occupied!")

    try:
        character = Character.objects.get(room=room, identifier=data["id"])
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    character.x = data["x"]
    character.y = data["y"]
    character.save()
    room.save()  # Update last modified

    return Response(sender=character.to_dict(), room=character.to_dict())


@register("character.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_character(room: Room, account: AccountModel, data: Dict):
    try:
        character = Character.objects.get(identifier=data["id"], room=room)
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    character.delete()
    room.save()  # Update last modified

    return Response(sender=data, room=data)


# ---- #
# Tile #
# ---- #
@register("tiles.color")
@_moderators_only
@database_sync_to_async
def _process_color_tile(room: Room, account: AccountModel, data: Dict):
    # Create Qs and Tiles from data
    q = Q()
    tiles = []
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
        tiles.append(
            Tile(room=room, x=point[0], y=point[1], background=data["background"], border=data["border"])
        )

    # Update every existing tile
    Tile.objects.filter(room=room).filter(q).update(border=data["border"], background=data["background"])

    # Try creating every tile and ignore duplicates
    Tile.objects.bulk_create(tiles, ignore_conflicts=True)

    # Update last modified
    room.save()

    # Send change to everyone else
    return Response(room=dict(data, type="tiles"))


@register("tiles.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_tile(room: Room, account: AccountModel, data: Dict):
    q = Q()
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
    Tile.objects.filter(room=room).filter(q).delete()
    room.save()  # Update last modified
    return Response(room=data)


# ----- #
# Image #
# ----- #
@register("image.new")
@_moderators_only
@database_sync_to_async
def _process_new_image(room: Room, account: AccountModel, data: Dict):
    room.save()  # Update last modified
    image = Image.objects.create(
        room=room,
        url=data["url"],
        x=data["x"] if "x" in data else 0,
        y=data["y"] if "y" in data else 0,
        width=data["width"] if "width" in data else -1,
        height=data["height"] if "height" in data else -1,
    )
    return Response(sender=image.to_dict(), room=image.to_dict())


@register("image.change_layer")
@_moderators_only
@database_sync_to_async
def _process_change_image_layer(room: Room, account: AccountModel, data: Dict):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.layer = data["layer"]
    image.save()
    room.save()  # Update last modified

    return Response(sender=image.to_dict(), room=image.to_dict())


@register("image.move")
@_moderators_only
@database_sync_to_async
def _process_move_image(room: Room, account: AccountModel, data: Dict):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.x = data["x"]
    image.y = data["y"]
    image.width = data["width"]
    image.height = data["height"]
    image.save()
    room.save()  # Update last modified

    return Response(room=image.to_dict())


@register("image.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_image(room: Room, account: AccountModel, data: Dict):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.delete()
    room.save()  # Update last modified

    return Response(sender=data, room=data)
