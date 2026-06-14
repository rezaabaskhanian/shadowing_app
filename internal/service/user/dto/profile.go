package dto

type ProfileRequest struct {
	UserID string `json:"user_id"` // UserID now is string
}

type ProfileResponse struct {
	UserInfo UserInfo `json:"user"`
}
