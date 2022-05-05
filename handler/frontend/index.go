package frontend

import (
	"github.com/labstack/echo/v4"
)

func Index(c echo.Context) error {
	data := make(map[string]string)
	return c.Render(200, "base", data)
}
