package server

import (
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/color"
	"github.com/myOmikron/echotools/worker"
	"github.com/pnp-zone/common/conf"
	"gorm.io/gorm"
	"io/ioutil"
	"path"
	"plugin"
	"strings"
)

type Plugin struct {
	Name           string
	MigrationHook  func(db *gorm.DB) error
	WorkerPoolHook func(wp *worker.Pool) error
	RouterHook     func(e *echo.Echo, db *gorm.DB, config *conf.Config) error
}

type MigrationHook = func() func(db *gorm.DB) error
type RouterHook = func() func(e *echo.Echo, db *gorm.DB, config *conf.Config) error

func loadPlugins(config *conf.Config) (plugins []*Plugin) {
	plugins = make([]*Plugin, 0)

	if files, err := ioutil.ReadDir(config.Server.PluginPath); err != nil {
		color.Printf(color.RED, "Error while reading plugins: %s\n", err.Error())
	} else {
		for _, file := range files {
			if !file.IsDir() && strings.HasSuffix(file.Name(), ".so") {
				if rawPlugin, err := plugin.Open(path.Join(config.Server.PluginPath, file.Name())); err != nil {
					color.Printf(color.RED, "Error loading plugin %s: %s\n", file.Name(), err.Error())
					continue
				} else {
					pl := &Plugin{
						Name: file.Name(),
					}

					if sym, err := rawPlugin.Lookup("MigrationHook"); err != nil {
						color.Printf(color.RED, "Plugin %s: Error retrieving MigrationHook\n", file.Name())
						continue
					} else {
						if migrationHook, ok := sym.(MigrationHook); ok {
							pl.MigrationHook = migrationHook()
						} else {
							color.Printf(color.RED, "Plugin %s: Skipping as MigrationHook has an invalid signature\n", file.Name())
							continue
						}
					}

					if sym, err := rawPlugin.Lookup("RouterHook"); err != nil {
						color.Printf(color.RED, "Plugin %s: Error retrieving RouterHook\n", file.Name())
						continue
					} else {
						if routerHook, ok := sym.(RouterHook); ok {
							pl.RouterHook = routerHook()
						} else {
							color.Printf(color.RED, "Plugin %s: Skipping as RouterHook has an invalid signature\n", file.Name())
							continue
						}
					}

					plugins = append(plugins, pl)
				}
			} else {
				color.Printf(color.BLUE, "Ignoring %s in plugins\n", file.Name())
			}
		}
	}

	return
}
