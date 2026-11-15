package instagrampost

type Service struct{}

func New() Service {
	return Service{}
}

func (s Service) GetTodayPost(dayOffset int) InstagramLesson {
	return GetLessonByDay(dayOffset)
}

func (s Service) ListLessons() []InstagramLesson {
	return GetAllLessons()
}

func (s Service) BuildCustomPost(l InstagramLesson) InstagramLesson {
	if l.Caption == "" {
		l.Caption = BuildInstagramCaption(l)
	}
	if l.Hashtags == "" {
		l.Hashtags = DefaultHashtags
	}
	return l
}
