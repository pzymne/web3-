package exception_test

import (
	"encoding/json"
	"testing"

	"gitlab.com/go-course-project/go15/vblog/exception"
)

func CheckIsError() error {
	return exception.NewApiException(50001, "用户名或者密码不正确")
}

func TestException(t *testing.T) {
	err := CheckIsError()
	// error打印的是ApiExcepiton对象吗？
	// 还是和标准的Error打印的内容一样？
	// 用户名或者密码不正确:
	// 打印的是ApiExcepiton , 由于这个对象实现Error方法, Error方法返回的结果
	t.Log(err)

	// 怎么获取ErrorCode, 断言这个接口的对象的具体类型
	if v, ok := err.(*exception.ApiException); ok {
		t.Log(v.Code)
		t.Log(v.String())
	}

	// 前端想要获取的是一个完整ApiExcepiton, 该怎么获取
	dj, _ := json.MarshalIndent(err, "", "  ")
	t.Log(string(dj))
}

// // If a string is acceptable according to the format, see if
// // the value satisfies one of the string-valued interfaces.
// // Println etc. set verb to %v, which is "stringable".
// switch verb {
// case 'v', 's', 'x', 'X', 'q':
// 	// Is it an error or Stringer?
// 	// The duplication in the bodies is necessary:
// 	// setting handled and deferring catchPanic
// 	// must happen before calling the method.
// 	switch v := p.arg.(type) {
// 	case error:
// 		handled = true
// 		defer p.catchPanic(p.arg, verb, "Error")
// 		p.fmtString(v.Error(), verb)
// 		return

// 	case Stringer:
// 		handled = true
// 		defer p.catchPanic(p.arg, verb, "String")
// 		p.fmtString(v.String(), verb)
// 		return
// 	}
// }
