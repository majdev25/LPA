<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, watch } from "vue";
import procesImg from "./proces.png";

// Props
const props = defineProps({
  proces: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(["save"]);

// Reactive local copy
const localProces = reactive({ ...props.proces });

// watch for prop changes
watch(
  () => props.proces,
  (newProces) => {
    Object.assign(localProces, newProces);
  },
  { deep: true }
);

// Save function
function saveProces() {
  emit("save", { ...localProces });
}

function deleteProces() {
  emit("delete");
}

async function openProces(){
  const result = await window.api.invoke("open-proces", {
      proces_id: localProces.id,
    });
}

</script>

<template>
  <div class="d-flex flex-column justify-content-between w-100 flex-grow-1">
    <div v-if="props.proces" class="d-flex flex-column gap-2 rounded">
      <div class="fs-5 fw-bold text-black d-flex align-items-center">
         <img :src="procesImg" height="25px" class="me-1"></img>
         <div style="margin-top: 2px;">Proces</div>
      </div>

      <hr class="mb-2"></hr>

      <div class="mb-2">
        <label class="form-label">Ime procesa</label>
        <input
          class="form-control"
          v-model="localProces.label"
          placeholder="Vnesi ime procesa"
        />
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-primary mt-2 flex-grow-1 text-white"
          @click="openProces"
        >
          Odpri proces
        </button>
      </div>

    </div>
    <div class="d-flex gap-2">
      <button
        class="btn btn-primary mt-2 flex-grow-1 text-white"
        @click="saveProces"
        :disabled="JSON.stringify(localProces) === JSON.stringify(props.proces)"
      >
        Shrani
      </button>
      <button class="btn btn-danger mt-2 fit-content" @click="deleteProces">
        <FontAwesomeIcon :icon="['fa', 'trash']" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
