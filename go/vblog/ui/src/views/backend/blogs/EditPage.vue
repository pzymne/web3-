<template>
    <div>
        <a-page-header :title="isEdit ? '编辑文章' : '创建文章'" @back="$router.go(-1)">
            <template #extra>
                <a-button :loading="createLoadding" type="outline" @click="handleSave">
                    <template #icon>
                        <icon-save />
                    </template>
                    保存
                </a-button>
            </template>
        </a-page-header>

        <!-- 提交form  -->
        <a-form ref="formRef" :model="form" layout="vertical">
            <a-form-item field="title" label="文章标题" :rules="{ required: true, message: '请输入文章标签' }">
                <a-input v-model="form.title" placeholder="请输入文章标签" />
            </a-form-item>
            <a-form-item field="summary" label="文章概要" :rules="{ required: true, message: '请输入文件简介' }">
                <a-input v-model="form.summary" placeholder="请输入文件简介" />
            </a-form-item>
            <a-form-item field="content" label="文章内容" :rules="{ required: true, message: '请输入文章内容' }">
                <!-- https://www.npmjs.com/package/md-editor-v3 -->
                <MdEditor v-model="form.content" class="md-editor"></MdEditor>
            </a-form-item>
        </a-form>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { CREATE_BLOG, GET_BLOG, UPDATE_BLOG } from '@/api/vblog';
import { Notification } from '@arco-design/web-vue';
import { useRouter } from 'vue-router';

const router = useRouter()

const isEdit = ref(false)

// 判断模式
const getBlogLoadding = ref(false)
watch(
    () => router.currentRoute.value.query,
    async (v) => {
        if (v.id) {
            isEdit.value = true
            // 通过Id获取博客内容
            try {
                getBlogLoadding.value = true
                const resp = await GET_BLOG(v.id)
                form.value = resp
            } finally {
                getBlogLoadding.value = false
            }

        }
    },
    { immediate: true }
)

const form = ref({
    title: '',
    author: '',
    content: '',
    summary: '',
    create_by: '',
    tags: {},
})

// form表单实例
const formRef = ref(null);
const createLoadding = ref(false)
const handleSave = async () => {
    const resp = await formRef.value.validate()
    if (!resp) {
        try {
            createLoadding.value = true
            if (isEdit.value) {
                await UPDATE_BLOG(router.currentRoute.value.query.id, form.value)
                Notification.success('更新成功')
            } else {
                await CREATE_BLOG(form.value)
                Notification.success('保存成功')
            }

        } finally {
            createLoadding.value = false
        }
    }
}

</script>

<style lang="css" scoped>
.md-editor {
    height: 660px;
}
</style>