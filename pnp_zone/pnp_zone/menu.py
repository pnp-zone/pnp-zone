_menu = [{"link": "/", "text": "Dashboard"},
         {"link": "/player/", "text": "Player Tools"},
         {"link": "/dm/", "text": "DM Tools"},
         {"link": "/wiki/", "text": "Wiki"},
         {"link": "/board/", "text": "Game boards"},
         ]


def get(active_link=None):
    menu = []
    for item in _menu:
        item = dict(item)
        if item["link"] == active_link:
            item["active"] = True
        menu.append(item)
    return menu
