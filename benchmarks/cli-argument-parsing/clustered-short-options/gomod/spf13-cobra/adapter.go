package main

import (
	"io"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

type result struct {
	Verbose bool     `json:"verbose"`
	Dry     bool     `json:"dry"`
	Force   bool     `json:"force"`
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
	verbose, dry, force bool
	name                string
	count               int
	tags                []string
)

var out *result

var cmd = &cobra.Command{
	Use:           "app",
	SilenceUsage:  true,
	SilenceErrors: true,
	Run: func(c *cobra.Command, args []string) {
		out = build(args, c.Flags().Changed)
	},
}

func init() {
	cmd.SetOut(io.Discard)
	cmd.SetErr(io.Discard)
	cmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "")
	cmd.Flags().BoolVarP(&dry, "dry-run", "d", false, "")
	cmd.Flags().BoolVarP(&force, "force", "f", false, "")
	cmd.Flags().StringVarP(&name, "name", "n", "", "")
	cmd.Flags().IntVarP(&count, "count", "c", 0, "")
	cmd.Flags().StringArrayVarP(&tags, "tag", "t", nil, "")
}

func build(args []string, set func(string) bool) *result {
	r := &result{Verbose: verbose, Dry: dry, Force: force, Tags: tags, Files: args}
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
	verbose, dry, force = false, false, false
	name, count, tags = "", 0, nil
	cmd.Flags().VisitAll(func(f *pflag.Flag) { f.Changed = false })
	cmd.SetArgs(value.([]string))
	if err := cmd.Execute(); err != nil {
		panic(err)
	}
	return out
}
