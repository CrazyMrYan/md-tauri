<script setup lang="ts">
import { cn } from '@/lib/utils'
import {
  SwitchRoot,
  type SwitchRootEmits,
  type SwitchRootProps,
  SwitchThumb,
  useForwardPropsEmits,
} from 'radix-vue'
import { computed, type HTMLAttributes, withDefaults } from 'vue'

interface Props extends SwitchRootProps {
  class?: HTMLAttributes[`class`],
  modelValue?: boolean 
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined
})

const emit = defineEmits<SwitchRootEmits & { 'update:modelValue': [value: boolean] }>()

const checked = computed({
  get: () => props.modelValue !== undefined ? props.modelValue : props.checked,
  set: (value) => {
    if (props.modelValue !== undefined) {
      emit('update:modelValue', value)
    }
    emit('update:checked', value)
  }
})

const delegatedProps = computed(() => {
  const { class: _, modelValue, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emit)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :checked="checked"
    @update:checked="checked = $event"
    :class="cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      props.class,
    )"
  >
    <SwitchThumb
      :class="cn('pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5')"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
