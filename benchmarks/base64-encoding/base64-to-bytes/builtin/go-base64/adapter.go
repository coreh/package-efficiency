package main
import (
	"encoding/base64"
	"encoding/json"
)
type byteList []byte
func (b byteList) MarshalJSON() ([]byte, error) {
	numbers := make([]int, len(b))
	for i, v := range b { numbers[i] = int(v) }
	return json.Marshal(numbers)
}
func operation(value any) any {
	decoded, err := base64.StdEncoding.DecodeString(value.(string))
	if err != nil { panic(err) }
	return byteList(decoded)
}
