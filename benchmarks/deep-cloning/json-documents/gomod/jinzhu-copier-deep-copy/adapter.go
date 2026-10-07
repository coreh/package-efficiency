package main

import (
	"reflect"

	"github.com/jinzhu/copier"
)

func operation(value any) any {
	out := reflect.New(reflect.TypeOf(value))
	if err := copier.CopyWithOption(out.Interface(), value, copier.Option{DeepCopy: true}); err != nil {
		panic(err)
	}
	return out.Elem().Interface()
}
