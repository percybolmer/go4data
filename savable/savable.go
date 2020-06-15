// Package savable is a generic interface used to enable Saving/Loading data
// this package will contain different structs that implements the savable interface that allows users to store data how they want
// So one example is YAML -- will save data to yaml file,
package savable

import (
	"encoding/json"
	"errors"
	"gopkg.in/yaml.v3"
	"io/ioutil"
)

// Savable is a interface that is applied to structs with Save/Load mechanism
type Savable interface{
	Save(data interface{}) error
	Load(data []byte) error
}

var (
	// ErrUnknownLocation is thrown whenever a Save function does not know where to save data
	ErrUnknownLocation = errors.New("the location where to store data is unknown")
)

type YAML struct {
	path string
}

func (y *YAML) Save(data interface{}) error {
	if y.path == "" {
	return ErrUnknownLocation
	}

	output, err := yaml.Marshal(data)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(y.path, output, 0644)
}

func (y *YAML) Load(data []byte) error {
	return nil
}



type JSON struct {
	path string
}

func (j *JSON) Save(data interface{}) error {
	if j.path == "" {
		return ErrUnknownLocation
	}

	output, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(j.path, output, 0644)
}

func (j *JSON) Load(data []byte) error {
	return nil
}