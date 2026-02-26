<!-- <script setup>
import { ref, useTemplateRef} from 'vue'
import axios from 'axios'
const email = ref('')
const password = ref('')
const loginForm = useTemplateRef('regiter-form')

function validation(event) {
    if (!loginForm.value.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }else{
      axios.post('http://127.0.0.1:8000/register', {
                email: email.value,
                password: password.value
            })
            .then(response => {
                submitBtn.value.classList.toggle('disabled')
                const error = response.data.error_code
                if (error == 0) {
                    showSucc.value = true
                } else {
                    showFail.value = true
                }
            })
            .catch(error => console.log(error))
    }
    loginForm.value.classList.add('was-validated');
}

</script> -->

<!-- Section: Design Block -->
<!-- <template>
  <div class="text-center mt-5">
    <h2 class="fw-bold mb-5 text-primary-emphasis">Sign up now</h2>
    <form class="needs-validation" @submit.prevent="validation" method="post" novalidate ref="regiter-form"> -->
      <!-- 2 column grid layout with text inputs for the first and last names -->

      <!-- Email input -->
      <!-- <div class="form-outline mb-4">
        <input type="email" id="email" value="email" class="form-control" v-model="email" required/>
        <label class="form-label" for="email">Email address</label>
      </div> -->

      <!-- Password input -->
      <!-- <div class="form-outline mb-4">
        <input type="password" id="password" value="password" class="form-control" v-model="password" required/>
        <label class="form-label" for="password">Password</label>
      </div> -->
      <!-- Submit button -->
        <!-- <button type="submit" class="btn btn-primary btn-block mb-4">
          Sign up
        </button>
    </form>
  </div>
</template> -->
<!-- Section: Design Block -->