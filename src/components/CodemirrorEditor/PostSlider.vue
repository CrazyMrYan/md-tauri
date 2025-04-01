<script setup lang="ts">
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
// UI 组件导入
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/stores'
import { ChevronDown, ChevronRight, Edit3, Ellipsis, File, Folder, FolderPlus, Plus, Trash } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import DirectoryItem from './DirectoryItem.vue'

const store = useStore()

// 拖拽相关状态
const draggingItemId = ref<string | null>(null)
const draggingType = ref<`directory` | `post` | null>(null)
const dropTargetId = ref<string | null>(null)
const isDraggingOver = ref(false)

// 侧边栏宽度拖拽相关
const isResizing = ref(false)
const sliderWidth = ref(220)
const startX = ref(0)
const startWidth = ref(0)

function startResize(event: MouseEvent) {
  event.preventDefault() // 阻止默认行为，防止文本选择
  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = sliderWidth.value

  // 添加禁止文本选择的类
  document.body.classList.add(`select-none`)

  document.addEventListener(`mousemove`, handleResize)
  document.addEventListener(`mouseup`, stopResize)
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value)
    return
  const delta = event.clientX - startX.value
  sliderWidth.value = Math.max(150, Math.min(500, startWidth.value + delta))
}

function stopResize() {
  isResizing.value = false

  // 移除禁止文本选择的类
  document.body.classList.remove(`select-none`)

  document.removeEventListener(`mousemove`, handleResize)
  document.removeEventListener(`mouseup`, stopResize)
}

// 计算根目录下的所有目录
const rootDirectories = computed(() => {
  return store.directories.filter(dir => dir.id === `root`)[0]
})

// 获取特定目录的文档
function getPostsByDirectory(directoryId: string) {
  const postIndices = Object.entries(store.postDirectoryMap)
    .filter(([_, dirId]) => dirId === directoryId)
    .map(([index, _]) => Number(index))

  return postIndices.map(index => ({ index, post: store.posts[index] }))
}

// 添加和编辑文档相关状态
const isOpen = ref(false)
const selectedDirectoryId = ref(`root`)
const directoryPath = computed(() => store.findDirectoryPath(selectedDirectoryId.value).join(` / `))

// 添加从目录右键菜单添加文档的函数
function addPostToDirectory(directoryId: string) {
  selectedDirectoryId.value = directoryId
  isOpen.value = true
  console.log(`Adding post to directory: ${directoryId}, path: ${store.findDirectoryPath(directoryId).join(` / `)}`)
}

const addPostInputVal = ref(``)
const isVuepressFormat = ref(false)
const postDate = ref(new Date().toISOString())
const postTags = ref([``])
const postMeta = ref([{ name: ``, content: `` }])

// 添加和编辑目录相关状态
const isOpenDirDialog = ref(false)
const directoryInputVal = ref(``)
const editDirectoryId = ref<string | null>(null)
const editDirectoryParentId = ref<string | null>(null)

// 重命名目录对话框设置
function showRenameDirectoryDialog(dirId: string) {
  editDirectoryId.value = dirId
  const dir = store.directories.find(d => d.id === dirId)
  if (dir) {
    directoryInputVal.value = dir.name
    isOpenDirDialog.value = true
  }
}

// 添加子目录对话框设置
function showAddSubdirectoryDialog(parentId: string) {
  editDirectoryId.value = null
  editDirectoryParentId.value = parentId
  directoryInputVal.value = ``
  isOpenDirDialog.value = true
}

// 打开新增目录对话框
function openNewDirectoryDialog() {
  editDirectoryId.value = null
  editDirectoryParentId.value = null
  directoryInputVal.value = ``
}

// 删除目录确认对话框
const isOpenDelDirConfirmDialog = ref(false)
const directoryToDelete = ref<string | null>(null)
const shouldDeleteDocuments = ref(false)
const isDeletingDirectory = ref(false)

function startDelDirectory(dirId: string) {
  directoryToDelete.value = dirId
  shouldDeleteDocuments.value = false
  isOpenDelDirConfirmDialog.value = true
}

function deleteDirectory() {
  if (directoryToDelete.value) {
    isDeletingDirectory.value = true

    try {
      store.deleteDirectory(directoryToDelete.value, shouldDeleteDocuments.value)
      toast.success(`目录删除成功`)
    }
    catch (error) {
      toast.error(`删除目录失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      isDeletingDirectory.value = false
      isOpenDelDirConfirmDialog.value = false
      directoryToDelete.value = null
    }
  }
}

// 保存目录操作
function saveDirectory() {
  if (directoryInputVal.value.trim() === ``) {
    toast.error(`目录名不能为空`)
    return
  }

  if (editDirectoryId.value) {
    // 重命名目录
    store.renameDirectory(editDirectoryId.value, directoryInputVal.value)
    toast.success(`目录重命名成功`)
  }
  else if (editDirectoryParentId.value) {
    // 添加子目录
    store.addDirectory(directoryInputVal.value, editDirectoryParentId.value)
    toast.success(`子目录创建成功`)
  }
  else {
    // 添加顶级目录
    store.addDirectory(directoryInputVal.value)
    toast.success(`目录创建成功`)
  }

  isOpenDirDialog.value = false
  directoryInputVal.value = ``
  editDirectoryId.value = null
  editDirectoryParentId.value = null
}

// 检测是否双击
const lastClickTime = ref(0)
const lastClickedDir = ref<string | null>(null)

function handleDirectoryClick(dirId: string, event: MouseEvent) {
  // 忽略右键点击
  if (event.button !== 0)
    return

  // 单击事件 - 切换展开/折叠
  store.toggleDirectoryExpanded(dirId)
}

watch(isOpen, () => {
  if (isOpen.value) {
    addPostInputVal.value = ``
    isVuepressFormat.value = false
    postDate.value = new Date().toISOString()
    postTags.value = [``]
    postMeta.value = [{ name: ``, content: `` }]
    // 不要重置目录选择，保留用户选择的目录
    // selectedDirectoryId.value = 'root'
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
  console.log(`Generating VuePress content for: ${title}, with date: ${postDate.value}, tags:`, postTags.value)

  let content = `---\n`
  content += `title: "${title}"\n`
  content += `date: ${postDate.value}\n`

  if (postTags.value.length > 0 && postTags.value[0].trim() !== ``) {
    content += `tags: \n`
    postTags.value.forEach((tag) => {
      if (tag.trim() !== ``) {
        content += `  - ${tag}\n`
      }
    })
  }

  if (postMeta.value.length > 0 && postMeta.value[0].name.trim() !== ``) {
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

  console.log(`Generated VuePress content:`, content)
  return content
}

function addPost() {
  if (addPostInputVal.value === ``) {
    toast.error(`文档标题不可为空`)
    return
  }

  console.log(`Adding post with title: ${addPostInputVal.value}, to directory: ${selectedDirectoryId.value}, VuePress format: ${isVuepressFormat.value}`)

  // 确保目标目录及其所有父目录都展开
  const ensureDirectoryExpanded = (directoryId: string) => {
    if (directoryId === `root`)
      return

    const dir = store.directories.find(d => d.id === directoryId)
    if (dir) {
      dir.isExpanded = true

      // 确保父目录也展开
      if (dir.parentId && dir.parentId !== `root`) {
        ensureDirectoryExpanded(dir.parentId)
      }
    }
  }

  ensureDirectoryExpanded(selectedDirectoryId.value)

  if (isVuepressFormat.value) {
    const content = generateVuepressContent(addPostInputVal.value)
    store.posts.push({
      title: addPostInputVal.value,
      content,
    })
    const newIndex = store.posts.length - 1
    store.currentPostIndex = newIndex
    // 添加目录关联
    store.postDirectoryMap[newIndex] = selectedDirectoryId.value
    console.log(`Added VuePress post at index ${newIndex} to directory ${selectedDirectoryId.value}`)
    toast.success(`文档新增成功 - 已添加到 ${store.findDirectoryPath(selectedDirectoryId.value).join(` / `)}`)
  }
  else {
    store.addPost(addPostInputVal.value, selectedDirectoryId.value)
    console.log(`Added regular post to directory ${selectedDirectoryId.value}`)
    toast.success(`文档新增成功 - 已添加到 ${store.findDirectoryPath(selectedDirectoryId.value).join(` / `)}`)
  }

  isOpen.value = false
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
const isDeletingPost = ref(false)
function startDelPost(index: number) {
  editTarget.value = index
  isOpenDelPostConfirmDialog.value = true
}
function delPost() {
  isDeletingPost.value = true

  try {
    // Check if this is the last post
    const isLastPost = store.posts.length <= 1
    
    // Delete the post
    store.delPost(editTarget.value)
    
    // If that was the last post, create a new default one
    if (isLastPost) {
      const defaultContent = '# 新文档\n\n开始编辑...'
      store.addPost('新文档', 'root', defaultContent)
      
      // Ensure the UI is updated properly
      setTimeout(() => {
        if (store.editor) {
          store.editor.setValue(defaultContent)
          store.editorRefresh()
        }
      }, 100)
      
      toast.success('已创建新文档')
    }
    
    // Force editor to refresh with the current post content
    if (store.editor) {
      try {
        // Make sure we have valid content to display
        if (store.posts.length > 0 && store.currentPostIndex >= 0 && store.currentPostIndex < store.posts.length) {
          // Set the content in the editor
          store.editor.setValue(store.posts[store.currentPostIndex].content)
          
          // Schedule editor refresh with a delay to ensure proper initialization
          setTimeout(() => {
            try {
              store.editorRefresh()
            } catch (refreshError) {
              console.error('Error refreshing editor:', refreshError)
            }
          }, 100)
        } else {
          console.error('Invalid post index after deletion:', store.currentPostIndex)
        }
      } catch (editorError) {
        console.error('Error updating editor content:', editorError)
      }
    }
    
    toast.success(`内容删除成功`)
  }
  catch (error) {
    toast.error(`删除内容失败: ${error instanceof Error ? error.message : String(error)}`)
  }
  finally {
    isDeletingPost.value = false
    isOpenDelPostConfirmDialog.value = false
  }
}

// Drag and drop handlers
function handleDragStart(event: DragEvent, id: string, type: `directory` | `post`) {
  if (!event.dataTransfer)
    return

  draggingItemId.value = id
  draggingType.value = type

  event.dataTransfer.effectAllowed = `move`
  event.dataTransfer.setData(`text/plain`, id)

  // 添加半透明效果
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = `0.4`
  }
}

function handleDragEnd(event: Event) {
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = `1`
  }

  draggingItemId.value = null
  draggingType.value = null
  dropTargetId.value = null
  isDraggingOver.value = false
}

function handleDragOver(event: DragEvent, id: string) {
  if (!event.dataTransfer || draggingItemId.value === id) {
    return
  }

  // 阻止默认行为使得可以触发drop
  event.preventDefault()

  // 仅允许移动操作
  event.dataTransfer.dropEffect = `move`

  // 如果拖动的是目录，而目标是文档，则不允许
  if (draggingType.value === `directory` && id.match(/^\d+$/)) {
    return
  }

  dropTargetId.value = id
  isDraggingOver.value = true
}

function handleDragLeave() {
  dropTargetId.value = null
  isDraggingOver.value = false
}

function handleDrop(event: DragEvent, targetId: string) {
  // 阻止默认行为
  event.preventDefault()

  // 重置状态
  dropTargetId.value = null
  isDraggingOver.value = false

  // 如果没有拖动项，或者拖放到自己身上，则不进行任何操作
  if (!draggingItemId.value || draggingItemId.value === targetId) {
    return
  }

  // 如果拖动的是目录，而目标是文档，则不允许
  if (draggingType.value === `directory` && targetId.match(/^\d+$/)) {
    toast.error(`不能将目录拖放到文档上`)
    return
  }

  // 执行移动操作
  const success = store.moveItem(
    draggingItemId.value,
    targetId,
    draggingType.value === `directory`,
  )

  if (success) {
    toast.success(`${draggingType.value === `directory` ? `目录` : `文档`}移动成功`)
  }
  else {
    toast.error(`无法移动到目标位置`)
  }

  // 重置拖动状态
  draggingItemId.value = null
  draggingType.value = null
}

// Add logging to isVuepressFormat changes
watch(isVuepressFormat, (newVal) => {
  console.log(`VuePress format changed to: ${newVal}`)
})
</script>

<template>
  <div
    class="relative overflow-hidden bg-gray/20 dark:bg-[#191c20]"
    :class="{
      'w-0': !store.isOpenPostSlider,
      'transition-width duration-300': !isResizing,
    }"
    :style="{ width: store.isOpenPostSlider ? `${sliderWidth}px` : '0' }"
  >
    <nav
      class="space-y-1 h-full select-none overflow-auto border-r-2 border-gray/20 p-2"
      :class="{
        'translate-x-100': store.isOpenPostSlider,
        '-translate-x-full': !store.isOpenPostSlider,
        'transition-transform': !isResizing,
      }"
    >
      <div class="mb-2 flex gap-2">
        <Dialog v-model:open="isOpen">
          <DialogTrigger as-child>
            <Button variant="outline" class="flex-1 justify-between" size="xs">
              <Plus class="size-4" /> <span>新增文档</span>
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
                <Switch id="format" v-model="isVuepressFormat" />
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

        <Dialog v-model:open="isOpenDirDialog">
          <DialogTrigger as-child>
            <Button variant="outline" size="xs" class="flex-1 justify-between" @click="openNewDirectoryDialog">
              <FolderPlus class="size-4" /> 新增目录
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{{ editDirectoryId ? '编辑目录' : '新增目录' }}</DialogTitle>
              <DialogDescription>
                {{ editDirectoryId ? '请输入新的目录名称' : editDirectoryParentId ? '请输入子目录名称' : '请输入目录名称' }}
              </DialogDescription>
            </DialogHeader>
            <Input v-model="directoryInputVal" placeholder="目录名称" />
            <DialogFooter>
              <Button variant="outline" @click="isOpenDirDialog = false">
                取消
              </Button>
              <Button @click="saveDirectory()">
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div class="directory-tree">
        <!-- 使用新的递归组件渲染根目录下的子目录 -->
        <template v-for="childId in store.directories.find(d => d.id === 'root')?.children" :key="childId">
          <DirectoryItem
            :directory-id="childId"
            :level="0"
            :drop-target-id="dropTargetId"
            :is-dragging-over="isDraggingOver"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
            @drag-over="handleDragOver"
            @drag-leave="handleDragLeave"
            @drop="handleDrop"
            @show-add-subdirectory-dialog="showAddSubdirectoryDialog"
            @show-rename-directory-dialog="showRenameDirectoryDialog"
            @start-del-directory="startDelDirectory"
            @add-post-to-directory="addPostToDirectory"
            @directory-click="handleDirectoryClick"
            @show-rename-post="startRenamePost"
            @start-del-post="startDelPost"
          />
        </template>

        <!-- 渲染根目录下的文档 -->
        <template v-for="{ index, post } in getPostsByDirectory('root')" :key="`post-${index}`">
          <div
            class="post-item flex cursor-pointer items-center rounded p-1"
            :class="{ 'bg-primary/80 text-white': store.currentPostIndex === index, 'bg-primary/20': dropTargetId === String(index) && isDraggingOver }"
            draggable="true"
            @dragstart="handleDragStart($event, String(index), 'post')"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, String(index))"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, String(index))"
            @click="store.currentPostIndex = index"
          >
            <span class="w-4 flex-shrink-0" />
            <File class="mr-1 size-4 flex-shrink-0" :class="store.currentPostIndex === index ? 'text-white' : 'text-muted-foreground'" />
            <span class="post-title line-clamp-1 select-none">{{ post.title }}</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button size="xs" variant="ghost" class="ml-auto flex-shrink-0 px-1.5" @click.stop>
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
          </div>
        </template>
      </div>

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
            <AlertDialogCancel :disabled="isDeletingPost">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              :disabled="isDeletingPost"
              :class="{ 'opacity-50 cursor-not-allowed': isDeletingPost }"
              @click="delPost()"
            >
              {{ isDeletingPost ? '删除中...' : '确认' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog v-model:open="isOpenDelDirConfirmDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该目录及其所有子目录，目录中的文档将默认移至根目录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div class="py-3">
            <div class="space-x-2 flex items-center">
              <Switch id="deleteDocuments" v-model="shouldDeleteDocuments" />
              <Label for="deleteDocuments">同时删除该目录下的所有文档</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel :disabled="isDeletingDirectory">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              :disabled="isDeletingDirectory"
              :class="{ 'opacity-50 cursor-not-allowed': isDeletingDirectory }"
              @click="deleteDirectory()"
            >
              {{ isDeletingDirectory ? '删除中...' : '确认' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>

    <!-- 添加拖拽调整宽度的把手 -->
    <div
      v-if="store.isOpenPostSlider"
      class="hover:bg-primary/60 active:bg-primary absolute right-0 top-0 z-10 h-full w-1 cursor-ew-resize"
      :class="{ 'bg-primary': isResizing }"
      @mousedown="startResize"
    />
  </div>
</template>

<style scoped lang="less">
.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

// Allow text selection in inputs even though the sidebar has select-none
input,
textarea {
  user-select: text !important;
}

// 拖拽样式
[draggable] {
  user-select: none;
}

.drag-over {
  border: 2px dashed var(--primary);
  background-color: rgba(var(--primary-rgb), 0.1);
}

// 设置文档标题和目录名称的字体大小为系统默认
.post-title {
  font-size: 0.875rem; /* System default size */
}

// 确保对话框标题和按钮文本也使用合适的字体大小
:deep(.dialog-title) {
  font-size: 1rem;
}
</style>
