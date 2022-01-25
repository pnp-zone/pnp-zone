from dataclasses import dataclass
from typing import Any, Callable, Awaitable, Dict

from channels.db import database_sync_to_async
from django.db.models import Q

from accounts.models import AccountModel
from board.models import Character, Tile, UserSession, Image, Room, CharacterLayer, TileLayer, ImageLayer


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
    response = {"type": "layer.set", "layer": "cursors", "key": name,
                "object": {"x": data["x"], "y": data["y"], "name": name}}
    return Response(room=response)


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
    layer = CharacterLayer.objects.filter(room=room).first()
    if layer.children.filter(x=data["x"], y=data["y"]).exists():
        raise EventError("This space is already occupied!")
    else:
        room.save()  # Update last modified
        character = Character.objects.create(
            name=data["name"],
            x=data["x"],
            y=data["y"],
            color=data["color"],
            layer=layer
        )
        response = {"type": "layer.set", "layer": layer.identifier, "object": character.to_dict()}
        return Response(sender=response, room=response)


@register("character.move")
@database_sync_to_async
def _process_move_character(room: Room, account: AccountModel, data: Dict):
    layer = CharacterLayer.objects.filter(room=room).first()
    if layer.children.filter(x=data["x"], y=data["y"]).exists():
        raise EventError("This space is already occupied!")

    try:
        character = Character.objects.get(layer=layer, identifier=data["id"])
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    character.x = data["x"]
    character.y = data["y"]
    character.save()
    room.save()  # Update last modified

    response = {"type": "layer.set", "layer": layer.identifier, "object": character.to_dict()}
    return Response(sender=response, room=response)


@register("character.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_character(room: Room, account: AccountModel, data: Dict):
    layer = CharacterLayer.objects.filter(room=room).first()
    try:
        character = Character.objects.get(identifier=data["id"], layer=layer)
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    character.delete()
    room.save()  # Update last modified

    response = {"type": "layer.delete", "layer": layer.identifier, "object": character.to_dict()}
    return Response(sender=response, room=response)


# ---- #
# Tile #
# ---- #
@register("tiles.color")
@_moderators_only
@database_sync_to_async
def _process_color_tile(room: Room, account: AccountModel, data: Dict):
    layer = TileLayer.objects.filter(room=room).first()
    # Create Qs and Tiles from data
    q = Q()
    tiles = []
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
        tiles.append(
            Tile(layer=layer, x=point[0], y=point[1], background=data["background"], border=data["border"])
        )

    # Update every existing tile
    Tile.objects.filter(layer=layer).filter(q).update(border=data["border"], background=data["background"])

    # Try creating every tile and ignore duplicates
    Tile.objects.bulk_create(tiles, ignore_conflicts=True)

    # Update last modified
    room.save()

    # Send change to everyone else
    response = {"type": "layer.set", "layer": layer.identifier,
                "objects": dict((tile.identifier, tile.to_dict()) for tile in tiles)}
    return Response(room=response)


@register("tiles.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_tile(room: Room, account: AccountModel, data: Dict):
    layer = TileLayer.objects.filter(room=room).first()
    q = Q()
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
    Tile.objects.filter(layer=layer).filter(q).delete()
    room.save()  # Update last modified
    response = {"type": "layer.delete", "layer": layer.identifier,
                "objects": dict((Tile(x=point[0], y=point[1]).identifier, None) for point in data["tiles"])}
    return Response(room=response)


# ----- #
# Image #
# ----- #
@register("image.new")
@_moderators_only
@database_sync_to_async
def _process_new_image(room: Room, account: AccountModel, data: Dict):
    layer = ImageLayer.objects.filter(room=room).first()
    room.save()  # Update last modified
    image = Image.objects.create(
        layer=layer,
        url=data["url"],
        x=data["x"] if "x" in data else 0,
        y=data["y"] if "y" in data else 0,
        width=data["width"] if "width" in data else -1,
        height=data["height"] if "height" in data else -1,
    )
    response = {"type": "layer.set", "layer": layer.identifier, "object": image.to_dict()}
    return Response(sender=response, room=response)


@register("image.change_layer")
@_moderators_only
@database_sync_to_async
def _process_change_image_layer(room: Room, account: AccountModel, data: Dict):
    raise EventError("Deprecated")


@register("image.move")
@_moderators_only
@database_sync_to_async
def _process_move_image(room: Room, account: AccountModel, data: Dict):
    layer = ImageLayer.objects.filter(room=room).first()
    try:
        image = Image.objects.get(layer=layer, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.x = data["x"]
    image.y = data["y"]
    image.width = data["width"]
    image.height = data["height"]
    image.save()
    room.save()  # Update last modified

    response = {"type": "layer.set", "layer": layer.identifier, "object": image.to_dict()}
    return Response(room=response)


@register("image.delete")
@_moderators_only
@database_sync_to_async
def _process_delete_image(room: Room, account: AccountModel, data: Dict):
    layer = ImageLayer.objects.filter(room=room).first()
    try:
        image = Image.objects.get(layer=layer, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.delete()
    room.save()  # Update last modified

    response = {"type": "layer.delete", "layer": layer.identifier, "object": image.to_dict()}
    return Response(sender=data, room=data)
