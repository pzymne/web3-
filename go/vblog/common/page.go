package common

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func NewPageRequest() *PageRequest {
	return &PageRequest{
		PageSize:   10,
		PageNumber: 1,
	}
}

func NewPageRequestFromGinCtx(c *gin.Context) *PageRequest {
	p := NewPageRequest()
	pnStr := c.Query("page_number")
	psStr := c.Query("page_size")

	if pnStr != "" {
		pn, _ := strconv.ParseInt(pnStr, 10, 64)
		if pn != 0 {
			p.PageNumber = int(pn)
		}
	}

	if psStr != "" {
		ps, _ := strconv.ParseInt(psStr, 10, 64)
		if ps != 0 {
			p.PageSize = int(ps)
		}
	}

	return p
}

type PageRequest struct {
	// 分页的大小
	PageSize int `json:"page_size"`
	// 当前页码
	PageNumber int `json:"page_number"`
}

// 1 0
// 2 skip(1 * page_size)
// 3. skip(2 * page_size)
func (req *PageRequest) Offset() int {
	return (req.PageNumber - 1) * req.PageSize
}
