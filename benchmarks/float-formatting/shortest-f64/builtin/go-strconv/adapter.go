package main
import "strconv"
func operation(value any) any { return strconv.FormatFloat(value.(float64), 'g', -1, 64) }
