<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary'
  to?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const sfx = useSfx()
const onClickSfx = () => sfx.play('click')
</script>

<template>
  <NuxtLink
    v-if="to && !disabled"
    :to="to"
    :class="variant === 'primary' ? 'pixel-button-primary' : 'pixel-button'"
    @click="onClickSfx"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    type="button"
    :disabled="disabled"
    :class="[
      variant === 'primary' ? 'pixel-button-primary' : 'pixel-button',
      disabled ? 'pixel-button-disabled' : '',
    ]"
    @click="onClickSfx"
  >
    <slot />
  </button>
</template>
