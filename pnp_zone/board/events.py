from channels.db import database_sync_to_async
from django.db.models import Q

from board.models import Character, Tile, UserSession, Image

event_handlers = {}


def register(event_type: str):
    def inner_register(function):
        event_handlers[event_type] = function
        return function
    return inner_register


def moderators_only(func):
    func.moderators_only = True
    return func


async def process_event(room, user, data):
    return None, data


class EventError(RuntimeError):
    pass


@register("session")
@database_sync_to_async
def process_update_session(room, user, data):
    session, _ = UserSession.objects.get_or_create(room=room, user=user)
    session.board_x = data["x"]
    session.board_y = data["y"]
    session.board_scale = data["scale"]
    session.save()
    return None, None


@register("cursor")
async def process_cursor(room, user, data):
    return None, dict(data, name=user.get_username())


@register("switch")
@moderators_only
async def process_switch(room, user, data):
    return data, data


# --------- #
# Character #
# --------- #
@register("character.new")
@moderators_only
@database_sync_to_async
def new_character(room, user, data):
    if room.character_set.filter(x=data["x"], y=data["y"]).count() > 0:
        raise EventError("This space is already occupied!")
    else:
        room.save()  # Update last modified
        return Character.objects.create(
            name=data["name"],
            x=data["x"],
            y=data["y"],
            color=data["color"],
            room=room
        ).to_dict(as_tuple=2)


@register("character.move")
@database_sync_to_async
def move_character(room, user, data):
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

    return character.to_dict(as_tuple=2)


@register("character.delete")
@moderators_only
@database_sync_to_async
def delete_character(room, user, data):
    try:
        character = Character.objects.get(identifier=data["id"], room=room)
    except Character.DoesNotExist:
        raise EventError(f"Unknown character")

    character.delete()
    room.save()  # Update last modified

    return data, data


# ---- #
# Tile #
# ---- #
@register("tiles.color")
@moderators_only
@database_sync_to_async
def color_tile(room, user, data):
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
    data["type"] = "tiles"
    return None, data


@register("tiles.delete")
@moderators_only
@database_sync_to_async
def erase_tile(room, user, data):
    q = Q()
    for point in data["tiles"]:
        q = q | Q(x=point[0], y=point[1])
    Tile.objects.filter(room=room).filter(q).delete()
    room.save()  # Update last modified
    return None, data


# ----- #
# Image #
# ----- #
@register("image.new")
@moderators_only
@database_sync_to_async
def new_image(room, user, data: dict):
    room.save()  # Update last modified
    return Image.objects.create(
        room=room,
        url=data["url"],
        x=data["x"] if "x" in data else 0,
        y=data["y"] if "y" in data else 0,
        width=data["width"] if "width" in data else -1,
        height=data["height"] if "height" in data else -1,
    ).to_dict(as_tuple=2)


@register("image.change_layer")
@moderators_only
@database_sync_to_async
def change_image_layer(room, user, data: dict):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.layer = data["layer"]
    image.save()
    room.save()  # Update last modified

    return image.to_dict(as_tuple=2)


@register("image.move")
@moderators_only
@database_sync_to_async
def move_image(room, user, data):
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

    return None, image.to_dict()


@register("image.delete")
@moderators_only
@database_sync_to_async
def delete_image(room, user, data):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.delete()
    room.save()  # Update last modified

    return data, data
