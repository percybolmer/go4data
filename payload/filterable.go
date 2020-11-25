package payload

import (
	"bufio"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"
)

var (
	//ErrFilterOrDirectory is thrown when neither filter or Directory to load is set
	ErrFilterOrDirectory error = errors.New("Either filter or filterDirectory property needs to be set, or both, but atleast one of them")
	//ErrEmptyFilterDirectory is when a empty filter directory is set
	ErrEmptyFilterDirectory error = errors.New("The filterdirectory value is empty ")
	//ErrBadFilterFormat is when a filter is being parsed but is not correct
	ErrBadFilterFormat error = errors.New("the filter seems to be poorly formatted, the format is key:regexp")
)

// Filterable is a interface that is used to apply Filters to payloads
type Filterable interface {
	ApplyFilter(f *Filter) bool
}

// Filter is a struct used to check if some data is part of this filter
// Will use Regexp as a placeholder for the filter value, but regexp can hold regular strings aswell so it works both ways
type Filter struct {
	// Regexp is the regexp to apply
	Regexp *regexp.Regexp
	// Key is the field to apply the Regexp to, like in csv it resembels the header field value.
	Key string
	// Groupname is a reference to the group that the filter belongs too
	GroupName string
}

// LoadFilterDirectory is used to load the filter direcotry into the handler
func LoadFilterDirectory(path string) (map[string][]*Filter, error) {
	if path == "" {
		return nil, ErrEmptyFilterDirectory
	}

	files, err := ioutil.ReadDir(path)
	if err != nil {
		return nil, err
	}
	var dirPath string
	if !strings.HasSuffix(path, "/") {
		dirPath += path + "/"
	} else {
		dirPath = path
	}
	filterGroups := make(map[string][]*Filter, 0)
	for _, f := range files {
		// Should I traverse Directories.. For now, no
		if f.IsDir() == false {
			// Only filter files
			if strings.HasSuffix(f.Name(), ".filter") {
				splits := strings.Split(f.Name(), ".filter")
				groupName := splits[0]
				file, err := os.Open(dirPath + f.Name())
				if err != nil {
					return nil, err
				}
				defer file.Close()

				scanner := bufio.NewScanner(file)
				for scanner.Scan() {
					line := scanner.Text()
					newfilt, err := ParseFilterLine(line)
					if err != nil {
						return nil, err
					}
					newfilt.GroupName = groupName
					filterGroups[groupName] = append(filterGroups[groupName], newfilt)
				}

			}
		}
	}
	return filterGroups, nil
}

// ParseFilterLine is used to parse out a filter line
func ParseFilterLine(line string) (*Filter, error) {
	splits := strings.SplitN(line, ":", 2)
	if len(splits) != 2 {
		// This can only trigger when there is less than one : in the line,
		return nil, fmt.Errorf("%v: %w", line, ErrBadFilterFormat)
	}
	reg, err := regexp.Compile(splits[1])
	if err != nil {
		return nil, fmt.Errorf("%v: %w", line, err)
	}
	return &Filter{
		Key:    splits[0],
		Regexp: reg,
	}, nil
}
