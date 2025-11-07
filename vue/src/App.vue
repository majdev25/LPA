<script setup>
import { ref, onMounted } from "vue";
import Proces from "./components/Proces.vue";
import System from "./components/System.vue";
import Pgss from "./components/Pgss.vue";

var winType = ref(null);
var data = ref(null);
var id = ref(null);

var systemGraphVar = null;
var pgss_data = ref(null);

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
    } else if (winType.value == "pgss") {
      pgss_data.value = data.value;
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
  <Pgss
    :_pgss_data="pgss_data"
    v-else-if="winType === 'pgss' && pgss_data && pgss_data.pgss.M"
  />
</template>
