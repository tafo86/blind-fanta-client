<!-- <script setup>
import { ref, useTemplateRef, inject } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue';
import axios from 'axios'
const email = ref('')
const password = ref('')
const loginForm = useTemplateRef('login-form')
import { RouterLink } from 'vue-router';
const { loginWithRedirect, isLoading, logout } = useAuth0()
const emit = defineEmits(['authenticated'])

function validation(event) {
  if (!loginForm.value.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
  } else {
    axios.post('http://127.0.0.1:8000/user/login', {
      email: email.value,
      password: password.value
    })
      .then(response => {
        const status = response.status
        if (status == 200) {
          setCurrentUser(response.data)
          emit('authenticated')
        } else {
          // showFail.value = true
        }
      })
      .catch(error => console.log(error))
  }
  loginForm.value.classList.add('was-validated');
}

const setCurrentUser = inject('setCurrentUser');



const handleLogin = () => {
  loginWithRedirect({
      appState: {
      target: "/auction" // Save the current path
    }
    })
}

const handleLogout = () => {
  logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  })
}
  

</script> -->


<!-- <template>
  <div class="text-center mt-5">
    <h2 class="fw-bold mb-5 text-primary-emphasis">Login</h2>
    <form @submit.prevent="validation" method="post" novalidate ref="login-form"> -->
      <!-- Email input -->
      <!-- <div data-mdb-input-init class="form-outline mb-4">
        <input type="email" id="email" class="form-control" v-model="email" required />
        <label class="form-label" for="email">Email address</label>
      </div> -->
      <!-- Password input -->
      <!-- <div data-mdb-input-init class="form-outline mb-4">
        <input type="password" id="password" class="form-control" v-model="password" required />
        <label class="form-label" for="password">Password</label>
      </div> -->

      <!-- 2 column grid layout for inline styling -->
      <!-- <div class="row mb-4">
        <div class="col d-flex justify-content-center"> -->
          <!-- Checkbox -->
          <!-- <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="form2Example31" checked />
            <label class="form-check-label" for="form2Example31"> Remember me </label>
          </div>
        </div>

        <div class="col"> -->
          <!-- Simple link -->
          <!-- <a href="#!">Forgot password?</a>
        </div>
      </div> -->

      <!-- Register buttons -->
      <!-- <div class="text-center">
        <p>Not a member? <router-link to="/register">Register</router-link></p>
      </div>
    </form>
    <div class="d-grid">
        <button class="btn btn-primary mb-4" @click="handleLogin">Sign in</button>
      </div>
         <div class="d-grid">
        <button class="btn btn-primary mb-4" @click="handleLogout">Log out</button>
      </div>
  </div>
</template> -->