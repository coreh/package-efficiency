package main

import "github.com/avct/uasurfer"

func operation(value any) any {
	ua := uasurfer.Parse(value.(string))
	return map[string]string{
		"browser": ua.Browser.Name.StringTrimPrefix(),
		"version": itoa(ua.Browser.Version.Major),
		"os":      ua.OS.Name.StringTrimPrefix(),
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}
