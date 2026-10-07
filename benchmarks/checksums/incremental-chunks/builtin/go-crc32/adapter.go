package main

import "hash/crc32"

func operation(value any) any {
	var crc uint32
	for _, chunk := range value.([]any) {
		crc = crc32.Update(crc, crc32.IEEETable, []byte(chunk.(string)))
	}
	return crc
}
