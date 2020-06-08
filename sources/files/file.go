package files

import "errors"

var (
	//ErrInvalidPath is thrown when the path for a file is not correct
	ErrInvalidPath error = errors.New("The path provided is not a proper path to a file or directory")
	//ErrBadWriteData is thrown when the size written to file is not the same as the payload
	ErrBadWriteData error = errors.New("The size written to file does not match the payload")
)
