package conf_test

import (
	"os"
	"testing"

	"github.com/go-playground/assert/v2"
	"gitlab.com/go-course-project/go15/vblog/conf"
)

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
	assert.Equal(t, conf.C().MySQL.Username, "env test")
}

func TestToLoadFromYAML(t *testing.T) {
	err := conf.LoadConfigFromYaml("./application.yml")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(conf.C().ToYAML())
}
