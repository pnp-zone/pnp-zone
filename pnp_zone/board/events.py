import uuid

from channels.db import database_sync_to_async

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
def process_switch(room, user, data):
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
        return Character.objects.create(
            identifier=str(uuid.uuid4()),
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

    return data, data


# ---- #
# Tile #
# ---- #
@register("tiles.color")
@moderators_only
@database_sync_to_async
def color_tile(room, user, data):
    # Sort the incoming tiles by already colored or not and prepare the orm objects
    tiles_ids = []
    new_tiles = []
    for point in data["tiles"]:
        try:
            tiles_ids.append(Tile.objects.get(room=room, x=point[0], y=point[1]).id)
        except Tile.DoesNotExist:
            new_tiles.append(Tile(
                room=room, x=point[0], y=point[1], background=data["background"], border=data["border"]
            ))
    tiles = Tile.objects.filter(id__in=tiles_ids)

    # Set the new color
    tiles.update(border=data["border"], background=data["background"])
    Tile.objects.bulk_create(new_tiles)

    data["type"] = "tiles"
    return None, data


@register("tiles.delete")
@moderators_only
@database_sync_to_async
def erase_tile(room, user, data):
    tiles_id = []
    for point in data["tiles"]:
        try:
            tiles_id.append(Tile.objects.get(room=room, x=point[0], y=point[1]).id)
        except Tile.DoesNotExist:
            pass
    Tile.objects.filter(id__in=tiles_id).delete()

    return None, data


# ----- #
# Image #
# ----- #
@register("image.new")
@moderators_only
@database_sync_to_async
def new_image(room, user, data: dict):
    return Image.objects.create(
        room=room,
        identifier=str(uuid.uuid4()),
        url=data["url"],
        x=data["x"] if "x" in data else 0,
        y=data["y"] if "y" in data else 0,
        width=data["width"] if "width" in data else -1,
        height=data["height"] if "height" in data else -1,
    ).to_dict(as_tuple=2)


@register("image.change_layer")
@moderators_only
@database_sync_to_async
def new_image(room, user, data: dict):
    try:
        image = Image.objects.get(room=room, identifier=data["id"])
    except Image.DoesNotExist:
        raise EventError("Unknown image")

    image.layer = data["layer"]
    image.save()

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

    return data, data
