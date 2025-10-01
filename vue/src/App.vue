<script setup>
import { ref, reactive, onMounted } from "vue";
import Proces from "./components/Proces.vue";
import System from "./components/System.vue";

import { computed } from "vue";

const procesGraph = computed(() => data?.value?.proces?.procesGraph);
const systemGraph = computed(() => data?.value?.systemGraph);
const procesId = computed(() => data?.value?.proces?.id);

var winType = ref(null);
var data = ref(null);

onMounted(() => {
  window.api.on("win-type", (data) => {
    winType.value = data;
  });

  window.api.on("win-data", (newData) => {
    data.value = newData;
  });
});
</script>
<template>
  <Proces
    v-if="winType === 'proces' && data"
    :_graph="procesGraph"
    :_systemGraph="systemGraph"
    :_id="procesId"
  />
  <System v-else-if="winType == 'system'" />
</template>
