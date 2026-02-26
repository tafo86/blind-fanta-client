<script setup>
const props = defineProps({
    show: {
        type: Boolean,
        deafult: false
    }
})

const close = () => {
    document.getElementById("fail-alert").classList.add("d-none")
}

</script>
<template>
    <div v-if="show" class="alert alert-danger d-flex justify-content-between" role="alert" id="fail-alert">
        A problem occurred! The message did not reach obu
        <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
    </div>
</template>