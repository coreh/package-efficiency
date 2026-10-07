package main

import "github.com/morikuni/aec"

var (
	red       = aec.RedF
	green     = aec.GreenF
	bold      = aec.Bold
	underline = aec.Underline
	boldBlue  = aec.EmptyBuilder.Bold().BlueF().ANSI
	rbu       = aec.EmptyBuilder.RedF().Bold().Underline().ANSI
	redBold   = aec.EmptyBuilder.RedF().Bold().ANSI
	greenUl   = aec.EmptyBuilder.GreenF().Underline().ANSI
	boldRed   = aec.EmptyBuilder.Bold().RedF().ANSI
	ulBoldRed = aec.EmptyBuilder.Underline().Bold().RedF().ANSI
)

func operation(value any) any {
	in := value.(map[string]any)
	a, b, c := in["a"].(string), in["b"].(string), in["c"].(string)
	switch in["style"].(string) {
	case "red":
		return red.Apply(a)
	case "green":
		return green.Apply(a)
	case "bold":
		return bold.Apply(a)
	case "underline":
		return underline.Apply(a)
	case "bold-blue":
		return boldBlue.Apply(a)
	case "red-bold-underline":
		return rbu.Apply(a)
	case "bold-in-red":
		return red.Apply(a) + redBold.Apply(b) + red.Apply(c)
	case "underline-in-green":
		return green.Apply(a) + greenUl.Apply(b) + green.Apply(c)
	case "red-in-bold":
		return bold.Apply(a) + boldRed.Apply(b) + bold.Apply(c)
	case "deep":
		return underline.Apply(a) + ulBoldRed.Apply(b) + underline.Apply(c)
	}
	panic("unknown style")
}
