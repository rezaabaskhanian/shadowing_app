package dto

type ResetPasswordRequest struct {
	Phone           string `json:"phone"`
	OtpToken        string `json:"otp_token"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
}

type RessetPasswordResponse struct {
	UserInfo UserInfo `json:"user"`
	Tokens   Tokens   `json:"tokens"`
}
