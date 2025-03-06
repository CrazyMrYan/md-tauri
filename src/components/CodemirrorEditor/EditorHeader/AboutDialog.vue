<script setup lang="ts">
import { shell } from '@tauri-apps/api';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val) {
    emit(`close`)
  }
}

const version = process.env.npm_package_version;
const osName = process.env.TAURI_PLATFORM;

const links = [
  { label: `GitHub`, url: `https://github.com/CrazyMrYan/md-tauri`, icon: `github` },
]

async function onRedirect(url: string) {
  console.log(shell);
  
  await shell.open(url);
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>关于</DialogTitle>
      </DialogHeader>
      <div>
        <p>当前版本: v{{ version }}</p>
        <p>系统信息: {{ osName}}</p>
      </div>
      <DialogFooter class="sm:justify-evenly">
        <Button
          v-for="link in links"
          :key="link.url"
          @click="onRedirect(link.url)"
        >
          <img :src="`/assets/icons/${link.icon}.svg`" class="w-4 h-4 mr-2" />
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
