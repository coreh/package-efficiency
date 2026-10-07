package main

import "github.com/jessevdk/go-flags"

type options struct {
	Verbose bool     `short:"v" long:"verbose"`
	Dry     bool     `short:"d" long:"dry-run"`
	Force   bool     `short:"f" long:"force"`
	Name    *string  `short:"n" long:"name"`
	Count   *int     `short:"c" long:"count"`
	Tags    []string `short:"t" long:"tag"`
}

type result struct {
	Verbose bool     `json:"verbose"`
	Dry     bool     `json:"dry"`
	Force   bool     `json:"force"`
	Name    *string  `json:"name"`
	Count   *int     `json:"count"`
	Tags    []string `json:"tags"`
	Files   []string `json:"files"`
}

var (
	opts   options
	parser = flags.NewParser(&opts, flags.Default)
)

// Untimed, once per fixture: the argv list becomes a []string.
func prepare(value any) any {
	list := value.(map[string]any)["argv"].([]any)
	argv := make([]string, len(list))
	for i, a := range list {
		argv[i] = a.(string)
	}
	return argv
}

func operation(value any) any {
	opts = options{}
	rest, err := parser.ParseArgs(value.([]string))
	if err != nil {
		panic(err)
	}
	if rest == nil {
		rest = []string{}
	}
	if opts.Tags == nil {
		opts.Tags = []string{}
	}
	return &result{opts.Verbose, opts.Dry, opts.Force, opts.Name, opts.Count, opts.Tags, rest}
}
