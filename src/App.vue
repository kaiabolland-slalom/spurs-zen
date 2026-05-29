<script setup>
import Gallery from './lib/gallery/Gallery.vue'
import BreathworkEngine from './lib/breathwork/BreathworkEngine.vue'
</script>

<template>
  <Gallery />
  <BreathworkEngine class="above-gallery" />
</template>

<style>
.above-gallery {
  position: relative;
  z-index: 1;
}
</style>
