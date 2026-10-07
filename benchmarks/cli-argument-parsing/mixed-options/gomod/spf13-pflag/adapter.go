package main

import (
	"io"

	"github.com/spf13/pflag"
)

type result struct {
	Verbose bool     `json:"verbose"`
	Dry     bool     `json:"dry"`
	Name    *string  `json:"name"`
	Count   *int     `json:"count"`
	Tags    []string `json:"tags"`
	Files   []string `json:"files"`
}

// Untimed, once per fixture: the argv list becomes a []string.
func prepare(value any) any {
	list := value.(map[string]any)["argv"].([]any)
	argv := make([]string, len(list))
	for i, a := range list {
		argv[i] = a.(string)
	}
	return argv
}

var (
	verbose, dry bool
	name         string
	count        int
	tags         []string
)

var fs = pflag.NewFlagSet("app", pflag.ContinueOnError)

func init() {
	fs.SetOutput(io.Discard)
	fs.BoolVarP(&verbose, "verbose", "v", false, "")
	fs.BoolVarP(&dry, "dry-run", "d", false, "")

	fs.StringVarP(&name, "name", "n", "", "")
	fs.IntVarP(&count, "count", "c", 0, "")
	fs.StringArrayVarP(&tags, "tag", "t", nil, "")
}

func build(args []string, set func(string) bool) *result {
	r := &result{Verbose: verbose, Dry: dry, Tags: tags, Files: args}
	if r.Tags == nil {
		r.Tags = []string{}
	}
	if set("name") {
		n := name
		r.Name = &n
	}
	if set("count") {
		c := count
		r.Count = &c
	}
	return r
}

func operation(value any) any {
	verbose, dry = false, false
	name, count, tags = "", 0, nil
	fs.VisitAll(func(f *pflag.Flag) { f.Changed = false })
	if err := fs.Parse(value.([]string)); err != nil {
		panic(err)
	}
	return build(fs.Args(), fs.Changed)
}
