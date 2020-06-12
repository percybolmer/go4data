// package relationships handles all relationship related stuff
// relationships are used by processors to communicate between them
package relationships

import (
	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/payload"
)

// Relationship is another word for an PayloadChannel, used to communicate events between Processors
type PayloadChannel chan payload.Payload

// FailurePipe is used to send Failures from Processors onto, how they are handled is up the Processor or Workflow, or the user can make their own
type FailurePipe chan failure.Failure
