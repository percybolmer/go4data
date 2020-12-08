package userservice

import (
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/context"
)

// Server is a database connection that holds user information
// It also fullfills the UserServer interfaces
type Server struct {
	Db  *sqlx.DB
	Cfg *Config
	// create is used to create new users
	create *sqlx.Stmt
}

var (
	// ErrUserAlreadyExists is when trying to create a user that is already existing in the db
	ErrUserAlreadyExists = errors.New("the username or email your trying to use is already registerd")
)

// NewServer is used to create a new server object
// NewServer will take care of prepareing statements to the database
func NewServer(db *sqlx.DB, cfg *Config) *Server {
	server := &Server{
		Db:  db,
		Cfg: cfg,
	}

	return server
}

// PrepareStatements is used to prepare statements that will be used later
func (s *Server) PrepareStatements() error {
	createStmt, err := s.Db.Preparex("INSERT INTO users (email,name,password) VALUES($1,$2,$3)")
	if err != nil {
		return err
	}
	s.create = createStmt

	return nil
}

var (
	// ErrNoSuchUser is thrown when there is no Rows found in DB
	ErrNoSuchUser = errors.New("no such user was found")
)

// GetUser is used to return a user from the Database.
//
func (s *Server) GetUser(ctx context.Context, req *UserRequest) (*UserResponse, error) {
	user := &UserResponse{}
	err := s.Db.Get(user, "SELECT id,name,password,email FROM users WHERE id=$1", req.Id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoSuchUser
		}
		return nil, err
	}
	return user, nil
}

// Login user will check if the supplied username and password is correct
// if correct it will Assign a new JWT token in the metadata
func (s *Server) Login(context.Context, *BaseRequest) (*UserResponse, error) {
	return &UserResponse{
		Email: "test",
		Name:  "testersson",
	}, nil
}

// CreateUser will verify that the user account is unique, then it will add it to the database
// a new JWT token will be assigned into the metadata, and the user logged in onto the created account
func (s *Server) CreateUser(ctx context.Context, req *BaseRequest) (*UserResponse, error) {
	// First we need to see if there already is a user with this email or Name
	user := &UserResponse{}
	err := s.Db.Get(user, "SELECT id,name,email FROM users WHERE name=$1 OR email=$2", req.Name, req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Lets create our user since there is no matching user
			// Also lets first Bcrypt the users Password
			pass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				return nil, err
			}
			_, err = s.create.Exec(req.Email, req.Name, pass)
			if err != nil {
				return nil, err
			}
			return &UserResponse{
				Email: req.Email,
				Name:  req.Name,
			}, nil

		}
		return nil, err
	}
	return nil, ErrUserAlreadyExists
}

func (s *Server) DeleteUser(context.Context, *UserRequest) (*UserResponse, error) {
	return &UserResponse{
		Email: "test",
		Name:  "testersson",
	}, nil
}
