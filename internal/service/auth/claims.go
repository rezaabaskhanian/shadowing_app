package authservice

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID string `json:"UserID"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}
