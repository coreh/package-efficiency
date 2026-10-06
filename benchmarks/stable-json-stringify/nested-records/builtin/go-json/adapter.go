package main
import ("bytes";"encoding/json")
func operation(value any) any {var b bytes.Buffer;enc:=json.NewEncoder(&b);enc.SetEscapeHTML(false);if err:=enc.Encode(value);err!=nil{panic(err)};s:=b.String();return s[:len(s)-1]}
