package readers

import (
	"errors"
	"io/ioutil"
	"os"
)

const (
	// FileReaderType is a const representation of Payloads read through Files
	FileReaderType = "file"
)

var (
	//ErrInvalidPath is thrown when the path for a file is not correct
	ErrInvalidPath error = errors.New("The path provided is not a proper path to a file or directory")
	//ErrBadWriteData is thrown when the size written to file is not the same as the payload
	ErrBadWriteData error = errors.New("The size written to file does not match the payload")
)

//FileReader is used to read a file into payload
// TODO break out FileWriter struct into its own?
type FileReader struct {
	Path            string `json:"path"`
	RemoveAfterRead bool   `json:"removefiles"`
	AppendTo        bool   `json:"append"`
}

// WriteFile is used to write payloads to files
// If the file exists it will use  the
// append setting to check wether to overwrite or append to file
func (fr *FileReader) WriteFile(path string, payload []byte) error {
	if fr.AppendTo {
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
func (fr *FileReader) Read(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if fr.RemoveAfterRead {
			os.Remove(path)
		}
	}()
	return ioutil.ReadAll(file)
}
