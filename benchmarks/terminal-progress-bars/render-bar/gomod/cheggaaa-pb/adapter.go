package main

import pb "github.com/cheggaaa/pb/v3"

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
	bar := pb.New64(total)
	bar.SetWriter(out)
	bar.SetWidth(80)
	bar.Set(pb.Static, true)
	bar.Start()
	for i := 0; i < steps; i++ {
		bar.Increment().Write()
	}
	return out.last
}
