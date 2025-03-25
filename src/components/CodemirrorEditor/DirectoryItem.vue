<script setup lang="ts">
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Edit3, Ellipsis, File, Folder, FolderPlus, Plus, Trash } from 'lucide-vue-next'
import { computed } from 'vue'
import { useStore } from '@/stores'

// Props for the component
const props = defineProps<{
  directoryId: string;
  level: number;
  dropTargetId?: string | null;
  isDraggingOver?: boolean;
}>();

const emit = defineEmits<{
  'drag-start': [event: DragEvent, id: string, type: 'directory' | 'post'];
  'drag-end': [event: Event];
  'drag-over': [event: DragEvent, id: string];
  'drag-leave': [];
  'drop': [event: DragEvent, targetId: string];
  'show-add-subdirectory-dialog': [parentId: string];
  'show-rename-directory-dialog': [dirId: string];
  'start-del-directory': [dirId: string];
  'add-post-to-directory': [directoryId: string];
  'directory-click': [dirId: string, event: MouseEvent];
  'show-rename-post': [index: number];
  'start-del-post': [index: number];
}>();

const store = useStore();

// Get the directory object based on ID
const directory = computed(() => {
  return store.directories.find(d => d.id === props.directoryId);
});

// Get posts for this directory
const directoryPosts = computed(() => {
  const postIndices = Object.entries(store.postDirectoryMap)
    .filter(([_, dirId]) => dirId === props.directoryId)
    .map(([index, _]) => Number(index));
  
  return postIndices.map(index => ({ index, post: store.posts[index] }));
});

// Computed for whether the dropTarget matches this directory ID
const isDropTarget = computed(() => {
  return props.dropTargetId === props.directoryId && props.isDraggingOver;
});

// Handler for directory click
const handleDirectoryClick = (event: MouseEvent) => {
  // Ignore right-clicks
  if (event.button !== 0) return;
  
  emit('directory-click', props.directoryId, event);
};

// Handle selecting a post
const selectPost = (index: number) => {
  store.currentPostIndex = index;
};
</script>

<template>
  <div class="directory-tree-item">
    <div 
      class="directory-item flex items-center p-1 rounded cursor-pointer"
      :class="{ 'bg-primary/20': isDropTarget }"
      draggable="true"
      @dragstart="emit('drag-start', $event, directoryId, 'directory')"
      @dragend="emit('drag-end', $event)"
      @dragover="emit('drag-over', $event, directoryId)"
      @dragleave="emit('drag-leave')"
      @drop="emit('drop', $event, directoryId)"
      @click="handleDirectoryClick($event)"
    >
      <span class="directory-expander w-4 flex-shrink-0" @click.stop="emit('directory-click', directoryId, $event)">
        <component 
          :is="directory?.isExpanded ? ChevronDown : ChevronRight" 
          class="size-4"
        />
      </span>
      <Folder class="size-4 mr-1 text-primary flex-shrink-0" />
      <span class="directory-name line-clamp-1 select-none">{{ directory?.name }}</span>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button size="xs" variant="ghost" class="ml-auto px-1.5 flex-shrink-0" @click.stop>
            <Ellipsis class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click.stop="emit('add-post-to-directory', directoryId)">
            <Plus class="mr-2 size-4" />
            添加文档
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="emit('show-add-subdirectory-dialog', directoryId)">
            <FolderPlus class="mr-2 size-4" />
            添加子目录
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="emit('show-rename-directory-dialog', directoryId)">
            <Edit3 class="mr-2 size-4" />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="emit('start-del-directory', directoryId)">
            <Trash class="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
    <!-- Recursively render directory children when expanded -->
    <div v-if="directory?.isExpanded" class="directory-children ml-4">
      <!-- Render subdirectories recursively -->
      <DirectoryItem 
        v-for="childId in directory.children" 
        :key="childId"
        :directory-id="childId"
        :level="level + 1"
        :drop-target-id="dropTargetId"
        :is-dragging-over="isDraggingOver"
        @drag-start="(event, id, type) => emit('drag-start', event, id, type)"
        @drag-end="(event) => emit('drag-end', event)"
        @drag-over="(event, id) => emit('drag-over', event, id)"
        @drag-leave="emit('drag-leave')"
        @drop="(event, targetId) => emit('drop', event, targetId)"
        @show-add-subdirectory-dialog="(parentId) => emit('show-add-subdirectory-dialog', parentId)"
        @show-rename-directory-dialog="(dirId) => emit('show-rename-directory-dialog', dirId)"
        @start-del-directory="(dirId) => emit('start-del-directory', dirId)"
        @add-post-to-directory="(dirId) => emit('add-post-to-directory', dirId)"
        @directory-click="(dirId, event) => emit('directory-click', dirId, event)"
        @show-rename-post="(index) => emit('show-rename-post', index)"
        @start-del-post="(index) => emit('start-del-post', index)"
      />
      
      <!-- Render posts in this directory -->
      <div 
        v-for="{ index, post } in directoryPosts" 
        :key="`post-${index}`"
        class="post-item flex items-center p-1 rounded cursor-pointer"
        :class="{ 'bg-primary/80 text-white': store.currentPostIndex === index, 'bg-primary/20': dropTargetId === String(index) && isDraggingOver }"
        draggable="true"
        @dragstart="emit('drag-start', $event, String(index), 'post')"
        @dragend="emit('drag-end', $event)"
        @dragover="emit('drag-over', $event, String(index))"
        @dragleave="emit('drag-leave')"
        @drop="emit('drop', $event, String(index))"
        @click="selectPost(index)"
      >
        <span class="w-4 flex-shrink-0"></span>
        <File class="size-4 mr-1 flex-shrink-0" :class="store.currentPostIndex === index ? 'text-white' : 'text-muted-foreground'" />
        <span class="post-title line-clamp-1 select-none">{{ post.title }}</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="xs" variant="ghost" class="ml-auto px-1.5 flex-shrink-0" @click.stop>
              <Ellipsis class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click.stop="emit('show-rename-post', index)">
              <Edit3 class="mr-2 size-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem v-if="store.posts.length > 1" @click.stop="emit('start-del-post', index)">
              <Trash class="mr-2 size-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<style scoped>
.directory-expander {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.2rem;
}

.directory-expander:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--primary);
}

.dark .directory-expander:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.directory-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 3.5rem);
  margin-right: 0.25rem;
}

.post-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 3.5rem);
  margin-right: 0.25rem;
}
</style> 