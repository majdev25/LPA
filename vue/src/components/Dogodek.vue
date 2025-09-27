<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, watch } from "vue";

// Props
const props = defineProps({
  state: {
    type: Object,
    default: () => ({}),
  },
  procesi: {
    type: Array,
    default: () => [],
  }
});

// Emits
const emit = defineEmits(["save"]);

// Reactive local copy
const localState = reactive({ ...props.state });

// watch for prop changes
watch(
  () => props.state,
  (newState) => {
    Object.assign(localState, newState);
  },
  { deep: true }
);

watch(
  () => localState.type,
  (newOther) => {
    console.log("change")
    updateIzvorPonor();
  },
);

// Save function
function saveEdge() {
  emit("save", { ...localState });
}

function deleteEdge() {
  emit("delete");
}

function updateIzvorPonor() {
  const found = props.procesi.find(x => x.id == localState.parent_process);

  if (!found) {
    return;
  }

  if (localState.type == "spr") {
    localState.to_process = found.id;
  } else if (localState.type == "odd") {
    localState.from_process = found.id;
  } else if (localState.type == "lok") {
    localState.from_process = found.id;
    localState.to_process = found.id;
  }
}
</script>

<template>
  <div class="d-flex flex-column justify-content-between w-100 flex-grow-1">
    <div v-if="props.state" class="d-flex flex-column gap-2 rounded">
      <div class="fs-5 fw-bold text-black">
        <FontAwesomeIcon :icon="['fa', 'arrow-right']" /> Dogodek
      </div>

      <hr class="mb-2"></hr>

      <div class="mb-2">
        <label class="form-label">Ime dogodka</label>
        <input
          class="form-control"
          v-model="localState.label"
          placeholder="Vnesi ime stanja"
        />
      </div>

       <div class="mb-2">
    <label class="form-label">Vrsta dogodka</label>
    <select class="form-select" v-model="localState.type">
      <option value="spr">Sprejemni (+)</option>
      <option value="odd">Oddajni (-)</option>
      <option value="lok">Lokalni (#)</option>
      <option value="tra">Transparenti</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Izvorni proces</label>
    <select class="form-select" v-model="localState.from_process" :disabled="localState.type == 'odd' || localState.type == 'lok'">
      <option :value="p.id" v-for="p in procesi">{{ p.label }}</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Ponorni proces</label>
    <select class="form-select" v-model="localState.to_process" :disabled="localState.type == 'spr' || localState.type == 'lok'">
      <option :value="p.id" v-for="p in procesi">{{ p.label }}</option>
    </select>
    </div>
      
    </div>
    <div class="d-flex gap-2">
      <button
        class="btn btn-primary mt-2 flex-grow-1 text-white"
        @click="saveEdge"
        :disabled="JSON.stringify(localState) === JSON.stringify(props.state)"
      >
        Shrani
      </button>
      <button class="btn btn-danger mt-2 fit-content" @click="deleteEdge">
        <FontAwesomeIcon :icon="['fa', 'trash']" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
