package dto

type GetUserRequest struct {
	ID string `json:"id"`
}

type GetUserResponse struct {
	UserInfo UserInfo `json:"user"`
}
