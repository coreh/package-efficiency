package main

import (
	"bytes"
	"archive/zip"
	"io"
)

type entry struct {
	Name string `json:"name"`
	Text string `json:"text"`
}

type result struct {
	Entries      []entry `json:"entries"`
	ArchiveBytes int     `json:"archiveBytes"`
}

func operation(value any) any {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)
	for _, e := range value.([]any) {
		m := e.(map[string]any)
		f, err := w.Create(m["name"].(string))
		if err != nil {
			panic(err)
		}
		if _, err := f.Write([]byte(m["text"].(string))); err != nil {
			panic(err)
		}
	}
	if err := w.Close(); err != nil {
		panic(err)
	}
	r, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		panic(err)
	}
	out := make([]entry, 0, len(r.File))
	for _, f := range r.File {
		rc, err := f.Open()
		if err != nil {
			panic(err)
		}
		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			panic(err)
		}
		out = append(out, entry{f.Name, string(data)})
	}
	return result{out, buf.Len()}
}
