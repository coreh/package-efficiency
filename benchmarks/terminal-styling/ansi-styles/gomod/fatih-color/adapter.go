package main

import "github.com/fatih/color"

func init() { color.NoColor = false }

var (
	red       = color.New(color.FgRed)
	green     = color.New(color.FgGreen)
	bold      = color.New(color.Bold)
	underline = color.New(color.Underline)
	boldBlue  = color.New(color.Bold, color.FgBlue)
	rbu       = color.New(color.FgRed, color.Bold, color.Underline)
	boldRed   = color.New(color.Bold, color.FgRed)
	redBold   = color.New(color.FgRed, color.Bold)
	greenUl   = color.New(color.FgGreen, color.Underline)
	ulBoldRed = color.New(color.Underline, color.Bold, color.FgRed)
	ul        = underline
)

func operation(value any) any {
	in := value.(map[string]any)
	a, b, c := in["a"].(string), in["b"].(string), in["c"].(string)
	switch in["style"].(string) {
	case "red":
		return red.Sprint(a)
	case "green":
		return green.Sprint(a)
	case "bold":
		return bold.Sprint(a)
	case "underline":
		return underline.Sprint(a)
	case "bold-blue":
		return boldBlue.Sprint(a)
	case "red-bold-underline":
		return rbu.Sprint(a)
	case "bold-in-red":
		return red.Sprint(a) + redBold.Sprint(b) + red.Sprint(c)
	case "underline-in-green":
		return green.Sprint(a) + greenUl.Sprint(b) + green.Sprint(c)
	case "red-in-bold":
		return bold.Sprint(a) + boldRed.Sprint(b) + bold.Sprint(c)
	case "deep":
		return ul.Sprint(a) + ulBoldRed.Sprint(b) + ul.Sprint(c)
	}
	panic("unknown style")
}
