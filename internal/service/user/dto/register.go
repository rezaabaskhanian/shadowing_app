package dto

type RegisterRequest struct {
	Nickname string `json:"nickname"`
	Password string `json:"password_hash"`

	Phone    string `json:"phone"`
	Role     string `json:"role"`
	OtpToken string `json:"otp_token"`
}

type RegisterResponse struct {
	UserInfo UserInfo `json:"user"`
	Tokens   Tokens   `json:"tokens"`
}
