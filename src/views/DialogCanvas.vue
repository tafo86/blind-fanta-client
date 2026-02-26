<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUser } from '@/stores/user';
import axios from 'axios'
const { currentUser, userSocket } = useUser();
import { useAuctionStatus } from '@/stores/auctionStatus';
const { currentPlayer, auctionStatus, setAuctionStatus } = useAuctionStatus();
let endAuction = ref(false)
const emit = defineEmits(['secondRoundEvent', 'auctionEnded', 'auctionStarted'])
let offscreenCanvas
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const canvasRef = ref(null);

defineOptions({
    name: 'DialogCanvas'
});

const worker = new Worker(new URL('./TimerAnimation.js', import.meta.url), { type: 'module' })

worker.onmessage = (e) => {
    axios.post(`${BACKEND_URL}/offer/timeout`, { user_id: currentUser.value.id, player_id: currentPlayer.value.id })
        .then(response => {
            if (response.status == 200) {
                setAuctionStatus(response.data)
                if (response.data.auctionClosed) {
                    worker.postMessage({
                        type: 'auctionEnded',
                        auctionResult: response.data,
                        playerName: currentPlayer.value.name
                    });
                    if (response.data.isPurchaser) {
                        emit('updateBudget', response.data.userBudget)
                    }
                    endAuction.value = true
                    emit('auctionEnded')
                } else {
                    worker.postMessage({
                        type: 'secondRound', auctionResult: response.data,
                        playerName: currentPlayer.value.name
                    });
                    emit('secondRoundEvent')
                }
            }
        })
        .catch(error => console.log(error))
};

watch(currentUser.value?.messages, async (messages) => {
    if (messages.length > 0 && ('player' in messages[0])) {
        worker.postMessage({
            type: 'auctionStarted'
        });
        endAuction.value = false
        emit('auctionStarted')
    }
}
)

onMounted(() => {
    if (canvasRef.value) {
        const offscreenCanvas = canvasRef.value.transferControlToOffscreen();
        worker.postMessage({
            type: 'init',
            offscreenCanvas: offscreenCanvas
        }, [offscreenCanvas]);
    }
})


</script>
<template>
    <div class="d-flex justify-content-center"><canvas ref="canvasRef" class="auction-canvas"
            :class="{ 'canvas-timer': !endAuction, 'canvas-result': endAuction }"></canvas></div>
</template>