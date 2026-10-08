// The checker of scripts/sweep-types/gomod.mjs: type-checks a whole package
// tree from source with go/types, the type checker of the Go distribution,
// without compiling anything. Go has no check-only command; this is what
// `cargo check` is to `cargo build`.
//
// Usage: gomod-typecheck <packages.json>
// packages.json is the output of `go list -deps -json`: every package of the
// tree, dependencies first, with its directory and source files. Each is
// parsed and checked in that order, the standard library included, in one
// process and one thread, so the peak memory is that of holding the types of
// the whole tree. Prints a JSON summary; exits 1 if a package outside the
// standard library has a type error.
package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"go/types"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

type listed struct {
	ImportPath string
	Dir        string
	Name       string
	GoFiles    []string
	ImportMap  map[string]string
	Standard   bool
	Module     *struct{ GoVersion string }
}

type importer struct {
	checked map[string]*types.Package
	mapped  map[string]string
}

func (i importer) Import(path string) (*types.Package, error) {
	if to, ok := i.mapped[path]; ok {
		path = to
	}
	if pkg, ok := i.checked[path]; ok {
		return pkg, nil
	}
	return nil, fmt.Errorf("package %s is not in the list", path)
}

func main() {
	file, err := os.Open(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	decoder := json.NewDecoder(file)
	fset := token.NewFileSet()
	checked := map[string]*types.Package{"unsafe": types.Unsafe}
	packages, files, failures, stdFailures := 0, 0, 0, 0
	first := []string{}
	// Where the time goes: the standard library's packages, and the rest.
	var standardLibrary, others time.Duration
	for {
		var pkg listed
		if err := decoder.Decode(&pkg); err == io.EOF {
			break
		} else if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(2)
		}
		if pkg.ImportPath == "unsafe" {
			continue
		}
		started := time.Now()
		var parsed []*ast.File
		for _, name := range pkg.GoFiles {
			f, err := parser.ParseFile(fset, filepath.Join(pkg.Dir, name), nil, parser.SkipObjectResolution)
			if err != nil {
				if !pkg.Standard {
					failures++
					if len(first) < 5 {
						first = append(first, err.Error())
					}
				}
				continue
			}
			parsed = append(parsed, f)
		}
		config := types.Config{
			Importer:    importer{checked, pkg.ImportMap},
			Sizes:       types.SizesFor("gc", runtime.GOARCH),
			FakeImportC: true,
			Error: func(err error) {
				if pkg.Standard {
					stdFailures++
					return
				}
				failures++
				if len(first) < 5 {
					first = append(first, err.Error())
				}
			},
		}
		if pkg.Module != nil && pkg.Module.GoVersion != "" {
			config.GoVersion = "go" + pkg.Module.GoVersion
		}
		result, _ := config.Check(pkg.ImportPath, fset, parsed, nil)
		checked[pkg.ImportPath] = result
		if pkg.Standard {
			standardLibrary += time.Since(started)
		} else {
			others += time.Since(started)
		}
		packages++
		files += len(parsed)
	}
	json.NewEncoder(os.Stdout).Encode(map[string]any{"packages": packages, "files": files, "errors": failures, "standardLibraryErrors": stdFailures, "first": first, "standardLibraryMs": float64(standardLibrary.Microseconds()) / 1000, "otherMs": float64(others.Microseconds()) / 1000})
	if failures > 0 {
		os.Exit(1)
	}
}
