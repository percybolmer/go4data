package savable

import (
	"encoding/json"
	"io/ioutil"
)

type JSON struct {
	path string
}

func (j *JSON) Save(path string, data interface{}) error {

	output, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(j.path, output, 0644)
}

func (j *JSON) Load(path string, obj interface{}) error {
	return nil
}
