package frontend

import (
	"github.com/labstack/echo/v4"
	"github.com/pnp-zone/pnp-zone/handler"
	"github.com/pnp-zone/pnp-zone/modules"
)

func IndexWithPlugins(plugins []*modules.Plugin) func(ctx echo.Context) error {
	return handler.LoginRequired(func(c echo.Context) error {
		data := make(map[string]interface{})
		jsFiles := make([]string, 0)
		cssFiles := make([]string, 0)

		for _, plugin := range plugins {
			if plugin.JsFile != "" {
				jsFiles = append(jsFiles, plugin.JsFile)
			}
			if plugin.CssFile != "" {
				cssFiles = append(cssFiles, plugin.CssFile)
			}
		}

		data["JsPaths"] = jsFiles
		data["CssPaths"] = cssFiles

		return c.Render(200, "waw", data)
	})
}
