package models

import "github.com/myOmikron/echotools/utilitymodels"

type User struct {
	utilitymodels.CommonSoftDelete
	UserID uint
	User   utilitymodels.User
}
