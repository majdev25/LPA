<script setup>
import { ref, reactive, onMounted } from "vue";
import Proces from "./components/Proces.vue";
import System from "./components/System.vue";

const winType = ref(null);

onMounted(() => {
  window.api.on("win-type", (data) => {
    winType.value = data;
  });
});
</script>
<template>
  <Proces v-if="winType == 'proces'" />
  <System v-else-if="winType == 'system'" />
</template>
