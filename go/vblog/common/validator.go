package common

import (
	// zhongwen "github.com/go-playground/locales/zh"
	// ut "github.com/go-playground/universal-translator"
	// zh_trans "github.com/go-playground/validator/v10/translations/zh"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// func init() {
// 	zh := zhongwen.New()
// 	uni := ut.New(zh, zh)
// 	tr, ok := uni.GetTranslator("zh")
// 	if !ok {
// 		return
// 	}

// 	validate := validator.New()

// 	err := zh_trans.RegisterDefaultTranslations(validate, tr)
// 	if err != nil {
// 		panic(err)
// 	}
// }

func Validate(v any) error {
	return validate.Struct(v)
}
