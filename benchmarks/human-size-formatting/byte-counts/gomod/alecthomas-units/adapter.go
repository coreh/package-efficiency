package main

import units "github.com/alecthomas/units"

func operation(value any) any { return units.Base2Bytes(int64(value.(float64))).String() }
