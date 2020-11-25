package property

import (
	"errors"
	"fmt"
)

var (

	//ErrWrongPropertyType is cast when the Property is of another type
	ErrWrongPropertyType = errors.New("the property is not of this data type")
	//ErrNoSuchProperty is when trying to assign value to Property that does not exist
	ErrNoSuchProperty = errors.New("the property ur trying to set the value for does not exist")
)

// Property is a value holder used by Actions to handle Configs
type Property struct {
	Name        string      `json:"name" yaml:"name"`
	Value       interface{} `json:"value" yaml:"value"`
	Description string      `json:"description" yaml:"description"`
	Required    bool        `json:"required" yaml:"required"`
	Valid       bool        `json:"valid" yaml:"valid"`
}

// IsValid is used to control if Required is true, then Value cannot be nil, if it is it will return False
func (p *Property) IsValid() bool {
	if p.Required && p.Value == nil {
		p.Valid = false
		return false
	}
	p.Valid = true
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

// Int64 ressemblance of the property is returned
func (p *Property) Int64() (int64, error) {
	var value int
	var ok bool
	if value, ok = p.Value.(int); !ok {
		return -1, ErrWrongPropertyType
	}
	return int64(value), nil
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
	var value []interface{}

	var ok bool
	// THis is the same as with the MAP case, we cannot type assert into slice of strings.
	// GOland doest know that the content is strings and wont work.
	if value, ok = p.Value.([]interface{}); !ok {

		// Also try with regular slice instead of interface
		if valueSplice, ok2 := p.Value.([]string); ok2 {
			return valueSplice, nil
		}
		return nil, fmt.Errorf("%s: %w", p.Name, ErrWrongPropertyType)
	}
	valueStr := make([]string, len(value))
	for _, val := range value {
		valueStr = append(valueStr, val.(string))
	}
	return valueStr, nil

}

// StringMap is used to return the value as a map[string]string
func (p *Property) StringMap() (map[string]string, error) {
	// The reason for this is because golang cannot type asset to
	// a map string string, only map string interface
	// So we need to first type convert to map string interface and then convert each value
	var value map[string]interface{}
	valueStr := make(map[string]string, 0)
	var ok bool
	if value, ok = p.Value.(map[string]interface{}); !ok {

		// Also try mstrmap
		if valueStr, ok2 := p.Value.(map[string]string); ok2 {
			return valueStr, nil
		}
		return nil, fmt.Errorf("%s: %w", p.Name, ErrWrongPropertyType)
	}
	for key, val := range value {
		valueStr[key] = val.(string)
	}
	return valueStr, nil
}

// MapWithSlice will return a Map that holds a slice of strings
func (p *Property) MapWithSlice() (map[string][]string, error) {
	var value map[string][]string

	value, ok := p.Value.(map[string][]string)
	if !ok {
		return nil, ErrWrongPropertyType
	}

	return value, nil
}
