<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-lg font-medium">预览</h2>
      <PreviewModeSwitch v-model="previewConfig.mode" />
    </div>
    <div class="flex-1 overflow-auto bg-gray-50 p-4">
      <div
        class="bg-white mx-auto h-full shadow-md transition-all duration-300"
        :class="{
          'w-full': previewConfig.mode === PreviewMode.FullScreen,
          'max-w-[800px]': previewConfig.mode === PreviewMode.Adaptive,
          'w-[375px] border': previewConfig.mode === PreviewMode.Mobile
        }"
        :style="{
          minHeight: previewConfig.mode === PreviewMode.Mobile ? '667px' : 'auto'
        }"
      >
        <div
          class="markdown-body p-6"
          v-html="renderedContent"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PreviewModeSwitch from './PreviewModeSwitch.vue';
import { PreviewMode, PreviewConfig, DEFAULT_PREVIEW_CONFIG } from '../types/preview';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown.css';

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (e) {
        console.error(e);
      }
    }
    return code;
  }
});

const props = defineProps<{
  content: string;
}>();

const previewConfig = ref<PreviewConfig>({ ...DEFAULT_PREVIEW_CONFIG });

const renderedContent = computed(() => {
  return marked(props.content);
});
</script>

<style scoped>
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}
</style> 