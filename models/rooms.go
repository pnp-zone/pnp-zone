package models

import (
	"github.com/myOmikron/echotools/utilitymodels"
	"time"
)

type Room struct {
	utilitymodels.CommonSoftDelete
	Name              string
	Identifier        string
	DefaultBorder     string
	DefaultBackground string
	LastModified      time.Time
}

type Layer struct {
	utilitymodels.CommonSoftDelete
	RoomID     uint
	Room       Room
	Identifier string
	Name       string
	Level      int `gorm:"validator:"` // not 0
}

type CharacterLayer struct {
	utilitymodels.CommonSoftDelete
	LayerID uint
	Layer   Layer
}

type Character struct {
	utilitymodels.CommonSoftDelete
	CharacterLayerID uint
	CharacterLayer   CharacterLayer
	Identifier       string
	Name             string
	X                int64
	Y                int64
	Color            string
}

type TileLayer struct {
	utilitymodels.CommonSoftDelete
	LayerID uint
	Layer   Layer
}

type Tile struct {
	utilitymodels.CommonSoftDelete
	TileLayerID uint
	TileLayer   TileLayer
	X           int64
	Y           int64
	Background  string
	Border      string
}

type ImageLayer struct {
	utilitymodels.CommonSoftDelete
	LayerID uint
	Layer   Layer
}

type Image struct {
	utilitymodels.CommonSoftDelete
	ImageLayerID uint
	ImageLayer   ImageLayer
	Identifier   string
	Url          string
	X            int64
	Y            int64
	Width        uint16
	Height       uint16
}

type UserBoardPosition struct {
	utilitymodels.CommonSoftDelete
	RoomID uint
	Room   Room
	UserID uint
	User   User
	X      int64
	Y      int64
	Scale  float64
}
