package conf

type Database struct {
	Driver   string
	Port     uint16
	Host     string
	Name     string
	User     string
	Password string
}

type Generic struct {
	TemplatePath string
	StaticPath   string
	PluginPath   string
}

type Config struct {
	Generic  Generic
	Database Database
}

func (c *Config) CheckConfig() error {
	return nil
}
