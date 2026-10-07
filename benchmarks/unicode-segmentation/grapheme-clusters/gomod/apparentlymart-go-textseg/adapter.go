package main

import (
	"bufio"
	"strings"

	"github.com/apparentlymart/go-textseg/v15/textseg"
)

func operation(value any) any {
	sc := bufio.NewScanner(strings.NewReader(value.(string)))
	sc.Split(textseg.ScanGraphemeClusters)
	out := []string{}
	for sc.Scan() {
		out = append(out, sc.Text())
	}
	if err := sc.Err(); err != nil {
		panic(err)
	}
	return out
}
