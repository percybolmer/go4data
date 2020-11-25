package property

import "sync"

// Configuration is used to store Cfg for Actions and metadata for Payloads
type Configuration struct {
	Properties []*Property `json:"properties" yaml:"properties"`
	sync.Mutex `json:"-" yaml:"-"`
}

// NewConfiguration will initialize a configuration properly to avoid nil pointers
func NewConfiguration() *Configuration {
	return &Configuration{
		Properties: make([]*Property, 0),
	}
}

// GetProperty is used to extract an property from the Configuration
func (a *Configuration) GetProperty(name string) *Property {
	for _, prop := range a.Properties {
		if prop.Name == name {
			return prop
		}
	}
	return nil
}

// ValidateProperties will make sure that all properties are actually there that is required
func (a *Configuration) ValidateProperties() (bool, []string) {
	missing := make([]string, 0)
	for _, prop := range a.Properties {
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
func (a *Configuration) AddProperty(name, description string, requierd bool) {
	a.Lock()
	a.Properties = append(a.Properties, &Property{
		Name:        name,
		Description: description,
		Required:    requierd,
		Value:       nil,
	})
	a.Unlock()
}

// SetProperty will extract properties from the map,
func (a *Configuration) SetProperty(name string, value interface{}) error {
	prop := a.GetProperty(name)
	if prop == nil {
		return ErrNoSuchProperty
	}
	a.Lock()
	defer a.Unlock()
	prop.Value = value
	return nil
}

// RemoveProperty will remove any added properties
func (a *Configuration) RemoveProperty(name string) {
	for i, prop := range a.Properties {
		if prop.Name == name {
			a.Lock()
			a.Properties = append(a.Properties[:i], a.Properties[i+1:]...)
			a.Unlock()
			return
		}
	}
}
