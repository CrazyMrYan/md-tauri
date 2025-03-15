<script setup lang="ts">
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
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>联系方式</DialogTitle>
      </DialogHeader>
      <p>邮箱: crazymryan@gmail.com</p>
      <p>网站: <a href="https://giao.club" target="_blank" rel="noopener noreferrer">https://giao.club</a></p>
      <p>公众号: 喜欢写 Bug 的严老湿</p>
      <p>GitHub: <a href="https://github.com/CrazyMrYan" target="_blank" rel="noopener noreferrer">https://github.com/CrazyMrYan</a></p>
      
      <DialogFooter class="sm:justify-evenly">
     
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
