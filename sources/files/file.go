package filesource

import (
	"errors"
	"io/ioutil"
	"os"

	"github.com/percybolmer/workflow/properties"
)

var (
	//ErrInvalidPath is thrown when the path for a file is not correct
	ErrInvalidPath error = errors.New("The path provided is not a proper path to a file or directory")
	//ErrBadWriteData is thrown when the size written to file is not the same as the payload
	ErrBadWriteData error = errors.New("The size written to file does not match the payload")
)

// FileSource is used to handle sources that are File based
type FileSource struct {
	*properties.PropertyMap
}

// NewFileSource is used to saftely create new Filesource
// RemoveFile is if you want the FileSource to remove files that has been read
// Append is if u want to Overwrite existing files or just append the data to them
func NewFileSource(removeFile, append bool) FileSource {
	fs := FileSource{
		PropertyMap: properties.NewPropertyMap(),
	}

	fs.SetProperty("removefile", removeFile, true)
	fs.SetProperty("append", append, true)

	return fs
}

// WriteFile is used to write payloads to files
// If the file exists it will use  the
// append setting to check wether to overwrite or append to file
func (fs FileSource) WriteFile(path string, payload []byte) error {
	if ok, _ := fs.ValidateProperties(); !ok {
		return properties.ErrRequiredPropertiesNotFulfilled
	}
	append, err := fs.GetProperty("append").Bool()
	// This Error check is uncessesary?? Just a safe guard if somebody creates the fileSource without the NewFileSource function and uses SetProperty to weirrd stuff
	if err != nil {
		return err
	}
	if append {
		f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		defer f.Close()
		n, err := f.Write(payload)
		if err != nil {
			return err
		}
		if n != len(payload) {
			return ErrBadWriteData
		}
		return nil
	}
	return ioutil.WriteFile(path, payload, 0644)

}

// Read is used to read a file and return the Byte array of the value
func (fs FileSource) Read(path string) ([]byte, error) {
	if ok, _ := fs.ValidateProperties(); !ok {
		return nil, properties.ErrRequiredPropertiesNotFulfilled
	}
	remove, err := fs.GetProperty("removefile").Bool()
	if err != nil {
		return nil, err
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if remove {
			os.Remove(path)
		}
	}()
	return ioutil.ReadAll(file)
}
