<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'
import ServicesForm from './ServicesForm.vue'
import DemoForm from './DemoForm.vue'
const offer = ref('')
const player_name = 'Kaka'

const offer_input = useTemplateRef("offer_input")

function isNumericKey(evt) {
    if (evt.ctrlKey && evt.keyCode != 67 && event.ctrlKey && evt.keyCode != 86 && event.ctrlKey && evt.keyCode != 90) {
        evt.returnValue = false;
    }
    if (!event.ctrlKey) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode != 46 && charCode > 31
            && (charCode < 48 || charCode > 57)
            && (charCode < 96 || charCode > 111)) {
            evt.returnValue = false;
        }
    }
}

function validation() {
    if (offer.value.length < 4) {
        offer_input.value.classList.add("is-valid")
        offer_input.value.classList.remove("is-invalid")
    } else {
        offer_input.value.classList.add("is-invalid")
        offer_input.value.classList.remove("is-valid")
    }
}

const sendCredential = (email, passoword) => {
    emit('validate')
    if (offer.value.length < 4) {
        showSucc.value = false
        showFail.value = false
        submitBtn.value.classList.toggle('disabled')
        const sel = document.getElementById("select-service")
        const serviceName = sel.options[sel.selectedIndex].text
        axios
            .post('http://127.0.0.1:5000/send-offer', {
                player_id: player_id.value,
                offer: offer.value,
                //TODO capire come fare
                user_id: serviceName,
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
    offer_input.value.addEventListener("keydown", isNumericKey)
})
</script>

<template>
    <form method="post" id="offer_form" action="/send" class="form border border-secondary rounded p-3 mt-5">
        <div>
            <div class="row g-1 align-items-center">
                <div class="mb-2 col-auto">
                    <label class="fw-bold me-2 col-form-label" for="palyer">PLAYER:</label>
                </div>
                <div class="mb-2 col-auto">
                    <input type="text" readonly class="form-control-plaintext" id="player" value="aa">
                </div>
            </div>
            <div class="row g-1 align-items-center">
                <div class="mb-1 col-auto">
                    <label class="form-label fw-bold me-2" for="offer">OFFER:</label>
                </div>
                <div class="mb-1 col-auto">
                    <input type="text" id="offer" name="offer" class="form-control"  style="width:80px;" maxlength="4" v-model="offer"
                    placeholder="$" ref="offer_input" />
                </div>
            <div>
                    <button type="button" class="btn btn-outline-primary mt-3" style="width:60%;"  @click.prevent="sendConf"
                        ref="submit">Send</button>
                </div>
            </div>
            <SuccessAlert :show="showSucc" />
            <FailAlert :show="showFail" />
        </div>
    </form>
</template>
