package uservalueobject

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Password struct {
	hash string
}

func NewPassword(plain string) (Password, error) {

	if len(plain) < 6 {
		return Password{}, errors.New("password too short, min 6 chars")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {

		return Password{}, err
	}
	return Password{hash: string(hashedPassword)}, nil
}

func NewPasswordFromHash(hash string) *Password {
	return &Password{hash: hash}
}

func (p *Password) Verify(plain string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(p.hash), []byte(plain))
	return err == nil
}

func (p *Password) Hash() string {
	return p.hash
}
