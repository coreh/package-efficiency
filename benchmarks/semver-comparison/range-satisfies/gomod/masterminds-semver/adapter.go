package main

import "github.com/Masterminds/semver/v3"

func operation(value any) any {
	in := value.([]any)
	c, err := semver.NewConstraint(in[1].(string))
	if err != nil {
		panic(err)
	}
	v, err := semver.NewVersion(in[0].(string))
	if err != nil {
		panic(err)
	}
	return c.Check(v)
}
