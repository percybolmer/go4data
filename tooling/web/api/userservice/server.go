package userservice

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/context"
	grpc "google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	// this import is a database driver
	_ "github.com/lib/pq"
)

// Server is a database connection that holds user information
// It also fullfills the UserServer interfaces
type Server struct {
	Db   *sqlx.DB
	Cfg  *Config
	stmt statements
}

type statements struct {
	// create is used to create new users
	create *sqlx.Stmt
	// searchUser is used to search for existing users by email or name
	searchUser *sqlx.Stmt
	// updateUser will send a user information to Database to update it
	updateUser *sqlx.Stmt
	// deleteUser will remove a user from db
	deleteUser *sqlx.Stmt
	// getUser is used to extract userinfo by ID
	getUser *sqlx.Stmt
}

var (
	// ErrUserAlreadyExists is when trying to create a user that is already existing in the db
	ErrUserAlreadyExists = errors.New("the username or email your trying to use is already registerd")
	// ErrWrongPassword is when providing the wrong password
	ErrWrongPassword = errors.New("the provided password is incorrect")
	// ErrNoAuthorizationHeader in grpc call.
	ErrNoAuthorizationHeader = errors.New("there is no authorization header in your request, this route is protected, please login")
	// ErrBadAuthorizationHeader is when there is not enough arguments in header
	ErrBadAuthorizationHeader = errors.New("the authorization header is not proper length, should be 2 and contain ID then Token")
	// ErrBadAuthorizationToken is when a provided token is not valid
	ErrBadAuthorizationToken = errors.New("the provided token is not a valid one")
)

// NewServer is used to create a new server object
// NewServer will take care of prepareing statements to the database
func NewServer(db *sqlx.DB, cfg *Config) *Server {
	server := &Server{
		Db:  db,
		Cfg: cfg,
	}
	if cfg.DbDevelMode == "true" {

		db.MustExec(`DROP TABLE IF EXISTS users;`)
		// We need to init schema if not already done
		db.MustExec(schema)

	}
	return server
}

// PrepareStatements is used to prepare statements that will be used later
func (s *Server) PrepareStatements() error {
	createStmt, err := s.Db.Preparex("INSERT INTO users (email,name,password,token) VALUES($1,$2,$3,$4)")
	if err != nil {
		return err
	}
	searchUserStmt, err := s.Db.Preparex("SELECT id,name,email,password,token FROM users WHERE name=$1 OR email=$2")
	if err != nil {
		return err
	}
	updateUserStmt, err := s.Db.Preparex("UPDATE users SET name=$1, email=$2, password=$3, token=$4 WHERE id=$5")
	if err != nil {
		return err
	}
	deleteUserStmt, err := s.Db.Preparex("DELETE FROM users WHERE id=$1")
	if err != nil {
		return err
	}
	getUserStmt, err := s.Db.Preparex("SELECT id,name,email,token FROM users WHERE id=$1")
	if err != nil {
		return err
	}
	s.stmt = statements{
		getUser:    getUserStmt,
		create:     createStmt,
		searchUser: searchUserStmt,
		updateUser: updateUserStmt,
		deleteUser: deleteUserStmt,
	}

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
	err := s.stmt.getUser.Get(user, req.Id)
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
func (s *Server) Login(ctx context.Context, req *BaseRequest) (*UserResponse, error) {
	// First check if user exists
	user := &UserResponse{}
	err := s.stmt.searchUser.Get(user, req.Name, req.Email)
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNoSuchUser

	} else if err != nil {
		return nil, err
	}
	// Login and generate JWT
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, ErrWrongPassword
	}

	token, err := s.generateNewJWT(user.Name)
	if err != nil {
		return nil, err
	}
	user.Token = token
	// update the new token to DB
	err = s.execUpdateUser(user)
	if err != nil {
		return nil, err
	}
	// Clear Password
	user.Password = ""
	return user, err

}

// CreateUser will verify that the user account is unique, then it will add it to the database
// a new JWT token will be assigned into the metadata, and the user logged in onto the created account
func (s *Server) CreateUser(ctx context.Context, req *BaseRequest) (*UserResponse, error) {
	// First we need to see if there already is a user with this email or Name
	user := &UserResponse{}
	err := s.stmt.searchUser.Get(user, req.Name, req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Lets create our user since there is no matching user
			// Also lets first Bcrypt the users Password
			pass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				return nil, err
			}
			token, err := s.generateNewJWT(user.Name)
			if err != nil {
				return nil, err
			}
			_, err = s.stmt.create.Exec(req.Email, req.Name, pass, token)
			if err != nil {
				return nil, err
			}
			err = s.stmt.searchUser.Get(user, req.Name, req.Email)
			if err != nil {
				return nil, err
			}
			user.Password = ""
			return user, nil

		}
		return nil, err
	}
	return nil, ErrUserAlreadyExists
}

// DeleteUser is used to remove a user that has been created from database
// DeleteUser is a protected path by Middleware
func (s *Server) DeleteUser(ctx context.Context, req *UserRequest) (*AckResponse, error) {
	_, err := s.stmt.deleteUser.Exec(req.Id)
	if err != nil {
		return nil, err
	}
	return &AckResponse{Ok: true}, nil
}

// AuthMiddleware is a authentication middleware that can be used to protect routes
func (s *Server) AuthMiddleware(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	switch info.FullMethod {
	case "/users.User/DeleteUser", "/users.User/GetUser":
		err := s.verifyJWT(ctx)
		if err != nil {
			return nil, err
		}
		// Verify JWT
		return handler(ctx, req)
	default:
		return handler(ctx, req)
	}

}

// verifyJWT will extract a jwt token from grpc metadata call and verify it
func (s *Server) verifyJWT(ctx context.Context) error {
	// Extract user_id and JWT token from metadata
	meta, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return errors.New("failed to parse metadata from context, make sure yours grpc client is configured correctly")
	}

	authtoken, ok := meta["x-user-auth-token"]
	if !ok {
		return ErrNoAuthorizationHeader
	}
	authid, ok := meta["x-user-auth-id"]
	if !ok {
		return ErrNoAuthorizationHeader
	}
	id := authid[0]
	token := authtoken[0]
	// Get user based on ID and then Verify it
	claim := &jwt.StandardClaims{}

	tok, err := jwt.ParseWithClaims(token, claim, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.Cfg.JWTSecretKey), nil
	})
	if err != nil {
		return err
	}
	user := &UserResponse{}
	err = s.stmt.getUser.Get(user, id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows in result set") {
			return ErrBadAuthorizationToken
		}
		return err
	}
	if user.Token != tok.Raw {
		return ErrBadAuthorizationToken
	}
	return nil
}

// generateNewJWT will generate a new JWT token
func (s *Server) generateNewJWT(username string) (string, error) {

	claims := &jwt.StandardClaims{
		ExpiresAt: time.Now().Add(time.Minute * 100000).Unix(),
		Subject:   username,
	}
	token := jwt.NewWithClaims(jwt.GetSigningMethod("HS256"), claims)
	return token.SignedString([]byte(s.Cfg.JWTSecretKey))
}

// execUpdateUser will trigger an updateUser stmt assigned to server
// It will be used to make sure the user parameters are passed in to the proper  place of the statement
func (s *Server) execUpdateUser(user *UserResponse) error {
	_, err := s.stmt.updateUser.Exec(user.Name, user.Email, user.Password, user.Token, user.Id)
	if err != nil {
		return err
	}
	return nil
}
