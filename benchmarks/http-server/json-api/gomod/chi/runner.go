package main
import("bufio";"encoding/json";"fmt";"net";"net/http";"os";"runtime";"time")
func memory() map[string]any {for i:=0;i<3;i++ {runtime.GC();time.Sleep(25*time.Millisecond)};var m runtime.MemStats;runtime.ReadMemStats(&m);return map[string]any{"heapUsed":m.HeapAlloc}}
func send(phase string,fields map[string]any) {fields["phase"]=phase;b,err:=json.Marshal(fields);if err!=nil {panic(err)};fmt.Printf("@@%s\n",b)}
func main(){
 send("boot",map[string]any{"pid":os.Getpid(),"memory":memory()})
 var server *http.Server
 if len(os.Args)>1 && os.Args[1]=="-" {send("ready",map[string]any{"memory":memory()})} else {
  listener,err:=net.Listen("tcp","127.0.0.1:0");if err!=nil {panic(err)}
  server=&http.Server{Handler:handler()}
  go func(){if err:=server.Serve(listener);err!=nil && err!=http.ErrServerClosed {panic(err)}}()
  send("ready",map[string]any{"port":listener.Addr().(*net.TCPAddr).Port,"memory":memory()})
 }
 scanner:=bufio.NewScanner(os.Stdin);for scanner.Scan(){if scanner.Text()=="exit" {break};if scanner.Text()=="settle" {send("settled",map[string]any{"memory":memory()})}}
 if server!=nil {server.Close()};if err:=scanner.Err();err!=nil {panic(err)}
}
