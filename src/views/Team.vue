<script setup>
import { useUser } from '@/stores/user';
import router from '@/router';
import axios from 'axios';
import { onMounted, ref, useTemplateRef, watch } from 'vue';

// --- Store & Config ---
const { currentUser, team: storeTeam, players_by_role, noTeam, fetchTeamData } = useUser()
const BACKEND_URL = `${import.meta.env.VITE_HTTP_PROTOCOL}://${import.meta.env.VITE_BACKEND_SERVER}`

// --- Local State ---
const teamNameInput = ref("")
const isSubmitting = ref(false)
const teamFormRef = useTemplateRef("team-form")

// --- Constants ---
// Define the specific order for rendering rows
const roleOrder = ['goalkeepers', 'defenders', 'midfielders', 'strikers'];

// Map roles to specific Bootstrap/Custom colors
const roleColorMap = {
  'P': 'bg-warning text-dark',      // Portiere (Yellow)
  'D': 'bg-success text-white',     // Difensore (Green)
  'C': 'bg-primary text-white',     // Centrocampista (Blue)
  'A': 'bg-danger text-white'       // Attaccante (Red)
};

// --- Lifecycle ---
onMounted(() => {
  fetchTeamData()
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
    });

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

// --- Helpers ---
function getRoleBadgeClass(roleChar) {
  return roleColorMap[roleChar] || 'bg-secondary text-white';
}
</script>

<template>
  <div class="team-container mt-3 text-center">

    <h2 class="fw-bold text-primary-emphasis mb-4">La tua formazione</h2>

    <div v-if="noTeam" class="card shadow-sm p-4">
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

    <div v-else>
      <h3 class="mb-4 fst-italic text-secondary">{{ storeTeam?.name }}</h3>

      <div v-for="categoryKey in roleOrder" :key="categoryKey" class="mb-3">

        <ul class="list-group mb-2" v-for="player in players_by_role[categoryKey]" :key="player.id">
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

      <div v-if="Object.values(players_by_role).flat().length === 0" class="alert alert-info mt-4">
        La tua rosa è ancora vuota. Vai all'asta per acquistare giocatori!
      </div>
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
</style>