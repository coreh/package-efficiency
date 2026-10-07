package main

import "strconv"

// Untimed, once per fixture: the JSON number narrowed to float32 (exact).
func prepare(value any) any { return float32(value.(float64)) }

func operation(value any) any { return strconv.FormatFloat(float64(value.(float32)), 'g', -1, 32) }
