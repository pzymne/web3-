# 配置管理

## 定义一个配置对象

```go
func TestToYAML(t *testing.T) {
	t.Log(conf.Default().ToYAML())
}

func TestToLoadFromEnv(t *testing.T) {
	os.Setenv("DATASOURCE_USERNAME", "env test")
	err := conf.LoadConfigFromEnv()
	if err != nil {
		t.Fatal(err)
	}
	t.Log(conf.C().ToYAML())
}

func TestToLoadFromYAML(t *testing.T) {
	err := conf.LoadConfigFromYaml("./application.yml")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(conf.C().ToYAML())
}
```



## MySQL配置提供单例对象

```go
// dsn := "user:pass@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
func (m *mySQL) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		m.Username,
		m.Password,
		m.Host,
		m.Port,
		m.DB,
	)
}

func (m *mySQL) GetDB() *gorm.DB {
	m.lock.Lock()
	defer m.lock.Unlock()

	if m.db == nil {
		db, err := gorm.Open(mysql.Open(m.DSN()), &gorm.Config{})
		if err != nil {
			panic(err)
		}
		m.db = db

		// 补充Debug配置
		if m.Debug {
			m.db = db.Debug()
		}
	}

	return m.db
}
```