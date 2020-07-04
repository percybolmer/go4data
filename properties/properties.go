package properties

import (
	"errors"
	"fmt"
	"sync"
)

var (
	//ErrRequiredPropertiesNotFulfilled is when trying to start a processor but it needs additonal properties
	ErrRequiredPropertiesNotFulfilled = errors.New("the processor needs additional properties to work, see the processors documentation")
	//ErrWrongPropertyType is cast when the Property is of another type
	ErrWrongPropertyType = errors.New("the property is not of this data type")
	//ErrNoSuchProperty is when trying to assign value to Property that does not exist
	ErrNoSuchProperty = errors.New("the property ur trying to set the value for does not exist")
)

// PropertyContainer is an interface that can enable Configuration reading for processors
type PropertyContainer interface {
	GetProperty(name string) *Property
	GetProperties() []*Property
	SetProperty(name string, value interface{}) error
	AddProperty(name, description string, requierd bool)
	RemoveProperty(name string)
	ValidateProperties() (bool, []string)
}

// NewPropertyMap is used to initialize a new PropertyMap to avoid Nil Pointers
func NewPropertyMap() *PropertyMap {
	return &PropertyMap{
		Properties: make([]*Property, 0, 0),
	}
}

// PropertyMap is a struct that can be inherited as a pointer by Processors so they dont have to care about Property handeling at all.
// THe propertyMap fulfills the PropertyContainer interface
type PropertyMap struct {
	// Properties contains the currently set properties
	Properties []*Property `json:"properties" yaml:",inline"`
	sync.Mutex `json:"-" yaml:"-"`
}

// GetProperties is used to return all the currently configured Properties
func (pm *PropertyMap) GetProperties() []*Property {
	return pm.Properties
}

// GetProperty is used to extract an property from the PropertyMap
func (pm *PropertyMap) GetProperty(name string) *Property {
	for _, prop := range pm.Properties {
		if prop.Name == name {
			return prop
		}
	}
	return nil
}

// ValidateProperties will make sure that all properties are actually there that is required
func (pm *PropertyMap) ValidateProperties() (bool, []string) {
	missing := make([]string, 0)
	for _, prop := range pm.Properties {
		if !prop.IsValid() {
			missing = append(missing, prop.Name)
		}
	}

	if len(missing) != 0 {
		return false, missing
	}
	return true, nil
}

// AddProperty is used to add an Property to the PropertyContainer
func (pm *PropertyMap) AddProperty(name, description string, requierd bool) {
	pm.Lock()
	pm.Properties = append(pm.Properties, &Property{
		Name:        name,
		Description: description,
		Required:    requierd,
	})
	pm.Unlock()
}

// SetProperty will extract properties from the map, it will also create the map if its nil to avoid any nil pointers
func (pm *PropertyMap) SetProperty(name string, value interface{}) error {
	prop := pm.GetProperty(name)
	if prop == nil {
		return ErrNoSuchProperty
	}
	pm.Lock()
	defer pm.Unlock()
	prop.Value = value
	return nil
}

// RemoveProperty will remove any added properties
func (pm *PropertyMap) RemoveProperty(name string) {
	for i, prop := range pm.Properties {
		if prop.Name == name {
			pm.Lock()
			pm.Properties = append(pm.Properties[:i], pm.Properties[i+1:]...)
			pm.Unlock()
			return
		}
	}
}

// Property is a value holder used by Processors to handle Configs
type Property struct {
	Name        string      `json:"name" yaml:"name"`
	Value       interface{} `json:"value" yaml:"value"`
	Description string      `json:"description" yaml:"description"`
	Required    bool        `json:"required" yaml:"required"`
}

// IsValid is used to control if Required is true, then Value cannot be nil, if it is it will return False
func (p *Property) IsValid() bool {
	if p.Required && p.Value == nil {
		return false
	}
	return true
}

// String Will return the Value as string
func (p *Property) String() string {
	return fmt.Sprintf("%v", p.Value)
}

// Int will reutnr the value as int
func (p *Property) Int() (int, error) {
	var value int
	var ok bool
	if value, ok = p.Value.(int); !ok {
		return -1, ErrWrongPropertyType
	}
	return value, nil

}

// Bool is used to return the value as a boolean
func (p *Property) Bool() (bool, error) {
	var value bool
	var ok bool
	if value, ok = p.Value.(bool); !ok {
		return false, ErrWrongPropertyType
	}
	return value, nil
}

// StringSplice is used to get the value as a stringslice
func (p *Property) StringSplice() ([]string, error) {
	var value []string
	var ok bool
	if value, ok = p.Value.([]string); !ok {
		return nil, ErrWrongPropertyType
	}
	return value, nil

}

// StringMap is used to return the value as a map[string]string
func (p *Property) StringMap() (map[string]string, error) {
	var value map[string]string
	var ok bool
	if value, ok = p.Value.(map[string]string); !ok {
		return nil, ErrWrongPropertyType
	}
	return value, nil
}
