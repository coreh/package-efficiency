package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"fmt"

	gettext "github.com/chai2010/gettext-go"
)

type lookup struct {
	msgid  string
	plural string
	hasN   bool
	n      int
	args   []any
}

type prepared struct {
	tr      gettext.Gettexter
	lookups []lookup
}

// Not timed: runs once per fixture. The library loads catalogs from a folder or a zip file, so the
// .mo bytes are put into a zip in memory; the locale is set here, which loads the catalog.
func prepare(value any) any {
	in := value.(map[string]any)
	locale := in["locale"].(string)
	raw, err := base64.StdEncoding.DecodeString(in["mo"].(string))
	if err != nil {
		panic(err)
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, err := zw.Create("locale/" + locale + "/LC_MESSAGES/messages.mo")
	if err != nil {
		panic(err)
	}
	if _, err := w.Write(raw); err != nil {
		panic(err)
	}
	if err := zw.Close(); err != nil {
		panic(err)
	}
	tr := gettext.New("messages", "locale.zip", buf.Bytes())
	tr.SetLanguage(locale)
	var lookups []lookup
	for _, item := range in["lookups"].([]any) {
		l := item.(map[string]any)
		out := lookup{msgid: l["msgid"].(string)}
		if p, ok := l["plural"].(string); ok {
			out.plural = p
			out.hasN = true
			out.n = int(l["n"].(float64))
		}
		for _, a := range l["args"].([]any) {
			if f, ok := a.(float64); ok {
				out.args = append(out.args, int(f))
			} else {
				out.args = append(out.args, a)
			}
		}
		lookups = append(lookups, out)
	}
	return &prepared{tr: tr, lookups: lookups}
}

func operation(value any) any {
	p := value.(*prepared)
	out := make([]any, len(p.lookups))
	for i := range p.lookups {
		l := &p.lookups[i]
		var text string
		if l.hasN {
			text = p.tr.NGettext(l.msgid, l.plural, l.n)
		} else {
			text = p.tr.Gettext(l.msgid)
		}
		out[i] = fmt.Sprintf(text, l.args...)
	}
	return out
}
