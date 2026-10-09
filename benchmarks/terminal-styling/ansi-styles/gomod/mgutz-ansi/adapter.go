package main

import "github.com/mgutz/ansi"

var (
	red       = ansi.ColorFunc("red")
	green     = ansi.ColorFunc("green")
	bold      = ansi.ColorFunc("default+b")
	underline = ansi.ColorFunc("default+u")
	boldBlue  = ansi.ColorFunc("blue+b")
	rbu       = ansi.ColorFunc("red+bu")
	redBold   = ansi.ColorFunc("red+b")
	greenUl   = ansi.ColorFunc("green+u")
	boldRed   = ansi.ColorFunc("red+b")
	ulBoldRed = ansi.ColorFunc("red+bu")
)

func operation(value any) any {
	in := value.(map[string]any)
	a, b, c := in["a"].(string), in["b"].(string), in["c"].(string)
	switch in["style"].(string) {
	case "red":
		return red(a)
	case "green":
		return green(a)
	case "bold":
		return bold(a)
	case "underline":
		return underline(a)
	case "bold-blue":
		return boldBlue(a)
	case "red-bold-underline":
		return rbu(a)
	case "bold-in-red":
		return red(a) + redBold(b) + red(c)
	case "underline-in-green":
		return green(a) + greenUl(b) + green(c)
	case "red-in-bold":
		return bold(a) + boldRed(b) + bold(c)
	case "deep":
		return underline(a) + ulBoldRed(b) + underline(c)
	}
	panic("unknown style")
}
