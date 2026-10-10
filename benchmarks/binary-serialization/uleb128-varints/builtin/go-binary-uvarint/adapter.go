package main

import (
	"encoding/binary"
	"encoding/json"
	"strconv"
)

type byteList []byte

func (b byteList) MarshalJSON() ([]byte, error) {
	numbers := make([]int, len(b))
	for i, v := range b {
		numbers[i] = int(v)
	}
	return json.Marshal(numbers)
}

// Decoded values go to the verifier as decimal strings: a JSON number would
// lose precision above 2^53. Used only when verifying.
type valueList []uint64

func (l valueList) MarshalJSON() ([]byte, error) {
	texts := make([]string, len(l))
	for i, v := range l {
		texts[i] = strconv.FormatUint(v, 10)
	}
	return json.Marshal(texts)
}

// Untimed, once per fixture: the decimal strings become uint64 values.
func prepare(value any) any {
	list := value.([]any)
	values := make([]uint64, len(list))
	for i, v := range list {
		n, err := strconv.ParseUint(v.(string), 10, 64)
		if err != nil {
			panic(err)
		}
		values[i] = n
	}
	return values
}

func operation(value any) any {
	values := value.([]uint64)
	encoded := make([]byte, 0, 10*len(values))
	for _, v := range values {
		encoded = binary.AppendUvarint(encoded, v)
	}
	decoded := make([]uint64, 0, len(values))
	for offset := 0; offset < len(encoded); {
		v, n := binary.Uvarint(encoded[offset:])
		if n <= 0 {
			panic("invalid varint")
		}
		decoded = append(decoded, v)
		offset += n
	}
	return []any{byteList(encoded), valueList(decoded)}
}
