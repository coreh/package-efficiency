package main

import (
	"reflect"

	"github.com/jinzhu/copier"
)

func operation(value any) any {
	out := reflect.New(reflect.TypeOf(value))
	if err := copier.Copy(out.Interface(), value); err != nil {
		panic(err)
	}
	return out.Elem().Interface()
}
