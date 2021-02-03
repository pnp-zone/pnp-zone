#!/usr/bin/env python3

from math import sqrt
import argparse


class Hexagon:

    def __init__(self, width):
        a = width/2
        b = a / sqrt(3)

        self.side = sqrt(a**2 + b**2)
        self.width = width
        self.height = self.side + 2*b

    def __iter__(self):
        # Local variables for readability
        a = self.width/2
        height = self.height
        side = self.side

        yield (-a, side/2)
        yield (0, height/2)
        yield (a, side/2)
        yield (a, -side/2)
        yield (0, -height/2)
        yield (-a, -side/2)

def translate(points, by):
    return [(p[0]+by[0], p[1]+by[1]) for p in points]

def to_svg_polygon(points):
    points = " ".join(map("{0[0]},{0[1]}".format, points))
    return f"<polygon points=\"{points}\"/>"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("width", type=float, help="The hexagons width")
    parser.add_argument("--centered", action="store_true", help="Center around origin")
    args = parser.parse_args()

    hexagon = Hexagon(args.width)
    points = list(hexagon)
    if not args.centered:
        points = translate(points, (hexagon.width/2, hexagon.height/2))

    print(to_svg_polygon(points))

