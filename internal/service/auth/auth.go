package authservice

import (
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	domain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/richerror"
)

type Config struct {
	SignKey               string        `koanf:"sign_key"`
	AccessExpirationTime  time.Duration `koanf:"access_expiration_time"`
	RefreshExpirationTime time.Duration `koanf:"refresh_expiratoonTime"`

	AccessSubject  string `koanf:"access_subject"`
	RefreshSubject string `koanf:"refresh_subject"`
}

type Service struct {
	config Config
}

func New(cfg Config) Service {
	return Service{config: cfg}
}

// CreateAccessToken now accepts UserID as string
func (s Service) CreateAccessToken(user domain.User) (string, error) {
	return s.createToken(string(user.ID), user.Role, s.config.AccessSubject, s.config.AccessExpirationTime)
}

func (s Service) CreateRefreshToken(user domain.User) (string, error) {
	return s.createToken(string(user.ID), user.Role, s.config.RefreshSubject, s.config.RefreshExpirationTime)
}

// ParseAccessToken یک access token را اعتبارسنجی می‌کند و مطمئن می‌شود که
// واقعاً access token است، نه refresh token.
//
// این بررسی لازم است چون هر دو توکن با یک کلید امضا می‌شوند و فقط subject
// از هم جدایشان می‌کند. بدون آن، refresh tokenِ هفت‌روزه — که اپ روی دستگاه
// ذخیره‌اش می‌کند — به‌عنوان توکن دسترسی برای همه‌ی روت‌های محافظت‌شده کار
// می‌کرد و عمر مؤثر دسترسی از ۲۴ ساعت به ۷ روز می‌رفت.
func (s Service) ParseAccessToken(tokenStr string) (*Claims, error) {
	return s.parseWithSubject(tokenStr, s.config.AccessSubject, "این توکن، توکن دسترسی نیست")
}

// ParseRefreshToken یک refresh token را اعتبارسنجی می‌کند (و مطمئن می‌شود
// access token به‌جایش فرستاده نشده).
func (s Service) ParseRefreshToken(tokenStr string) (*Claims, error) {
	return s.parseWithSubject(tokenStr, s.config.RefreshSubject, "این توکن، توکن تمدید نیست")
}

func (s Service) parseWithSubject(tokenStr, wantSubject, mismatchMsg string) (*Claims, error) {
	const op = "authservice.parseWithSubject"

	claims, err := s.ParseToken("Bearer " + tokenStr)
	if err != nil {
		return nil, err
	}
	if claims.Subject != wantSubject {
		return nil, richerror.New(op).WithMessage(mismatchMsg).WithKind(richerror.KindInvalid)
	}
	return claims, nil
}

func (s Service) ParseToken(authHeader string) (*Claims, error) {
	const op = "authservice.parseToken"

	parts := strings.Split(authHeader, " ")

	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, richerror.New(op)
	}

	tokenStr := parts[1]

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.SignKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, richerror.New(op).WithMessage("invalid token claims")

}

func (s Service) createToken(userID string, role, subject string, expireDuration time.Duration) (string, error) {
	const op = "auhtservice.createtoken"
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: subject,
			//TODO: set the expire time
			//TODO: see https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireDuration)),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := accessToken.SignedString([]byte(s.config.SignKey))

	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("dont create token")
	}

	return tokenString, nil

}
