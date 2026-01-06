<template>
    <div>
        <!-- 页头 -->
        <a-breadcrumb style="margin-bottom: 12px;">
            <a-breadcrumb-item>文章管理</a-breadcrumb-item>
            <a-breadcrumb-item>文章列表</a-breadcrumb-item>
        </a-breadcrumb>
        <!-- 数据创建和筛选 -->
        <div class="table-line">
            <div class="table-op">
                <!-- userRouter后直接访问rouer({}) -->
                <a-button type="primary" @click="$router.push({ name: 'BackendBlogEdit' })">
                    <template #icon>
                        <icon-plus />
                    </template>
                    创建文章
                </a-button>
            </div>
            <div class="table-filter">
                <a-input-search class="kw-search" @search="handleSearch" placeholder="请输入文章标题进行关键字搜索" search-button />
            </div>
        </div>
        <!-- 文章数据展示 -->
        <a-table :loading="listBlogLoadding" :data="data.item" :pagination="pagination" @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange">
            <template #columns>
                <a-table-column title="编号" data-index="id"></a-table-column>
                <a-table-column title="创建时间">
                    <template #cell="{ record }">
                        {{ dayjs.unix(record.created_at).format('YYYY-MM-DD HH:mm:ss') }}
                    </template>
                </a-table-column>
                <a-table-column title="更新时间">
                    <template #cell="{ record }">
                        {{ dayjs.unix(record.updated_at).format('YYYY-MM-DD HH:mm:ss') }}
                    </template>
                </a-table-column>
                <a-table-column title="作者" data-index="author"></a-table-column>
                <a-table-column title="标题" data-index="title"></a-table-column>
                <a-table-column title="状态" data-index="status">
                    <template #cell="{ record }">
                        {{ STATUS_MAP[record.status] }}
                    </template>
                </a-table-column>
                <a-table-column :width="300" align="center" title="操作">
                    <template #cell="{ record }">
                        <a-button type="text"
                            @click="$router.push({ name: 'BackendBlogEdit', query: { id: record.id } })">
                            编辑
                        </a-button>
                        <a-button type="text">
                            发布
                        </a-button>
                        <a-popconfirm :content="`是否确认要删除【${record.title}】这篇文章?`" type="warning"
                            :ok-loading="deleteLoadding" @ok="handleDelete(record)">
                            <a-button type="text" status="danger">
                                删除
                            </a-button>
                        </a-popconfirm>

                    </template>
                </a-table-column>
            </template>
        </a-table>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs'
import { LIST_BLOG, DELETE_BLOG } from '@/api/vblog'
import { Notification } from '@arco-design/web-vue';

const data = ref({ total: 0, item: [] })

// 通过API查询当前文章列表
const STATUS_MAP = {
    0: '草稿',
    1: '已发布'
}

// 分页
const pagination = reactive({
    total: data.value.total,
    showTotal: true,
    showJumper: true,
    showMore: true,
    showPageSize: true,
    current: 1,
    pageSize: 10,
})

// pageNumber有变化, 重新请求数据
const handlePageChange = (v) => {
    pagination.current = v
    ListBlog()
}

// PageSize发送变化, 重新请求数据
const handlePageSizeChange = (v) => {
    pagination.pageSize = v
    ListBlog()
}

// 搜索参数
const params = ref({
    keywords: '',
})


const handleSearch = (v) => {
    params.value.keywords = v
    ListBlog()
}

// 界面有关系
const listBlogLoadding = ref(false)
const ListBlog = async () => {
    try {
        listBlogLoadding.value = true
        data.value = await LIST_BLOG({
            keywords: params.value.keywords,
            page_size: pagination.pageSize,
            page_number: pagination.current
        })
        pagination.total = data.value.total
    } finally {
        listBlogLoadding.value = false
    }
}
// 声明时候加载数据喃？
onMounted(() => {
    // UI初始化好了挂在数据
    ListBlog()
})


// 删除
const deleteLoadding = ref(false)
const handleDelete = async (v) => {
    try {
        deleteLoadding.value = true
        await DELETE_BLOG(v.id)
        Notification.info(`文章【${v.title}】删除成功`)
        // 重新刷新页面
        ListBlog()
    } finally {
        deleteLoadding.value = false
    }
}

</script>

<style lang="css" scoped>
.table-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.kw-search {
    width: 400px;
}
</style>