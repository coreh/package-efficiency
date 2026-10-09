package main

import "github.com/gookit/color"

func init() { color.ForceColor() }

var (
	red       = color.New(color.FgRed)
	green     = color.New(color.FgGreen)
	bold      = color.New(color.OpBold)
	underline = color.New(color.OpUnderscore)
	boldBlue  = color.New(color.OpBold, color.FgBlue)
	rbu       = color.New(color.FgRed, color.OpBold, color.OpUnderscore)
	redBold   = color.New(color.FgRed, color.OpBold)
	greenUl   = color.New(color.FgGreen, color.OpUnderscore)
	boldRed   = color.New(color.OpBold, color.FgRed)
	ulBoldRed = color.New(color.OpUnderscore, color.OpBold, color.FgRed)
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
		return underline.Sprint(a) + ulBoldRed.Sprint(b) + underline.Sprint(c)
	}
	panic("unknown style")
}
