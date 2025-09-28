<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, watch } from "vue";

// Props
const props = defineProps({
  state: {
    type: Object,
    default: () => ({}),
  },
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

// Save function
function saveState() {
  emit("save", { ...localState });
}

function deleteState() {
  emit("delete");
}
</script>

<template>
  <div class="d-flex flex-column justify-content-between w-100 flex-grow-1">
    <div v-if="props.state" class="d-flex flex-column gap-2 rounded">
      <div class="fs-5 fw-bold text-black">
        <FontAwesomeIcon :icon="['fa', 'circle-notch']" /> Stanje
      </div>

      <hr class="mb-2"></hr>

      <div class="mb-2">
        <label class="form-label">Ime stanja</label>
        <input
          class="form-control"
          v-model="localState.label"
          placeholder="Vnesi ime stanja"
        />
        <!--div id="emailHelp" class="form-text">
          We'll never share your email with anyone else.
        </div-->
      </div>

      <div class="form-check">
        <input
          type="checkbox"
          class="form-check-input"
          v-model="localState.isStart"
        />
        <label class="form-check-label" for="exampleCheck1"
          > Začetno stanje</label
        >
      </div>
    </div>
    <div class="d-flex gap-2">
      <button
        class="btn btn-primary mt-2 flex-grow-1 text-white"
        @click="saveState"
        :disabled="JSON.stringify(localState) === JSON.stringify(props.state)"
      >
        Shrani
      </button>
      <button class="btn btn-danger mt-2 fit-content" @click="deleteState">
        <FontAwesomeIcon :icon="['fa', 'trash']" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
