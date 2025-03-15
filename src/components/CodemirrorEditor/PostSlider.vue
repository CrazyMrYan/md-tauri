<script setup lang="ts">
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
// UI 组件导入
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/stores'
import { Edit3, Ellipsis, Plus, Trash } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

const store = useStore()

const isOpen = ref(false)

const addPostInputVal = ref(``)
const isVuepressFormat = ref(false)
const postDate = ref(new Date().toISOString())
const postTags = ref([``])
const postMeta = ref([{ name: ``, content: `` }])

watch(isOpen, () => {
  if (isOpen.value) {
    addPostInputVal.value = ``
    isVuepressFormat.value = false
    postDate.value = new Date().toISOString()
    postTags.value = [``]
    postMeta.value = [{ name: ``, content: `` }]
  }
})

function addTag() {
  postTags.value.push(``)
}

function removeTag(index: number) {
  postTags.value.splice(index, 1)
}

function addMetaItem() {
  postMeta.value.push({ name: ``, content: `` })
}

function removeMetaItem(index: number) {
  postMeta.value.splice(index, 1)
}

function generateVuepressContent(title: string) {
  let content = `---\n`
  content += `title: "${title}"\n`
  content += `date: ${postDate.value}\n`

  if (postTags.value.length > 0 && postTags.value[0] !== ``) {
    content += `tags: \n`
    postTags.value.forEach((tag) => {
      if (tag.trim() !== ``) {
        content += `  - ${tag}\n`
      }
    })
  }

  if (postMeta.value.length > 0 && postMeta.value[0].name !== ``) {
    content += `head:\n`
    postMeta.value.forEach((meta) => {
      if (meta.name.trim() !== `` && meta.content.trim() !== ``) {
        content += `  - - meta\n`
        content += `    - name: ${meta.name}\n`
        content += `      content: ${meta.content}\n`
      }
    })
  }

  content += `---\n\n`
  content += `# ${title}`

  return content
}

function addPost() {
  if (addPostInputVal.value === ``) {
    toast.error(`文档标题不可为空`)
    return
  }

  if (isVuepressFormat.value) {
    const content = generateVuepressContent(addPostInputVal.value)
    store.posts.push({
      title: addPostInputVal.value,
      content,
    })
    store.currentPostIndex = store.posts.length - 1
  }
  else {
    store.addPost(addPostInputVal.value)
  }

  isOpen.value = false
  toast.success(`文档新增成功`)
}

const editTarget = ref(-1)
const isOpenEditDialog = ref(false)
const renamePostInputVal = ref(``)
function startRenamePost(index: number) {
  editTarget.value = index
  renamePostInputVal.value = store.posts[index].title
  isOpenEditDialog.value = true
}

function renamePost() {
  if (renamePostInputVal.value === ``) {
    toast.error(`内容标题不可为空`)
    return
  }
  store.renamePost(editTarget.value, renamePostInputVal.value)
  isOpenEditDialog.value = false
  toast.success(`内容重命名成功`)
}

const isOpenDelPostConfirmDialog = ref(false)
function startDelPost(index: number) {
  editTarget.value = index
  isOpenDelPostConfirmDialog.value = true
}
function delPost() {
  store.delPost(editTarget.value)
  isOpenDelPostConfirmDialog.value = false
  toast.success(`内容删除成功`)
}
</script>

<template>
  <div
    class="overflow-hidden bg-gray/20 transition-width duration-300 dark:bg-[#191c20]"
    :class="{
      'w-0': !store.isOpenPostSlider,
      'w-50': store.isOpenPostSlider,
    }"
  >
    <nav
      class="space-y-1 h-full overflow-auto border-r-2 border-gray/20 p-2 transition-transform"
      :class="{
        'translate-x-100': store.isOpenPostSlider,
        '-translate-x-full': !store.isOpenPostSlider,
      }"
    >
      <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
          <Button variant="outline" class="w-full" size="xs">
            <Plus /> 新增文档
          </Button>
        </DialogTrigger>
        <DialogContent class="max-h-[80vh] flex flex-col sm:max-w-[500px]">
          <DialogHeader class="flex-shrink-0">
            <DialogTitle>新增文档</DialogTitle>
            <DialogDescription>
              请输入文档标题和选择文档格式
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 flex-1 overflow-y-auto px-1">
            <div class="space-y-2">
              <Label for="title">文档标题</Label>
              <Input id="title" v-model="addPostInputVal" placeholder="请输入文档标题" />
            </div>

            <div class="space-x-2 flex items-center">
              <input id="format" v-model="isVuepressFormat" type="checkbox" class="text-primary focus:ring-primary border-gray-300 rounded">
              <Label for="format">使用 VuePress 格式</Label>
            </div>

            <div v-if="isVuepressFormat" class="space-y-4 border rounded-md p-3">
              <div class="space-y-2">
                <Label for="date">发布日期</Label>
                <Input id="date" v-model="postDate" type="datetime-local" />
              </div>

              <div class="space-y-2">
                <div class="mb-2 flex items-center justify-between">
                  <Label>标签</Label>
                  <Button variant="outline" size="xs" @click="addTag">
                    添加标签
                  </Button>
                </div>
                <div v-for="(tag, index) in postTags" :key="index" class="mb-2 flex items-center gap-2">
                  <Input v-model="postTags[index]" placeholder="输入标签" class="flex-1" />
                  <div class="text-inherit">
                    <Button v-if="postTags.length > 1" variant="outline" size="icon" class="min-w-8 flex-shrink-0" @click="removeTag(index)">
                      <Trash class="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="mb-2 flex items-center justify-between">
                  <Label>Meta 信息</Label>
                  <Button variant="outline" size="xs" @click="addMetaItem">
                    添加 Meta
                  </Button>
                </div>
                <div v-for="(meta, index) in postMeta" :key="index" class="mb-2 flex items-center gap-2">
                  <Input v-model="postMeta[index].name" placeholder="名称 (如 keywords)" class="flex-1" />
                  <Input v-model="postMeta[index].content" placeholder="内容" class="flex-1" />
                  <Button v-if="postMeta.length > 1" variant="outline" size="icon" class="min-w-8 flex-shrink-0" @click="removeMetaItem(index)">
                    <Trash class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter class="flex-shrink-0">
            <Button variant="outline" @click="isOpen = false">
              取消
            </Button>
            <Button @click="addPost()">
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <a
        v-for="(post, index) in store.posts" :key="post.title" href="#" :class="{
          'bg-primary text-primary-foreground shadow-lg dark:border-1 border-primary': store.currentPostIndex === index,
          'dark:bg-gray/30 dark:text-primary-foreground-dark dark:border-primary-dark': store.currentPostIndex === index,
        }"
        class="hover:bg-primary/90 hover:text-primary-foreground dark:hover:border-primary-dark h-8 w-full inline-flex items-center justify-start gap-2 whitespace-nowrap rounded px-2 text-sm transition-colors dark:text-white dark:hover:bg-gray/20 dark:hover:text-white"
        @click="store.currentPostIndex = index"
      >
        <span class="line-clamp-1">{{ post.title }}</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="xs" variant="ghost" class="ml-auto px-1.5">
              <Ellipsis class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click.stop="startRenamePost(index)">
              <Edit3 class="mr-2 size-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem v-if="store.posts.length > 1" @click.stop="startDelPost(index)">
              <Trash class="mr-2 size-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </a>
      <!-- 重命名弹窗 -->
      <Dialog v-model:open="isOpenEditDialog">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑内容名称</DialogTitle>
            <DialogDescription>
              请输入新的内容名称
            </DialogDescription>
          </DialogHeader>
          <Input v-model="renamePostInputVal" />
          <DialogFooter>
            <Button variant="outline" @click="isOpenEditDialog = false">
              取消
            </Button>
            <Button @click="renamePost()">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog v-model:open="isOpenDelPostConfirmDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该内容，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="delPost()">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  </div>
</template>

<style scoped lang="less">
.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
</style>
