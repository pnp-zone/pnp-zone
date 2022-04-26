package server

import (
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/color"
	"gorm.io/gorm"
)

func defineRoutes(e *echo.Echo, db *gorm.DB, config *Config, plugins []*Plugin) {

	for _, plugin := range plugins {
		if err := plugin.RouterHook(e, db, config); err != nil {
			color.Printf(color.RED, "Plugin %s: Error while defining routes: %s\n", plugin.Name, err.Error())
		}
	}
}
