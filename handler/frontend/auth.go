package frontend

import (
	"github.com/labstack/echo/v4"
)

func Login(c echo.Context) error {
	return c.Render(200, "login", nil)
}

func Register(c echo.Context) error {
	return c.Render(200, "register", nil)
}
