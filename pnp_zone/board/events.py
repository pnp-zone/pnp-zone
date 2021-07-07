import uuid

from channels.db import database_sync_to_async

from board.models import Character, Tile, UserSession, BackgroundImage

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
    return data, None


@register("cursor")
async def process_cursor(room, user, data):
    return None, dict(data, name=user.get_username())


@register("character.move")
@database_sync_to_async
def process_move_character(room, user, data):
    if room.character_set.filter(x=data["x"], y=data["y"]).count() > 0:
        raise EventError("This space is already occupied!")
    else:
        character = Character.objects.get(room=room, identifier=data["id"])
        character.x = data["x"]
        character.y = data["y"]
        character.save()
        return data, data


@register("character.new")
@moderators_only
@database_sync_to_async
def process_new_character(room, user, data):
    if room.character_set.filter(x=data["x"], y=data["y"]).count() > 0:
        raise EventError("This space is already occupied!")
    else:
        character = Character(identifier=str(uuid.uuid4()), name=data["name"],
                              x=data["x"], y=data["y"], color=data["color"], room=room)
        character.save()
        data["id"] = character.identifier
        return data, data


@register("character.delete")
@moderators_only
@database_sync_to_async
def process_delete_character(room, user, data):
    try:
        Character.objects.get(identifier=data["id"], room=room).delete()
        return data, data
    except Character.DoesNotExist:
        raise EventError(f"No character with id: {data['id']}") from None


@register("colorTile")
@moderators_only
@database_sync_to_async
def process_color_tile(room, user, data):
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
    if data["background"] or data["border"]:
        tiles.update(border=data["border"], background=data["background"])
        Tile.objects.bulk_create(new_tiles)

    # Delete instead of setting no color
    else:
        tiles.delete()

    return data, data


def _background2data(bg: BackgroundImage):
    return {
        "type": "background.update",
        "id": bg.identifier,
        "url": bg.url,
        "x": bg.x,
        "y": bg.y,
        "width": bg.width,
        "height": bg.height
    }


@register("background.new")
@moderators_only
@database_sync_to_async
def new_background(room, user, data: dict):
    background = BackgroundImage.objects.create(
        room=room,
        identifier=str(uuid.uuid4()),
        url=data["url"],
        x=0,
        y=0,
        width=data["width"] if "width" in data else -1,
        height=data["height"] if "height" in data else -1,
    )

    data = _background2data(background)
    return data, data


@register("background.move")
@moderators_only
@database_sync_to_async
def move_background(room, user, data):
    try:
        background = BackgroundImage.objects.get(room=room, identifier=data["id"])
    except BackgroundImage.DoesNotExist:
        return None, None

    background.x = data["x"]
    background.y = data["y"]
    background.width = data["width"]
    background.height = data["height"]
    background.save()

    data = _background2data(background)
    return None, data


@register("background.delete")
@moderators_only
@database_sync_to_async
def delete_background(room, user, data):
    try:
        background = BackgroundImage.objects.get(room=room, identifier=data["id"])
    except BackgroundImage.DoesNotExist:
        return None, None

    background.delete()

    return data, data
