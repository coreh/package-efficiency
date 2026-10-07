package main

import (
	"archive/tar"
	"bytes"
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
	w := tar.NewWriter(&buf)
	for _, e := range value.([]any) {
		m := e.(map[string]any)
		data := []byte(m["text"].(string))
		if err := w.WriteHeader(&tar.Header{Name: m["name"].(string), Mode: 0o644, Size: int64(len(data))}); err != nil {
			panic(err)
		}
		if _, err := w.Write(data); err != nil {
			panic(err)
		}
	}
	if err := w.Close(); err != nil {
		panic(err)
	}
	size := buf.Len()
	r := tar.NewReader(bytes.NewReader(buf.Bytes()))
	out := make([]entry, 0, len(value.([]any)))
	for {
		h, err := r.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			panic(err)
		}
		data, err := io.ReadAll(r)
		if err != nil {
			panic(err)
		}
		out = append(out, entry{h.Name, string(data)})
	}
	return result{out, size}
}
