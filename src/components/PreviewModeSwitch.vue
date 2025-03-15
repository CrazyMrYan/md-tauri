<template>
  <div class="flex items-center gap-2">
    <button
      v-for="mode in modes"
      :key="mode.value"
      class="p-2 rounded hover:bg-gray-100 transition-colors"
      :class="{ 'bg-gray-200': modelValue === mode.value }"
      @click="$emit('update:modelValue', mode.value)"
      :title="mode.label"
    >
      <component :is="mode.icon" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PreviewMode } from '../types/preview';
import { Smartphone, Maximize2, Monitor } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: PreviewMode;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PreviewMode): void;
}>();

const modes = [
  {
    value: PreviewMode.Adaptive,
    label: '自适应宽度',
    icon: Monitor
  },
  {
    value: PreviewMode.Mobile,
    label: '手机预览',
    icon: Smartphone
  },
  {
    value: PreviewMode.FullScreen,
    label: '全屏预览',
    icon: Maximize2
  }
];
</script> 