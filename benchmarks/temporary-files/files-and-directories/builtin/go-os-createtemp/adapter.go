package main

import "os"

var payload = func() []byte {
	b := make([]byte, 1024)
	for i := range b {
		b[i] = byte(i*7 + 3)
	}
	return b
}()

func operation(value any) any {
	in := value.(map[string]any)
	root := in["root"].(string)
	nFiles, nDirs := int(in["files"].(float64)), int(in["dirs"].(float64))
	filePattern := in["filePrefix"].(string) + "*" + in["fileSuffix"].(string)
	dirPattern := in["dirPrefix"].(string) + "*"
	names := make([]string, 0, nFiles+nDirs)
	for i := 0; i < nFiles; i++ {
		f, err := os.CreateTemp(root, filePattern)
		if err != nil {
			panic(err)
		}
		if _, err := f.Write(payload); err != nil {
			panic(err)
		}
		if err := f.Close(); err != nil {
			panic(err)
		}
		names = append(names, f.Name())
	}
	for i := 0; i < nDirs; i++ {
		d, err := os.MkdirTemp(root, dirPattern)
		if err != nil {
			panic(err)
		}
		names = append(names, d)
	}
	for _, name := range names {
		if err := os.Remove(name); err != nil {
			panic(err)
		}
	}
	return names
}
