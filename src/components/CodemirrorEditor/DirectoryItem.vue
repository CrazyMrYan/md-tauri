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
}>();

const emit = defineEmits<{
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
        :style="{ 
          'background': store.currentPostIndex === index ? 'hsl(var(--foreground))' : '', 
          'color': store.currentPostIndex === index ? 'hsl(var(--primary-foreground))' : 'hsl(var(--accent-foreground))' 
        }"
        @click="selectPost(index)"
      >
        <span class="w-4 flex-shrink-0"></span>
        <File class="size-4 mr-1 flex-shrink-0" />
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
  font-size: 0.875rem; /* System default size */
}

.post-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 3.5rem);
  margin-right: 0.25rem;
  font-size: 0.875rem; /* System default size */
}
</style> 