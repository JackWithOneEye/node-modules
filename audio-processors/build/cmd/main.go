package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os/exec"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/spf13/viper"
)

func main() {
	var envFile string
	flag.StringVar(&envFile, "env", "", "path to environment file")
	var js string
	flag.StringVar(&js, "js", "", "js entry file")
	var wasmDir string
	flag.StringVar(&wasmDir, "wasmDir", "", "wasm directory")
	var wasmOutDir string
	flag.StringVar(&wasmOutDir, "wasmOutDir", "../pkg", "wasm output directory (relative to wasm directory)")
	var watch bool
	flag.BoolVar(&watch, "watch", false, "watch mode")
	flag.Parse()

	if len(envFile) == 0 {
		log.Fatalf("no environment file provided!")
	}

	if len(js) == 0 {
		log.Fatalf("no js entry file name provided!")
	}

	if len(wasmDir) == 0 {
		log.Fatalf("no wasm directory provided!")
	}

	viper.SetConfigFile(envFile)
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error while reading .env file %s", err)
	}
	outfile, ok := viper.Get("AUDIO_PROCESSORS_OUTPUT_FILE").(string)
	if !ok {
		log.Fatalf("Output file name missing in .env file %s", envFile)
	}

	buildOpts := api.BuildOptions{
		EntryPoints: []string{js},
		Bundle:      true,
		Platform:    api.PlatformBrowser,
		Loader: map[string]api.Loader{
			".wasm": api.LoaderBinary,
		},
		Outfile: outfile,
		Format:  api.FormatESModule,
		Write:   true,
	}

	if !watch {
		err = build(&buildOpts, wasmDir, wasmOutDir)
		if err != nil {
			log.Fatalf("Error: %s", err)
		}
		log.Println("DONE")
		return
	}

	err = watchBuild(&buildOpts, wasmDir, wasmOutDir)
	if err != nil {
		log.Fatalf("Error: %s", err)
	}
}

func build(esbuildOptions *api.BuildOptions, wasmDir, wasmOutDir string) error {
	cmd := exec.Command("wasm-pack", "build", "--target=web", "--out-dir", wasmOutDir)
	cmd.Dir = wasmDir
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("error getting wasm-pack command stderr pipe (%w)", err)
	}
	err = cmd.Start()
	if err != nil {
		return fmt.Errorf("could not start wasm-pack command (%w)", err)
	}
	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		txt := scanner.Text()
		log.Println(txt)
	}
	err = cmd.Wait()
	if err != nil {
		return fmt.Errorf("wasm-pack command failed (%w)", err)
	}

	result := api.Build(*esbuildOptions)
	if len(result.Errors) != 0 {
		return fmt.Errorf("esbuild failed (%v)", result.Errors)
	}
	return nil
}

func watchBuild(esbuildOptions *api.BuildOptions, wasmDir, wasmOutDir string) error {
	ctx, ctxErr := api.Context(*esbuildOptions)
	defer ctx.Dispose()
	if ctxErr != nil {
		return fmt.Errorf("could not create esbuild context (%w)", ctxErr)
	}
	watchErr := ctx.Watch(api.WatchOptions{})
	if watchErr != nil {
		return fmt.Errorf("esbuild watch failed (%w)", watchErr)
	}
	log.Println("esbuild watching...")

	wasmPackCmd := fmt.Sprintf("wasm-pack build --target=web --out-dir %s", wasmOutDir)
	cmd := exec.Command("cargo-watch", "-C", fmt.Sprintf("%s/src", wasmDir), "-s", wasmPackCmd)
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("error getting cargo-watch command stderr pipe (%w)", err)
	}
	err = cmd.Start()
	if err != nil {
		return fmt.Errorf("could not start cargo-watch command (%w)", err)
	}
	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		txt := scanner.Text()
		log.Println(txt)
	}
	err = cmd.Wait()
	if err != nil {
		return fmt.Errorf("cargo-watch command failed (%w)", err)
	}

	return nil
}
