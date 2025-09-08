<template>
  <iframe class="wh-full overflow-hiden" frameborder="0" :srcdoc="docHtml"></iframe>
</template>

<script setup lang="ts">
interface Props {
  docHtml: string
}
defineProps<Props>()
</script>