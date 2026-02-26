<script setup>
import { onMounted, ref, useTemplateRef,defineEmits} from 'vue'
import axios from 'axios'
import FailAlert from './FailAlert.vue'
import SuccessAlert from './SuccessAlert.vue'
const services = ref()
const serviceSelected = ref(1)
const status = ref(true)
const showFail = ref(false)
const showSucc = ref(false)

const submitBtn = useTemplateRef('submit')
const emit = defineEmits('validate')

const sendConf = () => {
    emit('validate')
    if (obu_id.value.length == 15) {
        showSucc.value = false
        showFail.value = false
        submitBtn.value.classList.toggle('disabled')
        const sel = document.getElementById("select-service")
        const serviceName = sel.options[sel.selectedIndex].text
        axios
            .post('http://127.0.0.1:5000/send-activation', {
                obu_id: obu_id.value,
                service_id: serviceSelected.value,
                service_name: serviceName,
                status: status.value
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


}

onMounted(() => {
    axios
        .get('http://127.0.0.1:5000/services')
        .then(response => (services.value = response.data.services))
        .catch(error => console.log(error));
}
)
</script>


<template>
    <div class="mb-3">
        <label class="form-label fw-bold" for="config_type">Select a service</label>
        <select class="form-select" aria-label="Default select example" v-model="serviceSelected" id="select-service">
            <option v-for="service in services" :value="service.id">{{ service.name }} </option>
        </select>
    </div>
    <div class="mb-3 d-flex justify-content-start">
        <div class="form-check me-3">
            <input class="form-check-input" type="radio" name="serviceStatus" id="activeService" checked
                v-model="status">
            <label class="form-check-label" for="activeService">
                Active
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="serviceStatus" id="deactiveService" v-model="status">
            <label class="form-check-label" for="deactiveService">
                Deactive
            </label>
        </div>
    </div>
    <div class="mb-3">
        <button type="button" class="btn btn-outline-primary" @click.prevent="sendConf" ref="submit">Send</button>
    </div>
    <SuccessAlert :show="showSucc" />
    <FailAlert :show="showFail" />
</template>
