package ioc

import (
	"fmt"
)

// Map类型的IocContainer
type MapContainer struct {
	name   string
	storge map[string]Object
}

// 注册对象
func (c *MapContainer) Registry(name string, obj Object) {
	c.storge[name] = obj
}

// 获取对象
func (c *MapContainer) Get(name string) any {
	return c.storge[name]
}

// 调用所有被托管对象的Init方法, 对对象进行初始化
func (c *MapContainer) Init() error {
	for k, v := range c.storge {
		if err := v.Init(); err != nil {
			return fmt.Errorf("%s init error, %s", k, err)
		}
		fmt.Printf("[%s] %s init successs \n", c.name, k)
	}
	return nil
}
