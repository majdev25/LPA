<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, watch } from "vue";

// Props
const props = defineProps({
  channel: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(["save"]);


// Proper deep clone helper
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Independent reactive copy
const localChannel = reactive(clone(props.channel));

// watch for prop changes
watch(
  () => props.channel,
  (newChannel) => {
    Object.assign(localChannel, newChannel);
  },
  { deep: true }
);

watch(
  () => localChannel.type,
  (newOther) => {
  },
);

// Save function
function saveChannel() {
  emit("save", { ...localChannel });
}

function deleteChannel() {
  emit("delete");
}
</script>

<template>
  <div class="d-flex flex-column justify-content-between w-100 flex-grow-1">
    <div v-if="props.channel" class="d-flex flex-column gap-2 rounded">
      <div class="fs-5 fw-bold text-black">
        <FontAwesomeIcon :icon="['fa', 'bullhorn']" /> Kanal
      </div>

      <hr class="mb-2"></hr>

      <div class="mb-2">
        <label class="form-label">Dolžina vrste {{ localChannel.proces1.id }}</label>
        <input
          class="form-control"
          v-model="localChannel.proces1.q_length"
          placeholder="Vnesi ime stanja"
        />
      </div>
      <div class="mb-2">
        <label class="form-label">Dolžina vrste {{ localChannel.proces2.id }}</label>
        <input
          class="form-control"
          v-model="localChannel.proces2.q_length"
          placeholder="Vnesi ime stanja"
        />
      </div>
      

    </div>
    <div class="d-flex gap-2">
      <button
        class="btn btn-primary mt-2 flex-grow-1 text-white"
        @click="saveChannel"
        :disabled="JSON.stringify(localChannel) === JSON.stringify(props.channel)"
      >
        Shrani
      </button>
      <button class="btn btn-danger mt-2 fit-content" @click="deleteChannel">
        <FontAwesomeIcon :icon="['fa', 'trash']" />
      </button>
    </div>
  </div>
</template>

<style scoped></style>
