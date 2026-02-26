<script setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import axios from 'axios'
import FailAlert from './FailAlert.vue'
import SuccessAlert from './SuccessAlert.vue'
const demos = ref()
const demoSelected = ref(1)
const showFail = ref(false)
const showSucc = ref(false)

const startBtn = useTemplateRef("start")
const stopBtn = useTemplateRef("stop")
const emit = defineEmits('validate')

const startDemo = () => {
    emit('validate')
    if (obu_id.value.length == 15) {
        showSucc.value = false
        showFail.value = false
        toggleBtnsStatus()
        axios
            .post('http://127.0.0.1:5000/start-demo', {
                obu_id: obu_id.value,
                demo_id: demoSelected.value,
            })
            .then(response => {
                toggleBtnsStatus()
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
const stopDemo = () => {
    showSucc.value = false
    showFail.value = false
    toggleBtnsStatus()
    axios
        .post('http://127.0.0.1:5000/stop-demo', {
            obu_id: obu_id.value
        })
        .then(response => {
            toggleBtnsStatus()
            const error = response.data.error_code
            if (error == 0) {
                showSucc.value = true
            } else {
                showFail.value = true
            }
        })
        .catch(error => console.log(error))
}

onMounted(() => {
    axios
        .get('http://127.0.0.1:5000/demos')
        .then(response => (demos.value = response.data.demos))
        .catch(error => console.log(error))
})

function toggleBtnsStatus() {
    startBtn.value.classList.toggle('disabled')
    stopBtn.value.classList.toggle('disabled')
}
</script>

<template>
    <div class="mb-3">
        <label class="form-label fw-bold" for="config_type">Select Demo</label>
        <select class="form-select" aria-label="Default select example" v-model="demoSelected">
            <option v-for="demo in demos" :value="demo.id">{{ demo.name }} </option>
        </select>
    </div>
    <div class="mb-3">
        <button type="button" class="btn btn-outline-primary me-3" @click="startDemo" ref="start">Start</button>
        <button type="button" class="btn btn-outline-primary" @click="stopDemo" ref="stop">Stop</button>
    </div>
    <SuccessAlert :show="showSucc" />
    <FailAlert :show="showFail" />
</template>