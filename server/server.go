package server

import (
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	emw "github.com/labstack/echo/v4/middleware"
	"github.com/myOmikron/echotools/color"
	"github.com/myOmikron/echotools/execution"
	mw "github.com/myOmikron/echotools/middleware"
	"github.com/myOmikron/echotools/worker"
	"github.com/pelletier/go-toml"
	"github.com/pnp-zone/common/conf"
	"html/template"
	"io/fs"
	"io/ioutil"
	"os"
	"time"
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

	for _, plugin := range plugins {
		if err := plugin.WorkerPoolHook(wp); err != nil {
			return
		}
	}

	// Web server
	e := echo.New()
	e.HideBanner = true

	// Template rendering
	renderer := &TemplateRenderer{
		templates: template.Must(template.ParseGlob("templates/*.gohtml")),
	}
	e.Renderer = renderer

	// Middleware definition
	e.Use(emw.Logger())
	e.Use(emw.Recover())

	allowedHosts := make([]mw.AllowedHost, 0)
	for _, host := range config.Server.AllowedHosts {
		allowedHosts = append(allowedHosts, mw.AllowedHost{
			Host:  host.Host,
			Https: host.Https,
		})
	}
	secConfig := &mw.SecurityConfig{
		AllowedHosts:            allowedHosts,
		UseForwardedProtoHeader: config.Server.UseForwardedProtoHeader,
	}
	e.Use(mw.Security(secConfig))

	cookieAge := time.Hour * 24
	e.Use(mw.Session(db, &mw.SessionConfig{
		CookieName:     "sessionid",
		CookieAge:      &cookieAge,
		CookiePath:     "/",
		DisableLogging: false,
	}))

	// Router
	defineRoutes(e, db, config, plugins)

	// Start server
	execution.SignalStart(e, config.Server.ListenAddress, &execution.Config{
		ReloadFunc: func() {
			StartServer(configPath)
		},
		StopFunc: func() {
		},
		TerminateFunc: func() {
		},
	})
}
