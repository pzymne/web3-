package impl

import (
	"context"

	"dario.cat/mergo"
	"gitlab.com/go-course-project/go15/vblog/apps/blog"
	"gitlab.com/go-course-project/go15/vblog/common"
	"gitlab.com/go-course-project/go15/vblog/exception"
)

// 文章创建
func (i *BlogServiceImpl) CreateBlog(
	ctx context.Context,
	in *blog.CreateBlogRequest,
) (
	*blog.Blog, error) {
	// 1. 验证请求参数
	if err := in.Validate(); err != nil {
		return nil, exception.ErrValidateFailed(err.Error())
	}

	// 2. 构造实例对象
	ins := blog.NewBlog()
	ins.CreateBlogRequest = in
	// 3. 入库返回
	// INSERT INTO `blogs` (`created_at`,`updated_at`,`title`,`author`,`content`,`summary`,`create_by`,`tags`,`published_at`,`status`) VALUES (1717832260,1717832260,'Go全站开发','will','Md内容填充','文章概要信息','','{}',0,0)
	err := i.db.WithContext(ctx).Create(ins).Error
	if err != nil {
		return nil, err
	}
	return ins, nil
}

// 文章列表查询
func (i *BlogServiceImpl) QueryBlog(
	ctx context.Context,
	in *blog.QueryBlogRequest,
) (
	*blog.BlogSet, error) {
	set := blog.NewBlogSet()

	// 1. 因为有默认值, 不需要用户传参数

	// 2. 直接查数据库, 构造查询条件
	query := i.db.WithContext(ctx).Table("blogs")
	if in.KeyWords != "" {
		query = query.Where("title LIKE ?", "%"+in.KeyWords+"%")
	}
	if in.Status != nil {
		query = query.Where("status = ?", *in.Status)
	}

	// Count, 总数统计
	err := query.Count(&set.Total).Error
	if err != nil {
		return nil, err
	}

	// 查询
	err = query.
		Order("created_at DESC").
		Limit(in.PageSize).
		Offset(in.Offset()).
		Find(&set.Items).
		Error
	if err != nil {
		return nil, err
	}

	return set, nil
}

// 文章详情
func (i *BlogServiceImpl) DescribeBlog(
	ctx context.Context,
	in *blog.DescribeBlogRequest,
) (
	*blog.Blog, error) {
	ins := blog.NewBlog()
	err := i.db.WithContext(ctx).Where("id = ?", in.BlogId).First(ins).Error
	if err != nil {
		return nil, err
	}
	return ins, nil
}

// 文章更新, 比较大
func (i *BlogServiceImpl) UpdateBlog(
	ctx context.Context,
	in *blog.UpdateBlogRequest) (
	*blog.Blog, error) {
	// 1. 先把有更新的对象查询处理
	ins, err := i.DescribeBlog(ctx, blog.NewDescribeBlogRequest(in.BlogId))
	if err != nil {
		return nil, err
	}

	switch in.UpdateMode {
	case common.UPDATE_MODE_PUT:
		// 全量更新, 你传什么就保存什么, "" --> ""
		ins.CreateBlogRequest = in.CreateBlogRequest
	case common.UPDATE_MODE_PATCH:
		// 增量更新, 只更新有变化的字段
		if in.Author != "" {
			ins.Author = in.Author
		}
		if in.Content != "" {
			ins.Content = in.Content
		}
		// ... 有没有办法  {} <--- patch {}
		// https://github.com/darccio/mergo
		// src(patch) ---> dst
		// patch request (src) ---> ins CreateBlogRequest (dst)
		err := mergo.MergeWithOverwrite(ins.CreateBlogRequest, in.CreateBlogRequest)
		if err != nil {
			return nil, err
		}
	}

	// 更新字段校验
	if err := ins.CreateBlogRequest.Validate(); err != nil {
		return nil, exception.ErrValidateFailed(err.Error())
	}

	// 执行更新
	// update 增量更新
	err = i.db.WithContext(ctx).Table("blogs").Save(ins).Error
	if err != nil {
		return nil, err
	}
	return ins, nil
}

// 文章发布
func (i *BlogServiceImpl) UpdateBlogStatus(
	ctx context.Context,
	in *blog.UpdateBlogStatusRequest) (
	*blog.Blog, error) {
	// 1. 先把有更新的对象查询处理
	ins, err := i.DescribeBlog(ctx, blog.NewDescribeBlogRequest(in.BlogId))
	if err != nil {
		return nil, err
	}

	// 更新指定字段
	ins.ChangedBlogStatusRequest = in.ChangedBlogStatusRequest
	ins.SetStatus(*ins.Status)
	err = i.db.
		WithContext(ctx).
		Table("blogs").
		Where("id = ?", in.BlogId).
		Updates(ins.ChangedBlogStatusRequest).
		Error
	if err != nil {
		return nil, err
	}
	return ins, nil
}

// 文章删除
func (i *BlogServiceImpl) DeleteBlog(
	ctx context.Context,
	in *blog.DeleteBlogRequest,
) (*blog.Blog, error) {
	// 1. 先把有更新的对象查询处理
	ins, err := i.DescribeBlog(ctx, blog.NewDescribeBlogRequest(in.BlogId))
	if err != nil {
		return nil, err
	}

	err = i.db.
		WithContext(ctx).
		Table("blogs").
		Where("id = ?", in.BlogId).
		Delete(&blog.Blog{}).
		Error
	if err != nil {
		return nil, err
	}
	return ins, nil
}
