package savable

import (
	"gopkg.in/yaml.v3"
	"io/ioutil"
)

type YAML struct {}

func (y *YAML) Save(path string, data interface{}) error {
	output, err := yaml.Marshal(data)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(path, output, 0644)
}

func (y *YAML) Load(path string, obj interface{}) error {
	if path == "" {
		return ErrUnknownLocation
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	err = yaml.Unmarshal(data, obj)
	if err != nil {
		return err
	}
	return nil
}
