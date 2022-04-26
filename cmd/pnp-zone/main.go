package main

import (
	"github.com/hellflame/argparse"
	"github.com/pnp-zone/pnp-zone/server"
	"os"
)

func main() {
	parser := argparse.NewParser("pnp-zone", "", &argparse.ParserConfig{DisableDefaultShowHelp: true})

	configPath := parser.String("", "config-path", &argparse.Option{
		Help:    "Specify an alternative path to configuration file. Defaults to config.toml",
		Default: "config.toml",
	})

	if err := parser.Parse(nil); err != nil {
		os.Exit(0)
	}

	server.StartServer(*configPath)
}
