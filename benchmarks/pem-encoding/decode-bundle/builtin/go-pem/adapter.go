package main
import "encoding/pem"
type block struct {
	Label string `json:"label"`
	Data  []byte `json:"data"`
}
func operation(value any) any {
	rest := []byte(value.(string))
	out := []block{}
	for {
		var b *pem.Block
		b, rest = pem.Decode(rest)
		if b == nil {
			return out
		}
		out = append(out, block{b.Type, b.Bytes})
	}
}
