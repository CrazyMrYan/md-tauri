<script setup lang="ts">
import { useStore } from '@/stores'
import { Download, FileCode, Upload } from 'lucide-vue-next'

const store = useStore()

const {
  exportEditorContent2HTML,
  exportEditorContent2MD,
  importMarkdownContent,
} = store
</script>

<template>
  <MenubarMenu>
    <MenubarTrigger>
      文件
    </MenubarTrigger>
    <MenubarContent align="start">
      <MenubarItem @click="importMarkdownContent()">
        <Upload class="mr-2 size-4" />
        导入 .md
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2MD()">
        <Download class="mr-2 size-4" />
        导出 .md
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2HTML()">
        <FileCode class="mr-2 size-4" />
        导出 .html
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
