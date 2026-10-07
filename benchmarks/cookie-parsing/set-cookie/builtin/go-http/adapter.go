package main

import "net/http"

// The task's common shape. A nil pointer is JSON null.
type parsed struct {
	Name     string  `json:"name"`
	Value    string  `json:"value"`
	Path     *string `json:"path"`
	Domain   *string `json:"domain"`
	MaxAge   *int    `json:"maxAge"`
	Secure   bool    `json:"secure"`
	HttpOnly bool    `json:"httpOnly"`
	SameSite *string `json:"sameSite"`
}

var lax, strict, none = "lax", "strict", "none"

func operation(value any) any {
	c, err := http.ParseSetCookie(value.(string))
	if err != nil {
		panic(err)
	}
	p := parsed{Name: c.Name, Value: c.Value, Secure: c.Secure, HttpOnly: c.HttpOnly}
	if c.Path != "" {
		p.Path = &c.Path
	}
	if c.Domain != "" {
		p.Domain = &c.Domain
	}
	switch c.SameSite {
	case http.SameSiteLaxMode:
		p.SameSite = &lax
	case http.SameSiteStrictMode:
		p.SameSite = &strict
	case http.SameSiteNoneMode:
		p.SameSite = &none
	}
	// Go encodes "Max-Age=0" as MaxAge -1 and an absent Max-Age as 0.
	if c.MaxAge > 0 {
		p.MaxAge = &c.MaxAge
	} else if c.MaxAge < 0 {
		p.MaxAge = new(int)
	}
	return p
}
