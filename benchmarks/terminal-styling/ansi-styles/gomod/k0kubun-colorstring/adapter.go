package main

import "github.com/k0kubun/colorstring"

var cs = colorstring.Colorize{Colors: colorstring.DefaultColors, Reset: true}

func operation(value any) any {
	in := value.(map[string]any)
	a, b, c := in["a"].(string), in["b"].(string), in["c"].(string)
	switch in["style"].(string) {
	case "red":
		return cs.Color("[red]" + a)
	case "green":
		return cs.Color("[green]" + a)
	case "bold":
		return cs.Color("[bold]" + a)
	case "underline":
		return cs.Color("[underline]" + a)
	case "bold-blue":
		return cs.Color("[bold][blue]" + a)
	case "red-bold-underline":
		return cs.Color("[red][bold][underline]" + a)
	case "bold-in-red":
		return cs.Color("[red]"+a) + cs.Color("[red][bold]"+b) + cs.Color("[red]"+c)
	case "underline-in-green":
		return cs.Color("[green]"+a) + cs.Color("[green][underline]"+b) + cs.Color("[green]"+c)
	case "red-in-bold":
		return cs.Color("[bold]"+a) + cs.Color("[bold][red]"+b) + cs.Color("[bold]"+c)
	case "deep":
		return cs.Color("[underline]"+a) + cs.Color("[underline][bold][red]"+b) + cs.Color("[underline]"+c)
	}
	panic("unknown style")
}
