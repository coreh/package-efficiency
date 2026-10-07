package main

import "github.com/schollz/progressbar/v3"

type sink struct{ last string }

func (s *sink) Write(p []byte) (int, error) {
	for _, c := range p {
		if c > ' ' {
			s.last = string(p)
			break
		}
	}
	return len(p), nil
}

func operation(value any) any {
	in := value.(map[string]any)
	total, steps := int64(in["total"].(float64)), int(in["steps"].(float64))
	out := &sink{}
	bar := progressbar.NewOptions64(total, progressbar.OptionSetWriter(out))
	for i := 0; i < steps; i++ {
		bar.Add(1)
	}
	return out.last
}
