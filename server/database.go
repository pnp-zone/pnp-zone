package server

import (
	"fmt"
	mysqlDriver "github.com/go-sql-driver/mysql"
	"github.com/myOmikron/echotools/color"
	"github.com/myOmikron/echotools/database"
	"github.com/myOmikron/echotools/utilitymodels"
	"github.com/pnp-zone/pnp-zone/conf"
	"github.com/pnp-zone/pnp-zone/models"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net"
	"net/url"
	"strconv"
)

func initializeDatabase(config *conf.Config, plugins []*Plugin) (db *gorm.DB) {
	var driver gorm.Dialector
	switch config.Database.Driver {
	case "sqlite":
		driver = sqlite.Open(config.Database.Name)
	case "mysql":
		mysqlConf := mysqlDriver.NewConfig()
		mysqlConf.Net = fmt.Sprintf("tcp(%s)", net.JoinHostPort(config.Database.Host, strconv.Itoa(int(config.Database.Port))))
		mysqlConf.DBName = config.Database.Name
		mysqlConf.User = config.Database.User
		mysqlConf.Passwd = config.Database.Password
		mysqlConf.ParseTime = true
		mysqlConf.Params = map[string]string{
			"charset": "utf8mb4",
		}
		driver = mysql.Open(mysqlConf.FormatDSN())
	case "postgresql":
		dsn := url.URL{
			Scheme: "postgres",
			User:   url.UserPassword(config.Database.User, config.Database.Password),
			Host:   net.JoinHostPort(config.Database.Host, strconv.Itoa(int(config.Database.Port))),
			Path:   config.Database.Name,
		}
		driver = postgres.Open(dsn.String())
	}

	db = database.Initialize(
		driver,
		&utilitymodels.Session{},
		&utilitymodels.User{},

		&models.User{},

		&models.Room{},
		&models.Layer{},
		&models.ImageLayer{},
		&models.Image{},
		&models.CharacterLayer{},
		&models.Character{},
		&models.TileLayer{},
		&models.Tile{},
		&models.UserBoardPosition{},
	)

	// Execute plugin migrations
	for _, plugin := range plugins {
		if err := plugin.MigrationHook(db); err != nil {
			color.Printf(color.RED, "Plugin %s: Error while running migrations: %s\n", plugin.Name, err.Error())
		}
	}

	return
}
