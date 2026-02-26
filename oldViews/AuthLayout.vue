<script setup>

import { useRouter } from 'vue-router';
import Login from '../../oldViews/Login.vue';
const emit = defineEmits(['authenticated'])

const router = useRouter()

function forwardAuthenticatedEvent() {
  emit('authenticated')
}

function goToLoginPage() {
  router.push('/login')
}

</script>


<template>
  <div class="row d-flex justify-content-center">
    <div class="col-5">
      <h1 class="text-center">Fanta Ultimo Anno</h1>
      <h3 class="text-center">Il fantacalcio dei sionisti</h3>
      <!-- <router-view v-slot="{ Component }">
        <component :is="Component" @authenticated="forwardAuthenticatedEvent" @registered="goToLoginPage" />
      </router-view> -->
      <Login/>
    </div>
  </div>
</template>
<style scoped></style>