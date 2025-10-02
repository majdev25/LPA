<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed, reactive, watch, onMounted, defineEmits } from "vue";

// Props
const props = defineProps({
  event: {
    type: Object,
    default: () => ({}),
  },
  systemGraph: {
    type: Object,
    default: () => ({}),
  },
  _procId: {
    type: String,
    default: null
  }
});

onMounted(() => {
  updateIzvorPonor();
  saveEvent();
});

// Reactive local copy
const localEvent = reactive({ ...props.event });

const fromProceses = computed(() => {
  if (!props.systemGraph) return [];

  var connected = []
  if(props.systemGraph.channels){

    connected = props.systemGraph.channels
    .map(x => {
      if (x.proces1.id === props._procId) {
        return { 
          id: x.proces2.id, 
          label: props.systemGraph.processes.find(proc => proc.id === x.proces2.id)?.label 
        };
      } else if (x.proces2.id === props._procId) {
        return { 
          id: x.proces1.id, 
          label: props.systemGraph.processes.find(proc => proc.id === x.proces1.id)?.label 
        };
      }
      return undefined;
    })
    .filter(Boolean); // remove undefined
  }

  console.log(props.systemGraph);
  console.log(props.systemGraph.processes);
  // add myself
  const self = props.systemGraph.processes.find(proc => proc.id === props._procId);
  if (self) connected.push({ id: self.id, label: self.label });

  connected.sort((a, b) => {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
});

  return connected;
});

const toProceses = computed(() => {
  if (!props.systemGraph) return [];

  var connected = []
  if(props.systemGraph.channels){

    connected = props.systemGraph.channels
      .map(x => {
        if (x.proces1.id === props._procId) {
          return { 
            id: x.proces2.id, 
            label: props.systemGraph.processes.find(proc => proc.id === x.proces2.id)?.label 
          };
        } else if (x.proces2.id === props._procId) {
          return { 
            id: x.proces1.id, 
            label: props.systemGraph.processes.find(proc => proc.id === x.proces1.id)?.label 
          };
        }
        return undefined;
      })
      .filter(Boolean); // remove undefined
  }

  // add myself
  const self = props.systemGraph.processes.find(proc => proc.id === props._procId);
  if (self) connected.push({ id: self.id, label: self.label });

  connected.sort((a, b) => {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
});

  return connected;
});

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


const emit = defineEmits(["save", "delete"]);

// Save function
function saveEvent() {
  emit("save", { ...localEvent });
}

function deleteEvent() {
  emit("delete");
}

function updateIzvorPonor() {
  console.log("Making izvor ponor")
  const self = props.systemGraph.processes.find(x => x.id == props._procId);
  if (!self) return;

  let fromProcessId = null;
  let toProcessId = null;

  if (localEvent.type === "spr") {
    const from = fromProceses.value.find(p => p.id !== self.id) || self;
    fromProcessId = from.id;
    toProcessId = self.id;
  } else if (localEvent.type === "odd") {
    const to = toProceses.value.find(p => p.id !== self.id) || self;
    fromProcessId = self.id;
    toProcessId = to.id;
  } else if (localEvent.type === "lok") {
    fromProcessId = self.id;
    toProcessId = self.id;
  }

  localEvent.from_process = fromProcessId;
  localEvent.to_process = toProcessId;

  // Find a channel connecting these processes
  const channel = props.systemGraph.channels.find(
    (c) =>
      (c.proces1.id === fromProcessId && c.proces2.id === toProcessId) ||
      (c.proces1.id === toProcessId && c.proces2.id === fromProcessId)
  );

  if (channel) {
    localEvent.channel_id = channel.id;
    console.log("Channel added")
  } else {
    console.warn(
      `No channel found connecting ${fromProcessId} -> ${toProcessId}`
    );
    localEvent.channel_id = null;
  }
}
</script>

<template>
{{ event }}
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
      <option value="tra">Transparentni</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Izvorni proces</label>
    <select class="form-select" v-model="localEvent.from_process" :disabled="localEvent.type == 'odd' || localEvent.type == 'lok'">
      <option :value="p.id" v-for="p in fromProceses">{{ p.label }}</option>
    </select>
    </div>

    <div class="mb-2">
      <label class="form-label">Ponorni proces</label>
    <select class="form-select" v-model="localEvent.to_process" :disabled="localEvent.type == 'spr' || localEvent.type == 'lok'">
      <option :value="p.id" v-for="p in toProceses">{{ p.label }}</option>
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
