package server

import (
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/color"
	"github.com/pnp-zone/common/conf"
	"github.com/pnp-zone/pnp-zone/handler"
	"gorm.io/gorm"
)

func defineRoutes(e *echo.Echo, db *gorm.DB, config *conf.Config, plugins []*Plugin) {
	w := handler.Wrapper{Plugins: plugins}

	e.GET("/", w.Index)

	for _, plugin := range plugins {
		if err := plugin.RouterHook(e, db, config); err != nil {
			color.Printf(color.RED, "Plugin %s: Error while defining routes: %s\n", plugin.Name, err.Error())
		}
	}
}
