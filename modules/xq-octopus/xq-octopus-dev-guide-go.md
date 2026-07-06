# Track 1 Day 1 Developer Guide: Build xq-octopus in Go

This guide is a Go alternative to `xq-octopus-dev-guide.md`. It keeps the same
REST testing product contract, but follows Vibium's Go CLI shape: a Cobra
command adapter, small internal packages, explicit command registration, and
single-binary delivery.

## Goal

Build `xq-octopus`, a small CLI for backend REST API testing:

```bash
xq-octopus get /health --env dev --expect-status 200
xq-octopus post /users --env dev --body '{"name":"Ada"}' --expect-status 201
```

The CLI does four things:

1. Load API test configuration from `xq.json`.
2. Call REST APIs.
3. Validate responses.
4. Print JSON evidence.

Do not build scenario parsing, MCP tools, OpenAPI loading, generated clients, or
domain reasoning in v1. The agent decides which CLI command to call.

## Chosen Stack

- Go `1.22` or newer.
- Cobra `github.com/spf13/cobra` for CLI command routing.
- Go standard library for HTTP, JSON, file IO, and tests.
- `go test` for tests.
- `go build` for local and release binaries.

Cobra is the only Day 1 third-party dependency. It earns its place because
Vibium uses the same style: `main.go` creates a root command and explicitly
registers command constructors with `rootCmd.AddCommand(newXCmd())`.

## Mental Model

```text
Agent / Developer
  -> cmd/xq-octopus        Cobra command adapter
  -> internal/config       xq.json loading
  -> internal/model        shared command/result structs
  -> internal/core         execution coordinator
  -> internal/rest         HTTP call + validation
  -> internal/output       JSON or pretty rendering
```

Keep these boundaries:

- `cmd/xq-octopus` translates terminal flags into typed command structs.
- `internal/config` owns `xq.json` loading and validation.
- `internal/model` owns stable config, command, and result data structures.
- `internal/core` owns the deep execution interface.
- `internal/rest` owns HTTP transport and REST response validation.
- `internal/output` owns rendering only.

Deep packages should not print, parse CLI flags, or exit the process.

## Project Setup

Start inside the module:

```bash
cd modules/xq-octopus
go mod init github.com/chauhaidang/xq-harness/modules/xq-octopus
go get github.com/spf13/cobra@v1.10.2
```

Create the source layout:

```text
modules/xq-octopus/
  README.md
  go.mod
  xq.json.example
  cmd/
    xq-octopus/
      main.go
      config.go
      rest_commands.go
      commands.go
  internal/
    config/
      loader.go
      loader_test.go
    core/
      engine.go
      engine_test.go
    model/
      config.go
      command.go
      result.go
    output/
      render.go
      render_test.go
    rest/
      client.go
      client_test.go
      validation.go
      validation_test.go
      catalog.go
```

`go.mod` should stay small:

```go
module github.com/chauhaidang/xq-harness/modules/xq-octopus

go 1.22

require github.com/spf13/cobra v1.10.2
```

## Vibium-Style CLI Wiring

All files under `cmd/xq-octopus` use the same package:

```go
package main
```

That lets `main.go` call command constructors defined in other files without
imports.

`main.go` owns the root command:

```go
package main

import (
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

func main() {
	progName := filepath.Base(os.Args[0])

	rootCmd := &cobra.Command{
		Use:   progName,
		Short: "REST API testing CLI",
		Long:  "xq-octopus loads xq.json, calls REST APIs, validates responses, and prints JSON evidence.",
	}

	rootCmd.AddCommand(newConfigCmd())
	rootCmd.AddCommand(newGetCmd())
	rootCmd.AddCommand(newPostCmd())
	rootCmd.AddCommand(newPutCmd())
	rootCmd.AddCommand(newPatchCmd())
	rootCmd.AddCommand(newDeleteCmd())
	rootCmd.AddCommand(newCommandsCmd())

	if err := rootCmd.Execute(); err != nil {
		os.Exit(2)
	}
}
```

Each command file exposes a constructor:

```go
func newGetCmd() *cobra.Command {
	return newRestCmd("get", "GET")
}

func newPostCmd() *cobra.Command {
	return newRestCmd("post", "POST")
}
```

Use flat top-level commands for high-frequency actions:

```bash
xq-octopus config
xq-octopus commands --json
xq-octopus get /health --env dev
xq-octopus post /users --env dev --body '{"name":"Ada"}'
```

Only add nested command groups later if a family grows, for example:

```bash
xq-octopus evidence show
xq-octopus evidence export
```

## Configuration Contract

Default config path: `./xq.json`

Override flag: `--config path/to/xq.json`

Required environment selector: `--env <name>`

Example `xq.json.example`:

```json
{
  "environments": {
    "dev": {
      "api_base_url": "http://localhost:3000",
      "api_token": "replace-me",
      "headers": {
        "X-App": "xq-octopus"
      }
    }
  }
}
```

Rules:

- `api_base_url` is required.
- `api_token` is optional.
- `headers` is optional.
- Output must redact `api_token`.

## Shared Models

`internal/model/config.go`:

```go
package model

type FileConfig struct {
	Environments map[string]EnvironmentConfig `json:"environments"`
}

type EnvironmentConfig struct {
	APIBaseURL string            `json:"api_base_url"`
	APIToken   string            `json:"api_token,omitempty"`
	Headers    map[string]string `json:"headers,omitempty"`
}

type RuntimeConfig struct {
	Environment string            `json:"environment"`
	APIBaseURL  string            `json:"api_base_url"`
	APIToken    string            `json:"-"`
	Headers     map[string]string `json:"headers,omitempty"`
}
```

`internal/model/command.go`:

```go
package model

type RestCommand struct {
	Method       string
	Path         string
	Body         []byte
	ExpectStatus int
	ExpectJSON   map[string]string
	Pretty       bool
}
```

`internal/model/result.go`:

```go
package model

type CommandResult struct {
	OK         bool           `json:"ok"`
	Command    string         `json:"command"`
	StatusCode int            `json:"status_code,omitempty"`
	URL        string         `json:"url,omitempty"`
	Evidence   map[string]any `json:"evidence,omitempty"`
	Errors     []ResultError  `json:"errors,omitempty"`
}

type ResultError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
```

## Config Loading

`internal/config/loader.go` exposes:

```go
func Load(path string, env string) (model.RuntimeConfig, error)
```

Behavior:

- Use `xq.json` when `path` is empty.
- Require `env`.
- Decode JSON into `model.FileConfig`.
- Find `environments[env]`.
- Require `api_base_url`.
- Return `model.RuntimeConfig`.
- Never include `api_token` in errors.

## REST Validation

`internal/rest/validation.go` owns pure validation functions:

```go
func ValidateStatus(actual int, expected int) []model.ResultError
func ValidateJSON(body []byte, expected map[string]string) []model.ResultError
```

Day 1 JSON pointer scope:

- Support `/id`, `/user/name`, and `/items/0/id`.
- Decode response JSON into `any`.
- Traverse maps and arrays.
- Compare values using string form.
- Return `json_mismatch`, `json_path_missing`, or `json_invalid`.

## REST Execution

`internal/rest/client.go` owns HTTP:

```go
type Client struct {
	HTTPClient *http.Client
}

func (c Client) Execute(ctx context.Context, cfg model.RuntimeConfig, cmd model.RestCommand) model.CommandResult
```

Behavior:

- Join `cfg.APIBaseURL` and `cmd.Path`.
- Add configured headers.
- Add `Authorization: Bearer <token>` when `api_token` exists.
- Send JSON body for write commands.
- Read response body.
- Validate status and JSON expectations.
- Return structured evidence.

Tests should use `httptest.Server`, not a real backend.

## Engine

`internal/core/engine.go` gives the CLI one deep interface:

```go
type Engine struct {
	Config model.RuntimeConfig
	REST   rest.Client
}

func (e Engine) Execute(ctx context.Context, cmd model.RestCommand) model.CommandResult
```

Rules:

- The engine does not parse flags.
- The engine does not print.
- The engine normalizes unexpected errors into `CommandResult`.

## Cobra REST Command Builder

The shared REST command builder owns common flags:

```go
func newRestCmd(name string, method string) *cobra.Command {
	var configPath string
	var env string
	var body string
	var expectStatus int
	var expectJSON repeatedStrings
	var pretty bool

	cmd := &cobra.Command{
		Use:   name + " /path",
		Short: "Run a " + method + " request and validate the response",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if env == "" {
				return exitError{Code: 2, Message: "--env is required"}
			}

			expectedJSON, err := parseExpectedJSON(expectJSON)
			if err != nil {
				return exitError{Code: 2, Message: err.Error()}
			}

			runtimeConfig, err := config.Load(configPath, env)
			if err != nil {
				return exitError{Code: 2, Message: err.Error()}
			}

			result := core.Engine{
				Config: runtimeConfig,
				REST:   rest.Client{},
			}.Execute(cmd.Context(), model.RestCommand{
				Method:       method,
				Path:         args[0],
				Body:         []byte(body),
				ExpectStatus: expectStatus,
				ExpectJSON:   expectedJSON,
				Pretty:       pretty,
			})

			return printResult(cmd, result, pretty)
		},
	}

	addRuntimeFlags(cmd, &configPath, &env, &pretty)
	cmd.Flags().StringVar(&body, "body", "", "JSON request body")
	cmd.Flags().IntVar(&expectStatus, "expect-status", 0, "Expected HTTP status")
	cmd.Flags().Var(&expectJSON, "expect-json", "Expected JSON pointer value, such as /ok=true")

	return cmd
}
```

Repeated `--expect-json` uses Cobra's `pflag.Value` shape:

```go
type repeatedStrings []string

func (r *repeatedStrings) String() string { return strings.Join(*r, ",") }
func (r *repeatedStrings) Set(v string) error {
	*r = append(*r, v)
	return nil
}
```

Parse `/pointer=value` into `map[string]string`.

## Output Rendering

`internal/output/render.go` owns serialization:

```go
func JSON(w io.Writer, result model.CommandResult) error
func Pretty(w io.Writer, result model.CommandResult) error
```

JSON output is default and machine-readable. Pretty output is optional and only
for humans.

## Command Catalog

`internal/rest/catalog.go` exposes machine-readable command metadata:

```go
type CommandCatalogEntry struct {
	Name      string   `json:"name"`
	Summary   string   `json:"summary"`
	Usage     string   `json:"usage"`
	Required  []string `json:"required"`
	ExitCodes []int    `json:"exit_codes"`
	Examples  []string `json:"examples"`
}

func Catalog() []CommandCatalogEntry
```

`xq-octopus commands --json` should emit a stable catalog. This is the
CLI-as-skill contract agents can inspect.

## Tests

Write tests in this order:

1. `internal/config/loader_test.go`
2. `internal/rest/validation_test.go`
3. `internal/rest/client_test.go`
4. `internal/core/engine_test.go`
5. CLI subprocess tests for `--help`, `commands --json`, and missing `--env`

Run:

```bash
go test ./...
go build -o dist/xq-octopus ./cmd/xq-octopus
./dist/xq-octopus --help
./dist/xq-octopus commands --json
```

## Release Binaries

Local platform:

```bash
go build -o dist/xq-octopus ./cmd/xq-octopus
```

Linux amd64:

```bash
GOOS=linux GOARCH=amd64 go build -o dist/xq-octopus-linux-amd64 ./cmd/xq-octopus
```

macOS Apple Silicon:

```bash
GOOS=darwin GOARCH=arm64 go build -o dist/xq-octopus-darwin-arm64 ./cmd/xq-octopus
```

Windows amd64:

```bash
GOOS=windows GOARCH=amd64 go build -o dist/xq-octopus-windows-amd64.exe ./cmd/xq-octopus
```

This is the operational reason to choose Go for this track: users and agents can
download one binary and run it directly.

## Common Mistakes

- Do not log or print `api_token`.
- Do not let CLI parsing leak into `internal/rest`.
- Do not make HTTP calls in tests except through `httptest.Server`.
- Do not hide validation failures as transport errors.
- Do not emit human-only output by default.
- Do not add scenario parsing to the CLI.
- Do not add third-party dependencies beyond Cobra without a concrete reason.
- Do not commit files under `dist/`.
