package userservice

var schema = `
CREATE TABLE IF NOT EXISTS users (
	id SERIAL,
	name varchar(45) NOT NULL,
	password varchar(450) NOT NULL,
	email varchar(100) NOT NULL,
	createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	token varchar(255) NOT NULL DEFAULT '',
	PRIMARY KEY (name)
)
`
