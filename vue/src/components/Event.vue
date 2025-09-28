<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, watch } from "vue";

// Props
const props = defineProps({
  event: {
    type: Object,
    default: () => ({}),
  },
  proceses: {
    type: Array,
    default: () => [],
  }
});

// Emits
const emit = defineEmits(["save"]);

// Reactive local copy
const localEvent = reactive({ ...props.event });

// watch for prop changes
watch(
  () => props.event,
  (newEvent) => {
    Object.assign(localEvent, newEvent);
  },
  { deep: true }
);

watch(
  () => localEvent.type,
  (newOther) => {
    updateIzvorPonor();
  },
);

// Save function
function saveEvent() {
  emit("save", { ...localEvent });
}

function deleteEvent() {
  emit("delete");
}

function updateIzvorPonor() {
  const parent_proces = localEvent.parent_proces
  const found = props.proceses.find(x => x.id == parent_proces);

  if (!found) {
    return;
  }

  if (localEvent.type == "spr") {
    localEvent.to_process = found.id;
  } else if (localEvent.type == "odd") {
    localEvent.from_process = found.id;
  } else if (localEvent.type == "lok") {
    localEvent.from_process = found.id;
    localEvent.to_process = found.id;
  }
}
</script>

<template>
  <div class="d-flex flex-column justify-content-between w-100 flex-grow-1">
    <div v-if="props.event" class="d-flex flex-column gap-2 rounded">
      <div class="fs-5 fw-bold text-black">
        <FontAwesomeIcon :icon="['fa', 'arrow-right']" /> Dogodek
      </div>

      <hr class="mb-2"></hr>

      <div class="mb-2">
        <label class="form-label">Ime dogodka</label>
        <input
          class="form-control"
          v-model="localEvent.label"
          placeholder="Vnesi ime stanja"
        />
      </div>

       <div class="mb-2">
    <label class="form-label">Vrsta dogodka</label>
    <select class="form-select" v-model="localEvent.type">
      <option value="spr">Sprejemni (+)</option>
      <option value="odd">Oddajni (-)</option>
      <option value="lok">Lokalni (#)</option>
      <option value="tra">Transparenti</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Izvorni proces</label>
    <select class="form-select" v-model="localEvent.from_process" :disabled="localEvent.type == 'odd' || localEvent.type == 'lok'">
      <option :value="p.id" v-for="p in proceses">{{ p.label }}</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Ponorni proces</label>
    <select class="form-select" v-model="localEvent.to_process" :disabled="localEvent.type == 'spr' || localEvent.type == 'lok'">
      <option :value="p.id" v-for="p in proceses">{{ p.label }}</option>
    </select>
    </div>
      
    </div>
    <div class="d-flex gap-2">
      <button
        class="btn btn-primary mt-2 flex-grow-1 text-white"
        @click="saveEvent"
        :disabled="JSON.stringify(localEvent) === JSON.stringify(props.event)"
      >
        Shrani
      </button>
      <button class="btn btn-danger mt-2 fit-content" @click="deleteEvent">
        <FontAwesomeIcon :icon="['fa', 'trash']" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
