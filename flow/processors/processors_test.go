package processors_test

import (
	"errors"
	"testing"

	"github.com/percybolmer/workflow/flow/processors"
)

func TestRegisterProcessor(t *testing.T) {
	err := processors.RegisterProcessor("doesNotExist", nil)
	if err != nil {
		t.Fatal("SHould return nil when adding nonexisting processor: ", err)
	}
	err = processors.RegisterProcessor("stdout", nil)
	if !errors.Is(err, processors.ErrProcessorAlreadyExists) {
		t.Fatal("Found the wrong error ")
	}
}
