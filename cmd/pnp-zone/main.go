package main

import (
	"os"

	"github.com/hellflame/argparse"
	"github.com/pnp-zone/pnp-zone/server"
)

func main() {
	parser := argparse.NewParser("pnp-zone", "", &argparse.ParserConfig{DisableDefaultShowHelp: true})

	configPath := parser.String("", "config-path", &argparse.Option{
		Help:    "Specify an alternative path to configuration file. Defaults to config.toml",
		Default: "/etc/pnp-zone/config.toml",
	})

	if err := parser.Parse(nil); err != nil {
		os.Exit(0)
	}

	server.StartServer(*configPath)
}
