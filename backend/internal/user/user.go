package user

type User struct {
	ID        int64    `json:"id"`
	Login     string   `json:"name"`
	Email     string   `json:"email"`
	AvatarUrl string   `json:"avatar_url"`
	OrgLogins []string `json:"login"`
}

func (u *User) IsInOrg(orgs []string) bool {
	for _, userOrg := range u.OrgLogins {
		for _, allowed := range orgs {
			if userOrg == allowed {
				return true
			}
		}
	}
	return false
}
