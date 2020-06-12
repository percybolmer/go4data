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
)

// PropertyContainer is an interface that can enable Configuration reading for processors
type PropertyContainer interface {
	GetProperty(name string) *Property
	SetProperty(name string, value interface{})
	RemoveProperty(name string)
	ValidateProperties() (bool, []string)
}

// NewPropertyMap is used to initialize a new PropertyMap to avoid Nil Pointers
func NewPropertyMap() *PropertyMap {
	return &PropertyMap{
		Properties:   make(map[string]*Property),
		Requirements: make([]string, 0),
	}
}

// PropertyMap is a struct that can be inherited as a pointer by Processors so they dont have to care about Property handeling at all.
// THe propertyMap fulfills the PropertyContainer interface
type PropertyMap struct {
	Properties   map[string]*Property `json:"properties"`
	Requirements []string             `json:"requirements"`
	sync.Mutex
}

// ValidateProperties will make sure that all properties are actually there that is required
func (pm *PropertyMap) ValidateProperties() (bool, []string) {
	missing := make([]string, 0)
	for _, req := range pm.Requirements {
		prop := pm.Properties[req]

		if prop == nil {
			missing = append(missing, req)
		}
	}

	if len(missing) != 0 {
		return false, missing
	}
	return true, nil
}
// AddRequirement will add a property that will HAVE to exist for ValidateProperties to return true
// This can be used to force users to have a certain config etc
func (pm *PropertyMap) AddRequirement(names ...string) {
	pm.Lock()
	defer pm.Unlock()
	if pm.Requirements == nil {
		pm.Requirements = make([]string,0)
	}

	for _, name := range names {
		pm.Requirements = append(pm.Requirements, name)
	}

}
// GetProperty is used to extract an property from the PropertyMap
func (pm *PropertyMap) GetProperty(name string) *Property {
	return pm.Properties[name]
}

// SetProperty will extract properties from the map, it will also create the map if its nil to avoid any nil opinters
func (pm *PropertyMap) SetProperty(name string, value interface{}) {
	pm.Lock()
	defer pm.Unlock()
	if pm.Properties == nil {
		pm.Properties = make(map[string]*Property)
	}
	pm.Properties[name] = &Property{
		Name:  name,
		Value: value,
	}
}

// RemoveProperty will remove any added properties
func (pm *PropertyMap) RemoveProperty(name string) {
	delete(pm.Properties, name)
}

// Property is a value holdler used by Processors to handle Configs
type Property struct {
	Name  string      `json:"name"`
	Value interface{} `json:"value"`
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
