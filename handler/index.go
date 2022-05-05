package handler

import (
	"github.com/labstack/echo/v4"
	"github.com/pnp-zone/pnp-zone/server"
)

type Wrapper struct {
	Plugins []*server.Plugin
}

func (w *Wrapper) Index(c echo.Context) error {
	data := make(map[string]string)
	return c.Render(200, "base", data)
}
