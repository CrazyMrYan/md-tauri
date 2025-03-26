<script setup lang="ts">
import { isEmptyObject } from '@/utils'
import { shell } from '@tauri-apps/api'

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
const links = [
  { label: `GitHub`, url: `https://github.com/CrazyMrYan/md-tauri`, icon: `github` },
]

async function onRedirect(url: string) {
  try {
    await shell.open(url)
  }
  catch (error) {
    window.open(url, `_blank`, `noopener,noreferrer`)
    console.log(error)
  }
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>关于</DialogTitle>
      </DialogHeader>
      <div>
        <p>当前版本: v1.0.0-beta.1</p>
      </div>
      <DialogFooter class="sm:justify-evenly">
        <Button
          v-for="link in links"
          :key="link.url"
          @click="onRedirect(link.url)"
        >
          <img :src="`/assets/icons/${link.icon}.svg`" class="mr-2 h-4 w-4">
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
