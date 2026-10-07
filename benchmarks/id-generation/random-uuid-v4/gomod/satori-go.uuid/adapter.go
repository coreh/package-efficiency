package main

import uuid "github.com/satori/go.uuid"

func operation(value any) any { return uuid.NewV4().String() }
