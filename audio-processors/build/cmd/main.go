package main

import (
	"flag"
	"log"
	"os/exec"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/spf13/viper"
)

func main() {
	var envFile string
	flag.StringVar(&envFile, "env", "", "path to environment file")
	var watch bool
	flag.BoolVar(&watch, "watch", false, "watch mode")
	flag.Parse()

	viper.SetConfigFile(envFile)
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error while reading .env file %s", err)
	}
	outfile, ok := viper.Get("AUDIO_PROCESSORS_OUTPUT_FILE").(string)
	if !ok {
		log.Fatalf("Output file name missing in .env file %s", envFile)
	}

	cmd := exec.Command("wasm-pack", "build", "--target=web", "--out-dir", "../pkg")
	cmd.Dir = "../wasm"
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Error building WASM %s", err)
	}
	log.Printf("\n%s", string(out))

	buildOpts := api.BuildOptions{
		EntryPoints: []string{"../index.js"},
		Bundle:      true,
		Platform:    api.PlatformBrowser,
		Loader: map[string]api.Loader{
			".wasm": api.LoaderBinary,
		},
		Outfile: outfile,
		Format:  api.FormatESModule,
		Write:   true,
	}

	result := api.Build(buildOpts)
	if len(result.Errors) != 0 {
		log.Fatalf("Build errors: %v", result.Errors)
	}

	// TODO watch mode
}
