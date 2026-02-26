<script setup>
import { useUser } from '@/stores/user';
import { useAuth0 } from '@auth0/auth0-vue';
import { ref, watch } from 'vue';
// added only for not view warning
const budget = ref(null)
const isAuctionInProgress = ref(false)
const { currentUser, setCurrentUser, clearUser } = useUser();
const { loginWithRedirect, isAuthenticated, user, logout } = useAuth0();


// onBeforeMount(() => {
//   currentUser.value = getCurrentUser()
//   console.log(user)
//   // budget.value = currentUser.value.budget
//   console.log("eeee")
// })

const updateBudget = function (newBudget) {
  budget.value = newBudget
}

const handleAutoLogin = () => {
  loginWithRedirect({
    appState: {
      // window.location.pathname captures the current route (e.g., /auction/12)
      target: window.location.pathname
    }
  });
};


const handleLogOut = () => {
  logout({ returnTo: window.location.origin })
  clearUser()
}

watch([isAuthenticated, user], async ([loggedIn, userAuthData]) => {
  // The Auth0 Action has already finished by now
  // So we just fetch the data from our own DB
  if (loggedIn) {
    if (userAuthData.sub) {
      console.log("Syncing user to database:", userAuthData.sub);
      try {
        if (userAuthData.sub) {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/${userAuthData.sub}`);
          const userData = await response.json();
          setCurrentUser(userData)
        }
      } catch (error) {
        console.error("❌ Sync failed:", error);
      }
    }
  }
})

</script>


<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Fantacalcio</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown"
        aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNavDropdown">
        <ul class="navbar-nav">
          <li class="nav-item me-3">
            <router-link v-if="!isAuctionInProgress" to="/team" class="nav-link">Formazione</router-link>
          </li>
          <li class="nav-item me-3">
            <router-link to="/auction" class="nav-link">Asta</router-link>
          </li>
          <li class="nav-item me-3">
            <router-link to="/admin" class="nav-link">Admin</router-link>
          </li>
        </ul>
      </div>
      <div class="d-flex justify-content-end">
        <ul v-if="isAuthenticated" class="navbar-nav">
          <li v-if="!currentUser?.isAdmin" class="nav-item me-3">
            <span class="nav-link text-light mx-auto">Budget: {{ currentUser?.budget }}</span>
          </li>
          <li class="nav-item me-3">
            <router-link to="#" class="nav-link" @click.prevent="handleLogOut">Log Out</router-link>
          </li>
        </ul>
        <ul class="navbar-nav" v-else>
          <li class="nav-item me-3">
            <router-link to="#" class="nav-link" @click.prevent="handleAutoLogin">Log In</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <div class="container">
    <div class="row justify-content-center">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['Auction']">
          <component v-if="Component" :is="Component" @auction-started="isAuctionInProgress=true" @auction-closed="isAuctionInProgress=false"/>
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>