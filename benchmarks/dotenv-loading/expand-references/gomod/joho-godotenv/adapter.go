package main
import "github.com/joho/godotenv"
func operation(value any) any {
	out, err := godotenv.Unmarshal(value.(string))
	if err != nil { panic(err) }
	return out
}
