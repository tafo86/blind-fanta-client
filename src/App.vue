<template>
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center vh-100">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
    <div  v-else>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>
<script setup>
import { useAuth0 } from '@auth0/auth0-vue';

// Pull the isLoading variable directly from the Auth0 SDK
const { isLoading } = useAuth0();
</script>
<style scoped></style>
