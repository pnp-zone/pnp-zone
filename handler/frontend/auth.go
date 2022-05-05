package frontend

import (
	"github.com/labstack/echo/v4"
	"github.com/pnp-zone/pnp-zone/handler/frontend/data"
)

func Login(c echo.Context) error {
	v := data.GenericData{
		PageTitle: "pnp-zone",
		Static:    "/static",
	}
	return c.Render(200, "login", v)
}

func Register(c echo.Context) error {
	v := data.GenericData{
		PageTitle: "pnp-zone",
		Static:    "/static",
	}
	return c.Render(200, "register", v)
}
