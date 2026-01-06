package main

import "gitlab.com/go-course-project/go15/vblog/cmd"

//.....

func main() {
	if err := cmd.Execute(); err != nil {
		panic(err)
	}
}
