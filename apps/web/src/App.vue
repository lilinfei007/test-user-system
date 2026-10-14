<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
fetch("/api/test/").then(res => {
  console.log(res);
})
</script>

<template>
  <HelloWorld />
</template>
