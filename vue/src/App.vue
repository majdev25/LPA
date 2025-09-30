<script setup>
import { ref, reactive, onMounted } from "vue";
import Proces from "./components/Proces.vue";
import System from "./components/System.vue";

import { computed } from "vue";

const procesGraph = computed(() => systemGraph?.value?.proces?.procesGraph);
const procesesList = computed(() => systemGraph?.value?.processes);
const procesId = computed(() => systemGraph?.value?.proces?.id);

var winType = ref(null);
var systemGraph = ref(null);

onMounted(() => {
  window.api.on("win-type", (data) => {
    winType.value = data;
  });

  window.api.on("win-data", (data) => {
    console.log(data);
    systemGraph.value = data;
    console.log(systemGraph.value);
  });
});
</script>
<template>
  <Proces
    v-if="winType === 'proces' && systemGraph"
    :_graph="procesGraph"
    :_proceses="procesesList"
    :_id="procesId"
  />
  <System v-else-if="winType == 'system'" />
</template>
