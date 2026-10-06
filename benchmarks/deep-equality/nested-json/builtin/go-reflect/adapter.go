package main
import "reflect"
func operation(value any) any { p:=value.([]any);return reflect.DeepEqual(p[0],p[1]) }
