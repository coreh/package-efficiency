// Parse and type-check the adapter, including reading prepared stdlib export
// data. Building those exports and code generation are outside measurement.
package main
import("encoding/json";"go/ast";"go/importer";"go/parser";"go/token";"go/types";"io";"os";"fmt")
func main(){
 exports:=map[string]string{}
 raw,err:=os.ReadFile(os.Args[1]);if err!=nil{panic(err)}
 if err=json.Unmarshal(raw,&exports);err!=nil{panic(err)}
 fs:=token.NewFileSet()
 file,err:=parser.ParseFile(fs,os.Args[2],nil,0);if err!=nil{fmt.Fprintln(os.Stderr,err);os.Exit(1)}
 imp:=importer.ForCompiler(fs,"gc",func(path string)(io.ReadCloser,error){return os.Open(exports[path])})
 config:=types.Config{Importer:imp}
 if _,err=config.Check("benchmark",fs,[]*ast.File{file},nil);err!=nil{fmt.Fprintln(os.Stderr,err);os.Exit(1)}
}
