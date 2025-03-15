<script setup lang="ts">
const aboutDialogVisible = ref(false);
const contactInfoDialogVisible = ref(false);
</script>

<template>
  <MenubarMenu>
    <MenubarTrigger>
      帮助
    </MenubarTrigger>
    <MenubarContent align="start">
      <MenubarCheckboxItem @click="aboutDialogVisible = true">
        <span>关于</span>
      </MenubarCheckboxItem>
      <MenubarCheckboxItem @click="contactInfoDialogVisible = true">
        <span>联系维护人</span>
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>

  <ContactInfo :visible="contactInfoDialogVisible" @close="contactInfoDialogVisible = false" />
  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
</template>
