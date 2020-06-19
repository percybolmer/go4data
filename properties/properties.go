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
		Available: make([]*Property,0),
	}
}

// PropertyMap is a struct that can be inherited as a pointer by Processors so they dont have to care about Property handeling at all.
// THe propertyMap fulfills the PropertyContainer interface
type PropertyMap struct {
	// Properties contains the currently set properties
	Properties   map[string]*Property `yaml:",inline"`
	// Requirements contains the names of each property that is required
	Requirements []string             `json:"requirements" yaml:"requirements"`
	// Available is a slice of all properties that exists and is used to affect behaviour
	Available []*Property  `json:"available" yaml:"available"`
	sync.Mutex `json:"-" yaml:"-"`
}
// AddAvailableProperty is used to add an property to available slice
// This is purely used for documentation and showing users what properties is available
// Maybe this list can be used in the future to make sure ppl arnt adding strange properties?
func (pm *PropertyMap) AddAvailableProperty(name, description string) {
	for _, p := range pm.Available {
		if p.Name == name {
			return
		}
	}
	pm.Available = append(pm.Available, &Property{
		Name:        name,
		Value:       nil,
		Description: description,
	})

}
// GetAvailableProperties returns a list of all properties that is available
// they will have no value, if u want properties that has been added
func (pm *PropertyMap) GetAvailableProperties() []*Property{
	return pm.Available
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

// SetProperty will extract properties from the map, it will also create the map if its nil to avoid any nil pointers
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

// Property is a value holder used by Processors to handle Configs
type Property struct {
	Name  string      `json:"name" yaml:"name"`
	Value interface{} `json:"value" yaml:"value"`
	Description string  `json:"description" yaml:"description"`
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