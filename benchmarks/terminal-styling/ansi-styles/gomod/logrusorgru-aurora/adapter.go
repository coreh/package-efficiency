package main

import "github.com/logrusorgru/aurora/v4"

var au = aurora.New(aurora.WithColors(true))

func operation(value any) any {
	in := value.(map[string]any)
	a, b, c := in["a"].(string), in["b"].(string), in["c"].(string)
	switch in["style"].(string) {
	case "red":
		return au.Red(a).String()
	case "green":
		return au.Green(a).String()
	case "bold":
		return au.Bold(a).String()
	case "underline":
		return au.Underline(a).String()
	case "bold-blue":
		return au.Blue(a).Bold().String()
	case "red-bold-underline":
		return au.Red(a).Bold().Underline().String()
	case "bold-in-red":
		return au.Red(a).String() + au.Red(b).Bold().String() + au.Red(c).String()
	case "underline-in-green":
		return au.Green(a).String() + au.Green(b).Underline().String() + au.Green(c).String()
	case "red-in-bold":
		return au.Bold(a).String() + au.Red(b).Bold().String() + au.Bold(c).String()
	case "deep":
		return au.Underline(a).String() + au.Red(b).Bold().Underline().String() + au.Underline(c).String()
	}
	panic("unknown style")
}
