package uservalueobject

import (
	"errors"

	"github.com/google/uuid"
)

// type safety
type UserID string

func NewUserID() UserID {

	return UserID(uuid.NewString())
}

func ParseUserID(id string) (UserID, error) {
	if id == "" {
		return "", errors.New("user id cannot be empty")
	}

	_, err := uuid.Parse(id)
	if err != nil {
		return "", errors.New("invalid UUID format")
	}

	//type conversion
	//تبدیل به UserID
	return UserID(id), nil
}
