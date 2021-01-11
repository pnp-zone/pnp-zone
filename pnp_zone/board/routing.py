from django.urls import re_path

from board.consumer import BoardConsumer


urlpatterns = [
    re_path(r"(?P<room>\w+)", BoardConsumer.as_asgi()),
]
