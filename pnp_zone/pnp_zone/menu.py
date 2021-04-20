_menu = [
    {"link": "/", "text": "Dashboard"},
]


def get(active_link=None):
    menu = []
    for item in _menu:
        item = dict(item)
        if item["link"] == active_link:
            item["active"] = True
        menu.append(item)
    return menu
