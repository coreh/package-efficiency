// In-process half of a client task for Go. The supervisor (harness/client.mjs)
// has already started the peer; the file named by BENCH_CLIENT_TASK says where
// it listens, what the task fixes and the fixture inputs. See "Client tasks"
// in benchmarks/README.md.
//
// An adapter (adapter.go, package main) defines:
//
//	func connect(host string, port int, lanes int)   once, before anything is measured
//	func operation(input any) any                           one exchange with the peer
//
// A round of `count` exchanges runs on `concurrency` lanes, one goroutine
// each: lane w performs exchanges w, w + lanes, w + 2·lanes, … one after
// another, and exchange k uses fixture k mod fixtures. CPU time is the whole
// process's, all threads.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"sync"
	"syscall"
	"time"
)

func memory() map[string]any {
	for i := 0; i < 3; i++ {
		runtime.GC()
		time.Sleep(25 * time.Millisecond)
	}
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return map[string]any{"heapUsed": m.HeapAlloc}
}
func send(phase string, fields map[string]any) {
	fields["phase"] = phase
	b, err := json.Marshal(fields)
	if err != nil {
		panic(err)
	}
	fmt.Printf("@@%s\n", b)
}
func cpu() float64 {
	var r syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &r); err != nil {
		panic(err)
	}
	return float64(r.Utime.Sec+r.Stime.Sec)*1000 + float64(r.Utime.Usec+r.Stime.Usec)/1000
}
func consume(output any) uint32 {
	switch value := output.(type) {
	case string:
		return uint32(len(value))
	case bool:
		if value {
			return 1
		}
		return 0
	case nil:
		return 0
	case []any:
		return uint32(len(value))
	case map[string]any:
		return uint32(len(value))
	default:
		return 1
	}
}
func main() {
	send("boot", map[string]any{"pid": os.Getpid(), "memory": memory()})
	scanner := bufio.NewScanner(os.Stdin)
	b, err := os.ReadFile(os.Getenv("BENCH_CLIENT_TASK"))
	if err != nil {
		panic(err)
	}
	var task struct {
		Host        string `json:"host"`
		Port        int    `json:"port"`
		Concurrency int    `json:"concurrency"`
		Connections int    `json:"connections"`
		Cases       []struct {
			Input any `json:"input"`
		} `json:"cases"`
	}
	if err := json.Unmarshal(b, &task); err != nil {
		panic(err)
	}
	inputs := make([]any, len(task.Cases))
	for i, c := range task.Cases {
		inputs[i] = c.Input
	}
	connect(task.Host, task.Port, task.Concurrency)
	// One exchange per fixture, in order; the supervisor compares what came
	// back with the task's expected results and with what the peer recorded.
	outputs := make([]any, len(inputs))
	for i, input := range inputs {
		outputs[i] = operation(input)
	}
	send("verification", map[string]any{"outputs": outputs})
	if !scanner.Scan() || scanner.Text() != "verified" {
		os.Exit(1)
	}
	send("ready", map[string]any{"memory": memory()})
	lanes := task.Concurrency
	for scanner.Scan() {
		line := scanner.Text()
		if line == "exit" {
			break
		}
		if line == "settle" {
			send("settled", map[string]any{"memory": memory()})
			continue
		}
		var command struct {
			Count int `json:"count"`
		}
		if err := json.Unmarshal([]byte(line), &command); err != nil {
			panic(err)
		}
		if command.Count < 1 {
			panic("positive count required")
		}
		sums := make([]uint32, lanes)
		var wait sync.WaitGroup
		before, start := cpu(), time.Now()
		for w := 0; w < lanes; w++ {
			wait.Add(1)
			go func(w int) {
				defer wait.Done()
				var checksum uint32
				for k := w; k < command.Count; k += lanes {
					checksum += consume(operation(inputs[k%len(inputs)]))
				}
				sums[w] = checksum
			}(w)
		}
		wait.Wait()
		elapsed := float64(time.Since(start).Nanoseconds()) / 1e6
		used := cpu() - before
		var checksum uint32
		for _, sum := range sums {
			checksum += sum
		}
		send("round", map[string]any{"requests": command.Count, "checksum": checksum, "wallMs": elapsed, "cpuMs": used})
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}
}
