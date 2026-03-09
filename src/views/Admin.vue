<script setup>
import { ref, useTemplateRef, onMounted, nextTick, watch, computed } from 'vue'
import { useUser } from '@/stores/user';
import axios from 'axios'
import { Modal } from 'bootstrap'

// --- Store ---
const { currentUser } = useUser();

// --- Reactive State ---
const playerList = ref([])
const playerInputText = ref("") // Matches the input field
const selectedPlayerId = ref(null) // Stores the ID separately
const filterRole = ref(["P", "D", "C", "A"])
const showListFlag = ref(false)
const isSecondRound = ref(false) // Controls button text/logic
const isSending = ref(false)
const isClickable = ref(true)

// --- Refs ---
const playerFormRef = useTemplateRef('player-form')
let noEligiblePlayerModal = null
const BACKEND_URL = `${import.meta.env.VITE_HTTP_PROTOCOL}://${import.meta.env.VITE_BACKEND_SERVER}`

// --- Computed Properties ---
// 1. Efficient Filtering: Updates automatically when input or checkboxes change
const filteredPlayers = computed(() => {
  const search = playerInputText.value.toLowerCase().trim();
  
  return playerList.value.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(search);
    const roleMatch = filterRole.value.includes(p.role);
    return nameMatch && roleMatch;
  });
});

// 2. Button Text based on state
const buttonLabel = computed(() => {
  if (!isClickable.value && isSending.value) return "Sending...";
  else if(!isClickable.value && !isSending.value) return "Wait for the round to close";
  return isSecondRound.value ? "Start Second Round" : "Start Auction";
});

// --- Methods ---

const selectPlayer = (player) => {
  playerInputText.value = player.name; // Show name in input
  selectedPlayerId.value = player.id; // Store ID for backend
  showListFlag.value = false; // Hide dropdown
  console.log('Selected:', player.name, player.id);
}

const onAllRoleChange = (event) => {
  filterRole.value = event.target.checked ? ["P", "D", "C", "A"] : [];
}

// Open list when typing or focusing
const handleInputFocus = async () => {
  showListFlag.value = true;
}

const startAuction = async (event) => {
  // 1. Validation
  if (!playerFormRef.value.checkValidity() || !selectedPlayerId.value) {
    event.preventDefault();
    event.stopPropagation();
    playerFormRef.value.classList.add('was-validated');
    return;
  }
  isClickable.value = false;
  // 2. Determine Endpoint based on state
  const endpoint = isSecondRound.value ? '/admin/notify_second_round' : '/admin/notify';

  try {
    isSending.value = true
    const response = await axios.post(`${BACKEND_URL}${endpoint}`, selectedPlayerId.value, {
      headers: { 'Content-Type': 'text/plain' }
    });
    isSending.value = false
    if (response.status === 200) {
      // Logic: If standard auction, check eligibility
      if (!isSecondRound.value && !response.data.eligible) {
        noEligiblePlayerModal.show();
        isClickable.value = true;
      } else {
        // Success: Disable button briefly or handle UI state
        
      }
    }
  } catch (error) {
    console.error("Auction Error:", error);
  } 
}
//TODO controllare attivazione e disattivazione bottoni
// --- Watcher ---
watch(
  () => currentUser.value?.messages,
  async (messages) => {
    if (!messages || messages.length === 0) return;

    const raw = messages[messages.length - 1];
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if ('auctionClosed' in msg) {
      // Update logic based on closed status
      if (msg.auctionClosed) {
        isSecondRound.value = false; // Reset to standard auction
      } else {
        isSecondRound.value = true; // Switch to second round mode
      }
      await nextTick();
      isClickable.value = true; // Re-enable button
    }
  },
  { deep: true }
);

const handleBlur = () => {
  // We need window.setTimeout or just setTimeout (it works inside script)
  setTimeout(() => {
    showListFlag.value = false;
  }, 200);
}

// --- Lifecycle ---
onMounted(() => {
  axios.get(`${BACKEND_URL}/players`)
    .then(response => playerList.value = response.data)
    .catch(error => console.error(error));

  noEligiblePlayerModal = Modal.getOrCreateInstance('#no-eligible-player-modal');
});
</script>

<template>
  <div class="col-5">
    <div class="mt-3 text-center">
      <h2 class="fw-bold text-primary-emphasis header">Player</h2>
      
      <div class="d-flex bg-dark text-light rounded mb-2 ps-2">
        <div class="form-check me-2" v-for="role in ['P', 'D', 'C', 'A']" :key="role">
          <input class="form-check-input" type="checkbox" :value="role" :id="role" v-model="filterRole">
          <label class="form-check-label" :for="role">
            {{ role === 'P' ? 'Portiere' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti' }}
          </label>
        </div>
        <div class="form-check me-2">
          <input class="form-check-input" type="checkbox" id="all_roles" @change="onAllRoleChange" checked>
          <label class="form-check-label" for="all_roles">All</label>
        </div>
      </div>

      <form @submit.prevent="startAuction" novalidate ref="player-form">
        
        <div data-mdb-input-init class="form-outline position-relative">
          <input 
            type="text" 
            id="player-input" 
            class="form-control" 
            v-model="playerInputText" 
            @focus="handleInputFocus"
            @blur="handleBlur" 
            required 
            autocomplete="off"
            placeholder="Search player..."
          />
          
          <ul v-if="showListFlag && filteredPlayers.length > 0" 
              class="list-group position-absolute w-100" 
              style="z-index: 1000; max-height: 300px; overflow-y: auto;">
            <li 
              v-for="player in filteredPlayers" 
              :key="player.id"
              class="list-group-item list-group-item-action cursor-pointer" 
              @mousedown.prevent="selectPlayer(player)">
              {{ player.name }} ({{ player.role }}) - {{ player.real_team }}
            </li>
          </ul>
        </div>

        <div class="d-grid mt-4">
          <button 
            type="submit" 
            class="btn btn-primary mb-4" 
            :disabled="!isClickable"
            :class="{ 'btn-warning': isSecondRound }">
            {{ buttonLabel }}
          </button>
        </div>

      </form>

      <div class="modal" tabindex="-1" id="no-eligible-player-modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title">Attenzione!</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>{{ playerInputText }} è già stato acquistato.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>