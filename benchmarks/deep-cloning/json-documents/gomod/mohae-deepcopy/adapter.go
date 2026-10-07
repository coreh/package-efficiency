package main

import "github.com/mohae/deepcopy"

func operation(value any) any { return deepcopy.Copy(value) }
