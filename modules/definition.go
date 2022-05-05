package modules

import (
	"github.com/labstack/echo/v4"
	"github.com/myOmikron/echotools/worker"
	"github.com/pnp-zone/common/conf"
	"gorm.io/gorm"
)

type Plugin struct {
	Name           string
	MigrationHook  func(db *gorm.DB) error
	WorkerPoolHook func(wp worker.Pool) error
	RouterHook     func(e *echo.Echo, db *gorm.DB, config *conf.Config) error
	JsFile         string
	CssFile        string
}

type MigrationHook = func() func(db *gorm.DB) error
type RouterHook = func() func(e *echo.Echo, db *gorm.DB, config *conf.Config) error
type StaticFileHook = func() (string, string)
type WorkerPoolHook = func() func(wp worker.Pool) error
