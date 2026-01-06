package ioc

// 实现了如下方法就是一个Ioc Container
type Container interface {
	Registry(name string, obj Object)
	Get(name string) any
	Init() error
}

type Object interface {
	Init() error
}
