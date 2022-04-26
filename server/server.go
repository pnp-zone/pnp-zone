package server

import (
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/color"
	"github.com/myOmikron/echotools/execution"
	"github.com/myOmikron/echotools/worker"
	"github.com/pelletier/go-toml"
	"github.com/pnp-zone/pnp-zone/conf"
	"html/template"
	"io/fs"
	"io/ioutil"
	"os"
)

func StartServer(configPath string) {
	config := &conf.Config{}

	if configBytes, err := ioutil.ReadFile(configPath); errors.Is(err, fs.ErrNotExist) {
		color.Printf(color.RED, "Config was not found at %s\n", configPath)
		b, _ := toml.Marshal(config)
		fmt.Print(string(b))
		os.Exit(1)
	} else {
		if err := toml.Unmarshal(configBytes, config); err != nil {
			panic(err)
		}
	}

	// Check for valid config values
	if err := config.CheckConfig(); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	// Plugin definition
	plugins := loadPlugins(config)

	// Database
	db := initializeDatabase(config, plugins)

	// Worker pool
	wp := worker.NewPool(&worker.PoolConfig{
		NumWorker: 10,
		QueueSize: 100,
	})
	wp.Start()

	// Web server
	e := echo.New()
	e.HideBanner = true

	// Template rendering
	renderer := &TemplateRenderer{
		templates: template.Must(template.ParseGlob("templates/*.gohtml")),
	}
	e.Renderer = renderer

	// Middleware definition

	// Router
	defineRoutes(e, db, config, plugins)

	// Start server
	execution.SignalStart(e, "127.0.0.1:8080", &execution.Config{
		ReloadFunc: func() {
			StartServer(configPath)
		},
		StopFunc: func() {
		},
		TerminateFunc: func() {
		},
	})
}
