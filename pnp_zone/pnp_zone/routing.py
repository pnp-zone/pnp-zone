from django.core.asgi import get_asgi_application
from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter

import board.routing


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter([
        re_path("board/", URLRouter(board.routing.urlpatterns))
    ])
})
