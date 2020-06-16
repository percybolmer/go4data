// Package savable is a generic interface used to enable Saving/Loading data
// this package will contain different structs that implements the savable interface that allows users to store data how they want
// So one example is YAML -- will save data to yaml file,
package savable

import (
	"errors"
)

// Savable is a interface that is applied to structs with Save/Load mechanism
type Savable interface{
	Save(path string, data interface{}) error
	Load(path string, obj interface{}) error
}

var (
	// ErrUnknownLocation is thrown whenever a Save function does not know where to save data
	ErrUnknownLocation = errors.New("the location where to store data is unknown")
)




