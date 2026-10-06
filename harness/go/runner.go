package main

import (
 "bufio"
 "encoding/json"
 "fmt"
 "os"
 "runtime"
 "syscall"
 "time"
)
func memory() map[string]any {
 for i:=0;i<3;i++ {runtime.GC(); time.Sleep(25*time.Millisecond)}
 var m runtime.MemStats; runtime.ReadMemStats(&m)
 return map[string]any{"heapUsed":m.HeapAlloc}
}
func send(phase string, fields map[string]any) {
 fields["phase"]=phase
 b,err:=json.Marshal(fields); if err!=nil {panic(err)}
 fmt.Printf("@@%s\n",b)
}
func cpu() float64 {
 var r syscall.Rusage
 if err:=syscall.Getrusage(syscall.RUSAGE_SELF,&r); err!=nil {panic(err)}
 return float64(r.Utime.Sec+r.Stime.Sec)*1000+float64(r.Utime.Usec+r.Stime.Usec)/1000
}
func main() {
 send("boot",map[string]any{"pid":os.Getpid(),"memory":memory()})
 scanner:=bufio.NewScanner(os.Stdin)
 var inputs []any
 if os.Args[1]!="-" {
  b,err:=os.ReadFile(os.Args[1]); if err!=nil {panic(err)}
  var fixtures struct{Cases []struct{Input any `json:"input"`} `json:"cases"`}
  if err:=json.Unmarshal(b,&fixtures);err!=nil {panic(err)}
  outputs:=make([]any,len(fixtures.Cases))
  for i,c:=range fixtures.Cases {inputs=append(inputs,c.Input);outputs[i]=operation(c.Input)}
  send("verification",map[string]any{"outputs":outputs})
  if !scanner.Scan() || scanner.Text()!="verified" {os.Exit(1)}
 }
 send("ready",map[string]any{"memory":memory()})
 for scanner.Scan() {
  line:=scanner.Text()
  if line=="exit" {break}
  if line=="settle" {send("settled",map[string]any{"memory":memory()});continue}
  var command struct{Count int `json:"count"`; MinMs float64 `json:"minMs"`}
  if err:=json.Unmarshal([]byte(line),&command);err!=nil {panic(err)}
  if command.Count<1 {panic("positive count required")}
  operations:=0;var checksum uint32
  before,start:=cpu(),time.Now()
  for {
   for i:=0;i<command.Count;i++ {
    output:=operation(inputs[(operations+i)%len(inputs)])
    switch value:=output.(type) {case string:checksum+=uint32(len(value));case bool:if value {checksum++};default:panic("invalid output")}
   }
   operations+=command.Count
   if float64(time.Since(start).Nanoseconds())/1e6>=command.MinMs {break}
  }
  elapsed:=float64(time.Since(start).Nanoseconds())/1e6;used:=cpu()-before
  send("round",map[string]any{"operations":operations,"checksum":checksum,"wallMs":elapsed,"cpuMs":used})
 }
 if err:=scanner.Err();err!=nil {panic(err)}
}
