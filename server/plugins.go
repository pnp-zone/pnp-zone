package server

import (
	"github.com/myOmikron/echotools/color"
	"github.com/pnp-zone/common/conf"
	"github.com/pnp-zone/pnp-zone/modules"
	"io/ioutil"
	"path"
	"plugin"
	"regexp"
	"strings"
)

func loadPlugins(config *conf.Config) (plugins []*modules.Plugin) {
	plugins = make([]*modules.Plugin, 0)

	allowedFileName := regexp.MustCompile(`[\d\w\-]+\.so`)

	if files, err := ioutil.ReadDir(config.Server.PluginPath); err != nil {
		color.Printf(color.RED, "Error while reading plugins: %s\n", err.Error())
	} else {
		for _, file := range files {
			if !file.IsDir() && strings.HasSuffix(file.Name(), ".so") {

				if !allowedFileName.MatchString(file.Name()) {
					color.Printf(color.RED, "Error loading plugin %s: Invalid name", file.Name())
					continue
				}

				if rawPlugin, err := plugin.Open(path.Join(config.Server.PluginPath, file.Name())); err != nil {
					color.Printf(color.RED, "Error loading plugin %s: %s\n", file.Name(), err.Error())
					continue
				} else {
					pl := &modules.Plugin{
						Name: file.Name()[:len(file.Name())-3],
					}

					if sym, err := rawPlugin.Lookup("MigrationHook"); err != nil {
						color.Printf(color.RED, "Plugin %s: Error retrieving MigrationHook\n", file.Name())
						continue
					} else {
						if migrationHook, ok := sym.(modules.MigrationHook); ok {
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
						if routerHook, ok := sym.(modules.RouterHook); ok {
							pl.RouterHook = routerHook()
						} else {
							color.Printf(color.RED, "Plugin %s: Skipping as RouterHook has an invalid signature\n", file.Name())
							continue
						}
					}

					if sym, err := rawPlugin.Lookup("WorkerPoolHook"); err != nil {
						color.Printf(color.RED, "Plugin %s: Error retrieving WorkerPoolHook\n", file.Name())
						continue
					} else {
						if workerPoolHook, ok := sym.(modules.WorkerPoolHook); ok {
							pl.WorkerPoolHook = workerPoolHook()
						} else {
							color.Printf(color.RED, "Plugin %s: Skipping as WorkerPoolHook has an invalid signature\n", file.Name())
							continue
						}
					}

					if sym, err := rawPlugin.Lookup("StaticFileHook"); err != nil {
						color.Printf(color.RED, "Plugin %s: Error retrieving StaticFileHook\n", file.Name())
						continue
					} else {
						if staticFileHook, ok := sym.(modules.StaticFileHook); ok {
							js, css := staticFileHook()

							pl.JsFile = "/static/plugins/" + pl.Name + "/" + js
							pl.CssFile = "/static/plugins/" + pl.Name + "/" + css
						} else {
							color.Printf(color.RED, "Plugin %s: Skipping as StaticFileHook has an invalid signature\n", file.Name())
							continue
						}
					}

					plugins = append(plugins, pl)
					color.Printf(color.GREEN, "Loading plugin: %s\n", pl.Name)
				}
			} else {
				color.Printf(color.BLUE, "Ignoring %s in plugins\n", file.Name())
			}
		}
	}

	return
}
