<script setup>
import router from '@/router';
import { useUser } from '@/stores/user';
import axios from 'axios';
import { onMounted, ref, useTemplateRef, watch } from 'vue';

const isTeamLoading = ref(true);

// --- Store & Config ---
const { currentUser, team: storeTeam, players_by_role, noTeam, fetchTeamData, defaultUserHeaders } = useUser()
const BACKEND_URL = `${import.meta.env.VITE_HTTP_PROTOCOL}://${import.meta.env.VITE_BACKEND_SERVER}`

// --- Local State ---
const teamNameInput = ref("")
const isSubmitting = ref(false)
const teamFormRef = useTemplateRef("team-form")


// --- Constants ---
// Define the specific order for rendering rows
const roleOrder = ['goalkeepers', 'defenders', 'midfielders', 'strikers'];

// Map roles to specific Bootstrap/Custom colors
const ROLE_COLOR_MAP = {
  'P': 'bg-warning text-dark',      // Portiere (Yellow)
  'D': 'bg-success text-white',     // Difensore (Green)
  'C': 'bg-primary text-white',     // Centrocampista (Blue)
  'A': 'bg-danger text-white'       // Attaccante (Red)
};

const ROLE_MAP = {
  'P': 'Portiere',
  'D': 'Difensore',
  'C': 'Centrocampista',
  'A': 'Attaccante'
};

// 1. Reactive state for the modal
const showModal = ref(false);
const selectedPlayer = ref(null);

// --- Template Helpers ---
const getRoleLabel = (role) => ROLE_MAP[role] || role;


// --- Lifecycle ---
onMounted(async () => {
  isTeamLoading.value = true;
  await fetchTeamData()
  isTeamLoading.value = false;
})

// --- Actions ---
async function createTeam() {
  // 1. Validate Form
  if (!teamFormRef.value.checkValidity()) {
    teamFormRef.value.classList.add('was-validated');
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await axios.post(`${BACKEND_URL}/team`, {
      user_id: currentUser.value.id,
      name: teamNameInput.value
    }, defaultUserHeaders);

    if (response.status === 201) {
      // Refresh data to update the store state
      await fetchTeamData();
      // Clear form
      teamNameInput.value = "";
    }
  } catch (error) {
    console.error("Error creating team:", error);
  } finally {
    isSubmitting.value = false;
  }
}

// --- Watcher ---
watch(
  () => currentUser.value?.messages,
  async (messages) => {
    if (!messages?.length) return;
    const raw = messages[messages.length - 1];
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const redirect_result = await router.push('/auction')
    if (redirect_result) {
      console.log("redirection to aiction failed")
    } else {
      currentUser.value.messages = [msg]
    }
  },
  { deep: true }
)

watch(
  currentUser,
  () => {
    fetchTeamData()
  }
)

// --- Helpers ---
function getRoleBadgeClass(roleChar) {
  return ROLE_COLOR_MAP[roleChar] || 'bg-secondary text-white';
}

// 2. The function triggered by clicking a player
const openPlayerModal = (player) => {
  selectedPlayer.value = player; // Save the clicked player's data
  showModal.value = true;        // Tell the modal to appear
};

// 3. A quick function to close it
const closeModal = () => {
  showModal.value = false;
  selectedPlayer.value = null; // Optional: clear the data when closing
};
</script>

<template>
  <div class="team-container mt-3 text-center">

    <h2 class="fw-bold text-primary-emphasis mb-4">La tua formazione</h2>
    
    <div v-if="isTeamLoading" class="d-flex justify-content-center mt-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento rosa...</span>
      </div>
    </div>
    
    <div v-else-if="noTeam" class="card shadow-sm p-4">
      <form @submit.prevent="createTeam" novalidate ref="team-form">
        <div class="form-outline mb-4">
          <label class="form-label fw-bold" for="name-input">Nome Squadra</label>
          <input type="text" id="name-input" class="form-control form-control-lg text-center" v-model="teamNameInput"
            required maxlength="20" minlength="5" placeholder="Es. Atletico Ma Non Troppo" />
          <div class="invalid-feedback">
            Il nome deve essere tra 5 e 20 caratteri.
          </div>
        </div>

        <div class="d-grid">
          <button type="submit" class="btn btn-primary btn-lg" :disabled="isSubmitting">
            {{ isSubmitting ? 'Salvataggio...' : 'Crea Squadra' }}
          </button>
        </div>
      </form>
    </div>
    
    <div v-else-if="Object.values(players_by_role).flat().length === 0" class="alert alert-info mt-4">
      La tua rosa è ancora vuota. Vai all'asta per acquistare giocatori!
    </div>

    <div v-else>
      <h3 class="mb-4 fst-italic text-secondary">{{ storeTeam?.name }}</h3>

      <div v-for="categoryKey in roleOrder" :key="categoryKey" class="mb-3">

        <ul class="list-group mb-2" v-for="player in players_by_role[categoryKey]" :key="player.id"
          style="cursor: pointer;" @click="openPlayerModal(player)">
          <li
            class="list-group-item d-flex justify-content-between align-items-center p-0 overflow-hidden border-0 shadow-sm mb-1">

            <div class="d-flex align-items-center justify-content-center fw-bold" style="width: 50px; height: 50px;"
              :class="getRoleBadgeClass(player.role)">
              {{ player.role }}
            </div>

            <div class="flex-grow-1 text-start ps-3 fw-bold text-dark">
              {{ player.name }}
            </div>
            <div class="pe-3 fw-bold text-muted">
              {{ player.purchase_cost }} <span class="small">cr</span>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="showModal" class="modal-backdrop-custom" @click.self="closeModal">
        <div class="card premium-laminate-card auction-card-body card-box-shadow border-0 overflow-hidden"
          style="width: 90%; max-width: 400px;" id="player-info-modal">

          <div class="bg-gold position-relative d-flex justify-content-center pt-4 pb-3"
            style="background-color: #FFC000;">

            <button class="btn-close position-absolute top-0 end-0 m-3" @click="closeModal" aria-label="Close"></button>

            <img class="player-img" :src="selectedPlayer.img" alt="Player Image"
              style="width: 150px; height: 150px; object-fit: contain; background: transparent; box-shadow: none;" />
          </div>

          <div class="card-body pearly-body pt-2 pb-4">
            <ul class="list-group list-group-flush mb-0">

              <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center py-3"
                style="border-bottom: var(--bs-list-group-border-width) solid #cecece;">
                <span class="fw-bold text-secondary">Nome</span>
                <span class="fw-bold">{{ selectedPlayer.full_name }}</span>
              </li>

              <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent py-3"
                style="border-bottom: var(--bs-list-group-border-width) solid #cecece;">
                <span class="fw-bold text-secondary">Ruolo</span>
                <span class="badge bg-secondary">{{ getRoleLabel(selectedPlayer.role) }}</span>
              </li>

              <li
                class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-0 py-3">
                <span class="fw-bold text-secondary">Squadra</span>
                <span>{{ selectedPlayer.real_team }}</span>
              </li>

            </ul>
          </div>

        </div>
      </div>

      <!-- <p><strong>Role:</strong> {{ selectedPlayer.role }}</p>
      <p><strong>Cost:</strong> {{ selectedPlayer.purchase_cost }} credits</p> -->

      <!-- <div class="mt-3 text-end">
        <button class="btn btn-secondary" @click="closeModal">Close</button>
      </div> -->
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add some transition or specific list styling */
.list-group-item {
  transition: transform 0.1s ease-in-out;
}

.list-group-item:hover {
  transform: scale(1.01);
}

#player-info-modal li {
  transform: none !important;
}

.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  /* Semi-transparent black */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  /* Keeps it above everything else */
}

.auction-card-body {
  background-color: #dededea1;
  /* Light grey base (or white) */
  border-radius: 20px;
  /* Rounded corners are key for 3D */

  /* 3. The Bevel Border */
  /* Top/Left is white (lit), Bottom/Right is transparent/dark (shaded) */
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-bottom-color: rgba(0, 0, 0, 0.05);
  border-right-color: rgba(0, 0, 0, 0.05);
}

/* The Solid Gold Header */
.bg-gold {
  background-color: #FFD700;
}

/* The Pearly White Body */
.pearly-body {
  /* A radial gradient gives that soft, off-white shimmering pearl effect */
  background: radial-gradient(circle at top left, #ffffff 0%, #fdfcfb 40%, #e2dfdc 100%);
}

/* THE MAGIC: The Laminated Gloss Overlay over the entire card */
.premium-laminate-card {
  position: relative;
}

.premium-laminate-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  /* The New Gradient: Bright top, clear middle, subtle bottom */
  background-image: linear-gradient(135deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 20%,
      /* Strong reflection over the gold image section */
      rgba(255, 255, 255, 0) 40%,
      /* Fades to fully transparent before the text starts */
      rgba(255, 255, 255, 0) 75%,
      /* Stays fully transparent over the list items */
      rgba(255, 255, 255, 0.15) 90%,
      /* A tiny, soft glint at the bottom right corner */
      rgba(255, 255, 255, 0) 100%);

  /* CRITICAL: This allows the user to click "through" the gloss to hit the close button */
  pointer-events: none;
  z-index: 5;
  /* Puts the shine over the backgrounds, but we kept the text/buttons higher */
}
</style>