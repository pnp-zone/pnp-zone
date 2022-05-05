package handler

import (
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/middleware"
)

func LoginRequired(next func(ctx echo.Context) error) func(c echo.Context) error {
	return func(c echo.Context) error {
		if context, err := middleware.GetSessionContext(c); err != nil {
			c.Logger().Error(err)
			return err
		} else {
			if !context.IsAuthenticated() {
				return c.Redirect(302, "/login")
			} else {
				return next(c)
			}
		}
	}
}
