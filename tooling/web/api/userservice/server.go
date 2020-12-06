package userservice

import (
	"github.com/jmoiron/sqlx"
	"golang.org/x/net/context"
)

// Server is a database connection that holds user information
// It also fullfills the UserServer interfaces
type Server struct {
	Db *sqlx.DB
}

// GetUser is used to return a user from the Database.
//
func (s *Server) GetUser(ctx context.Context, req *UserRequest) (*UserResponse, error) {
	user := &UserResponse{}
	err := s.Db.Get(user, "SELECT id,name,password,email FROM users WHERE id=$1", req.Id)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *Server) Login(context.Context, *BaseRequest) (*UserResponse, error) {
	return &UserResponse{
		Email: "test",
		Name:  "testersson",
	}, nil
}

func (s *Server) CreateUser(context.Context, *BaseRequest) (*UserResponse, error) {
	return &UserResponse{
		Email: "test",
		Name:  "testersson",
	}, nil
}

func (s *Server) DeleteUser(context.Context, *UserRequest) (*UserResponse, error) {
	return &UserResponse{
		Email: "test",
		Name:  "testersson",
	}, nil
}
