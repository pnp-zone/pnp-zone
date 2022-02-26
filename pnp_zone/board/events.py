from dataclasses import dataclass
from typing import Any, Callable, Awaitable, Dict, Type

from channels.db import database_sync_to_async
from django.db.models import Q, Max, F, Min

from accounts.models import AccountModel
from board.models import Character, Tile, UserSession, Image, Room, CharacterLayer, TileLayer, ImageLayer, Layer


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
    """Decorate event handlers which should only be use by moderators"""
    func.moderators_only = True
    return func


def const(func):
    """Decorate event handlers which don't modify the room and can be used in read only"""
    func.const = True
    return func


class EventError(RuntimeError):
    pass


@register("session")
@const
@database_sync_to_async
def _process_session(room: Room, account: AccountModel, data: Dict):
    session, _ = UserSession.objects.get_or_create(room=room, user=account.user)
    session.board_x = data["x"]
    session.board_y = data["y"]
    session.board_scale = data["scale"]
    session.save()
    return Response()


@register("cursor")
@const
async def _process_cursor(room: Room, account: AccountModel, data: Dict):
    if account.display_name:
        name = account.display_name
    else:
        name = account.user.get_username()
    response = {"type": "layer.set", "layer": "cursors", "key": name,
                "object": {"x": data["x"], "y": data["y"], "name": name}}
    return Response(room=response)


@register("switch")
@const
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
    try:
        layer = CharacterLayer.objects.get(room=room, identifier=data["layer"])
    except ImageLayer.DoesNotExist:
        raise EventError("Unknown layer")
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


def yield_points(x, y, d_max=10):
    """Generate points in a circle like manor"""
    for d in range(0, d_max):
        for sign_x, sign_y in [(1, -1), (1, 1), (-1, 1), (-1, -1)]:
            for dx in range(d+1):
                dy = d - dx
                yield x + sign_x*dx, y + sign_y*dy


@register("character.bulk")
@_moderators_only
@database_sync_to_async
def _process_new_character_bulk(room: Room, account: AccountModel, data: Dict):
    try:
        layer = CharacterLayer.objects.get(room=room, identifier=data["layer"])
    except ImageLayer.DoesNotExist:
        raise EventError("Unknown layer")

    x = data["x"]
    y = data["y"]
    color = data["color"]
    name_template = data["name"]
    number = data["number"]

    characters = []
    occupied = set(Character.objects.filter(layer=layer).values_list("x", "y"))
    for pos in yield_points(x, y):
        if pos in occupied:
            continue

        occupied.add(pos)
        characters.append(
            Character(layer=layer, x=pos[0], y=pos[1], name=name_template.format(i=len(characters)+1), color=color)
        )
        if len(characters) >= number:
            break
    Character.objects.bulk_create(characters)

    room.save()  # Update last modified
    response = {"type": "layer.set", "layer": layer.identifier, "objects": {
        character.identifier: character.to_dict() for character in characters
    }}
    return Response(sender=response, room=response)


@register("character.move")
@database_sync_to_async
def _process_move_character(room: Room, account: AccountModel, data: Dict):
    try:
        character = Character.objects.get(layer__room=room, identifier=data["id"])
        layer = character.layer
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    if layer.children.filter(x=data["x"], y=data["y"]).exists():
        raise EventError("This space is already occupied!")

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
    try:
        character = Character.objects.get(identifier=data["id"], layer__room=room)
        layer = character.layer
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
    try:
        layer = TileLayer.objects.get(room=room, identifier=data["layer"])
    except ImageLayer.DoesNotExist:
        raise EventError("Unknown layer")
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
    try:
        layer = TileLayer.objects.get(room=room, identifier=data["layer"])
    except ImageLayer.DoesNotExist:
        raise EventError("Unknown layer")
    q = Q()
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
    Tile.objects.filter(layer=layer).filter(q).delete()
    room.save()  # Update last modified
    response = {"type": "layer.delete", "layer": layer.identifier,
                "objects": dict((Tile(x=point[0], y=point[1]).identifier, None) for point in data["tiles"])}
    return Response(room=response)


@register("background.color")
@_moderators_only
@database_sync_to_async
def _process_color_background(room: Room, account: AccountModel, data: Dict):
    room.defaultBackground = data["background"]
    room.defaultBorder = data["border"]
    room.save()
    return Response(sender=data, room=data)


# ----- #
# Image #
# ----- #
@register("image.new")
@_moderators_only
@database_sync_to_async
def _process_new_image(room: Room, account: AccountModel, data: Dict):
    try:
        layer = ImageLayer.objects.get(room=room, identifier=data["layer"])
    except ImageLayer.DoesNotExist:
        raise EventError("Unknown layer")
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
    try:
        image = Image.objects.get(layer__room=room, identifier=data["id"])
        layer = image.layer
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
    try:
        image = Image.objects.get(layer__room=room, identifier=data["id"])
        layer = image.layer
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.delete()
    room.save()  # Update last modified

    response = {"type": "layer.delete", "layer": layer.identifier, "object": image.to_dict()}
    return Response(sender=response, room=response)


@register("layer.new")
@_moderators_only
@database_sync_to_async
def _process_new_layer(room: Room, account: AccountModel, data: Dict):
    try:
        LayerModel: Type[Layer] = {
            "tile": TileLayer,
            "character": CharacterLayer,
            "image": ImageLayer,
        }[data["component_type"]]
    except KeyError:
        raise EventError("Unknown layer type")

    level = Layer.objects.filter(room=room).aggregate(level=Max("level"))["level"] + 1

    layer = LayerModel.objects.create(room=room, name=data["name"], level=level)

    response = {"type": "layer.new", layer.identifier: layer.to_dict()}
    return Response(sender=response, room=response)


@register("layer.move")
@_moderators_only
@database_sync_to_async
def _process_move_layer(room: Room, account: AccountModel, data: Dict):
    layers = Layer.objects.filter(room=room).order_by("-level")
    sorted_layers = sorted([Layer(identifier=None, level=0)] + list(layers), key=lambda l: l.level, reverse=True)

    # Perform move in sorted_layers
    layer = None
    for layer in sorted_layers:
        if layer.identifier == data["layer"]:
            break
    if layer is not None:
        sorted_layers.remove(layer)
        sorted_layers.insert(data["index"], layer)
    else:
        raise EventError("Unknown layer")

    # Update levels
    sorted_layers.reverse()
    for layer_zero, layer in enumerate(sorted_layers):
        if layer.identifier is None:
            break
    for i, layer in enumerate(sorted_layers):
        layer.level = i - layer_zero

    # Push update to db
    sorted_layers.remove(sorted_layers[layer_zero])
    Layer.objects.bulk_update(sorted_layers, ["level"])

    response = {"type": "layer.move", "levels": {layer.identifier: layer.level for layer in layers}}
    return Response(sender=response, room=response)


@register("layer.drop")
@_moderators_only
@database_sync_to_async
def _process_drop_layer(room: Room, account: AccountModel, data: Dict):
    try:
        layer = Layer.objects.get(room=room, identifier=data["id"])
    except Layer.DoesNotExist:
        raise EventError("Unknown layer")

    layer.delete()
    if layer.level >= 0:
        Layer.objects.filter(room=room, level__gt=layer.level).update(level=F("level")-1)
    else:
        Layer.objects.filter(room=room, level__lt=layer.level).update(level=F("level")+1)

    return Response(sender=data, room=data)
