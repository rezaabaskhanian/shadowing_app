package dto

type UserInfo struct {
	ID       string `json:"id"` // UserID as string
	Nickname string `json:"nickname"`

	Password string `json:"password_hash"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}
