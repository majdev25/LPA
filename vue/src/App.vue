<script setup>
import { ref, onMounted } from "vue";
import Proces from "./components/Proces.vue";
import System from "./components/System.vue";

var winType = ref(null);
var data = ref(null);
var id = ref(null);

var systemGraphVar = null; // will hold calculated systemGraph

onMounted(() => {
  window.api.on("win-type", (newWinType) => {
    winType.value = newWinType;
  });

  window.api.on("win-id", (newId) => {
    id.value = newId;
  });

  window.api.on("win-data", (newData) => {
    data.value = newData;

    console.log("[APP] win-data " + id.value, newData);

    if (winType.value == "proces") {
      systemGraphVar = data.value.systemGraph;
    }
  });
});
</script>

<template>
  <Proces
    v-if="winType === 'proces' && data"
    :_systemGraph="systemGraphVar"
    :_id="id"
  />
  <System v-else-if="winType == 'system'" />
</template>
