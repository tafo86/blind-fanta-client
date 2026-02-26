<script setup>
const props = defineProps({
    show: {
        type:Boolean,
        deafult: false
    }
})

const close = ()=>{
    document.getElementById("success-alert").classList.add("d-none")
}

</script>
<template>
<div v-if="show" class="alert alert-success d-flex justify-content-between" role="alert" id="success-alert">
    The message reached obu!
    <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
</div>
</template>