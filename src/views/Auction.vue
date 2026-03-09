<script setup>
import { ref, onMounted, useTemplateRef, watch, nextTick, computed, onUnmounted } from 'vue'
import { useUser } from '@/stores/user';
import { useAuctionStatus } from '@/stores/auctionStatus';
import axios from 'axios'
import confetti from 'canvas-confetti';


import winnerImg from '../assets/winner.png'
import loserImg from '../assets/loser.png'
import secondRoundImg from '../assets/second-round.png'
import noOfferImg from '../assets/no-offer.png'


// --- Stores ---
const { currentUser } = useUser();
const { currentPlayer, setCurrentPlayer, auctionStatus, setAuctionStatus, updateAuctionBestOffer } = useAuctionStatus();

// --- Constants ---
const ROLE_MAP = {
    'P': 'Portiere',
    'D': 'Difensore',
    'C': 'Centrocampista',
    'A': 'Attaccante'
};

// --- State ---
const offerValue = ref(null);
const secondRound = ref(false);
const roundEnded = ref(false);
const isSubmitting = ref(false);
const waitingAuctionResult = ref(false);


// --- Refs ---
const offerFormRef = useTemplateRef("offer-form");
const canvasTimerRef = useTemplateRef("timer-canvas");
const offerInputRef = useTemplateRef("offer-input");

const emit = defineEmits(['auctionStarted', 'auctionClosed'])

const BACKEND_URL = `${import.meta.env.VITE_HTTP_PROTOCOL}://${import.meta.env.VITE_BACKEND_SERVER}`

// --- Computed ---
const minAllowedOffer = computed(() => {
    return (auctionStatus.value?.bestOffer || 0) + 1;
});

const isOfferInvalid = computed(() => {
    return offerValue.value !== null && offerValue.value < minAllowedOffer.value;
});

// --- Canvas & Worker ---
let offscreenCanvas = null;

// Add these new reactive variables
const showResultOverlay = ref(false);
const resultData = ref({
    title: "",
    message: "",
    theme: "",
    img: ""
});


const worker = new Worker(new URL('/src/views/TimerAnimation.js', import.meta.url), { type: 'module' });

// --- Worker Handler ---
worker.onmessage = (e) => {
    if (e.data.timeout === 'timeout') {
        handleTimeout();
    }
};

const handleTimeout = async () => {
    roundEnded.value = true; // Lock UI immediately
    waitingAuctionResult.value = true;
    try {
        const response = await axios.post(`${BACKEND_URL}/offer/timeout`, {
            user_id: currentUser.value.id,
            player_id: currentPlayer.value.id
        });

        if (response.status === 200) {
            if (canvasTimerRef.value) canvasTimerRef.value.hidden = true;
            setAuctionStatus(response.data);
            const status = auctionStatus.value;
            const pName = currentPlayer.value.name;
            showResultOverlay.value = true
            // Logic: Render Result Text
            if (status.auctionClosed) {
                if (status.isPurchaser) {
                    // 1. Set the winning data
                    resultData.value = {
                        title: "COMPLIMENTI!",
                        message: `Ti sei aggiudicato ${pName}!`,
                        theme: "bg-winner",
                        img: winnerImg
                    };
                    // 2. Fire the state-of-the-art Confetti! 🎉
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#FFD700', '#4fd16f', '#ffffff'] // Gold, Green, White
                    });
                } else {
                    // 1. Set the losing data
                    const winner = status.purchaserName || "Nessuno";
                    resultData.value = {
                        title: "PECCATO...",
                        message: status.purchaserName ? `Il fortunato ad aggiudicarsi ${pName} è ${winner}` : `Nessuna offerta per ${pName}`,
                        theme: status.purchaserName ? "bg-loser" : "bg-neutral",
                        img: status.purchaserName ? loserImg : noOfferImg
                    };
                }
                emit('auctionClosed')
            } else {
                // Auction continues (Next Round)
                resultData.value = {
                    title: status.isPurchaser ? "Complimenti!" : "Rimani in attesa!",
                    message: status.isPurchaser ? `Devi partecipare al secondo round per ${pName}` : `In corso il secondo round per  ${pName}`,
                    theme: status.isPurchaser ? "bg-second-round" : "bg-waiting",
                    img: status.isPurchaser ? secondRoundImg : noOfferImg
                };

            }
            waitingAuctionResult.value = false;
        }
    } catch (error) {
        console.error("Timeout Error:", error);
    }
};

// --- Watcher ---
watch(
    () => currentUser.value?.messages,
    (messages) => {
        if (!messages?.length) return;
        const raw = messages[messages.length - 1];
        const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        showResultOverlay.value = false
        if (msg.player) {
            emit('auctionStarted')
            handleNewPlayer(msg.player);
        } else {
            handleSecondRoundUpdate(msg);
        }
    },
    { deep: true }
);

// --- Handlers ---
const handleNewPlayer = async (player) => {
    setCurrentPlayer(player);
    await resetStateForNewAuction();

    worker.postMessage({ type: 'auctionStarted' });

    setAuctionStatus({
        isPurchaser: false,
        purchaserName: null,
        userBudget: currentUser.value.budget,
        bestOffer: null,
        auctionClosed: false
    });
};

const handleSecondRoundUpdate = (msg) => {
    if (msg.bestOffer) {
        updateAuctionBestOffer(msg.bestOffer.amount);
    }

    // Transition UI
    secondRound.value = true;
    roundEnded.value = false;
    if (canvasTimerRef.value) canvasTimerRef.value.hidden = false;
    ;
    const topPadding = 20;
    // Move origin to Top-Center + padding

    worker.postMessage({ type: 'secondRoundUpdate' });
};

const sendOffer = async () => {
    if (!offerFormRef.value.checkValidity()) {
        offerFormRef.value.classList.add('was-validated');
        return;
    }

    isSubmitting.value = true;
    const endpoint = secondRound.value ? '/offer/second_round/save' : '/offer/save';

    try {
        const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
            player_id: currentPlayer.value.id,
            amount: offerValue.value,
            user_id: currentUser.value.id
        });

        if (response.status === 200) {
            offerValue.value = null;
            offerFormRef.value.classList.remove('was-validated');
            await nextTick();
            if (offerInputRef.value) offerInputRef.value.focus();
        }
    } catch (error) {
        console.error("Bid Error:", error);
    } finally {
        isSubmitting.value = false;
    }
};

// --- Helpers ---
const resetStateForNewAuction = async () => {
    await nextTick();
    offerValue.value = null;
    secondRound.value = false;
    roundEnded.value = false;
    if (offerFormRef.value) {
        offerFormRef.value.classList.remove('was-validated');
        offerFormRef.value.reset();
    }
    if (canvasTimerRef.value) canvasTimerRef.value.hidden = false;
};


// --- Lifecycle ---
onMounted(() => {
    if (!offscreenCanvas && canvasTimerRef.value?.transferControlToOffscreen) {
        offscreenCanvas = canvasTimerRef.value.transferControlToOffscreen();
        worker.postMessage({ type: 'init', offscreenCanvas }, [offscreenCanvas]);
    }
});

onUnmounted(() => {
    worker.terminate();
});

// --- Template Helpers ---
const getRoleLabel = (role) => ROLE_MAP[role] || role;
const getPlayerImage = (url) => `https://content.fantacalcio.it${url}?v=420`;

</script>

<template>
    <div class="auction-container col-12 col-lg-6 mx-auto">
        <div class="mt-3 text-center">

            <h2 class="fw-bold mb-4">
                {{ currentPlayer ? `Fai la tua offerta per ${currentPlayer.name}` : "Attendere la scelta del giocatore"
                }}
            </h2>
            <div v-if="currentPlayer" class="card border-0 mb-4">
                <div class="card-body auction-card-body card-box-shadow">

                    <img class="player-img mb-3" :src="getPlayerImage(currentPlayer.img)" alt="Player Image"
                        style="width: 150px; height: 150px; object-fit: contain; background: transparent; box-shadow: none;" />

                    <ul class="list-group list-group-flush mb-4">
                        <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center"
                            style="border-bottom: var(--bs-list-group-border-width) solid #cecece;">
                            <span class="fw-bold text-secondary">Nome</span>
                            <span class="fw-bold">{{ currentPlayer.full_name }}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent"
                            style="border-bottom: var(--bs-list-group-border-width) solid #cecece;">
                            <span class="fw-bold text-secondary">Ruolo</span>
                            <span class="badge bg-secondary">{{ getRoleLabel(currentPlayer.role) }}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent"
                            style="border-bottom: var(--bs-list-group-border-width) solid #cecece;">
                            <span class="fw-bold text-secondary">Squadra</span>
                            <span>{{ currentPlayer.real_team }}</span>
                        </li>
                    </ul>

                    <form v-if="!roundEnded" @submit.prevent="sendOffer" novalidate ref="offer-form"
                        class="needs-validation">

                        <div class="form-outline mb-3">
                            <label for="offer-input" class="form-label fw-bold text-primary">La tua offerta</label>

                            <div class="input-group input-group-lg shadow-sm rounded overflow-hidden">
                                <span class="input-group-text border-end-0">
                                    <img src="../assets/mario-coins.gif" alt="Coin"
                                        style="width: 35px; height: 35px; object-fit: contain;" />
                                </span>

                                <input type="number" id="offer-input" ref="offer-input"
                                    class="form-control border-start-0 ps-2" v-model.number="offerValue"
                                    :min="minAllowedOffer" :placeholder="`Min: ${minAllowedOffer}`" required />
                            </div>
                            <div class="invalid-feedback d-block mt-1" v-if="isOfferInvalid">
                                L'offerta minima è {{ minAllowedOffer }} crediti.
                            </div>
                        </div>

                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg fw-bold shadow-sm"
                                :disabled="isSubmitting">
                                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"
                                    role="status"></span>
                                {{ secondRound ? 'Rilancia!' : 'Invia Offerta' }}
                            </button>
                        </div>
                    </form>
                    <div v-if="waitingAuctionResult"
                        class="alert alert-info d-flex align-items-center justify-content-center">
                        <span class="spinner-border spinner-border-sm me-3"></span>
                        <span>Asta conclusa, attendi i risultati...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex flex-column align-items-center gap-3 mt-4">
        <canvas ref="timer-canvas" width="1000" height="200" style="max-width: 100%; height: auto;"></canvas>
        <Transition name="pop-in">
            <div v-if="showResultOverlay"
                class="result-banner d-flex flex-column justify-content-center card-box-shadow align-items-center text-center p-5 rounded-4 w-100"
                style="max-width: 800px; min-height: 250px;" :class="resultData.theme">

                <img :src="resultData.img" alt="cacca" style="width: 25%; height: auto"></img>

                <h2 class="fw-black text-white mb-2" style="text-transform: uppercase; letter-spacing: 2px;">
                    {{ resultData.title }}
                </h2>
                <p class="fs-4 text-white fw-medium m-0">
                    {{ resultData.message }}
                </p>

            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* 1. Remove the right border of the icon container */
.input-group-text {
    /* Match input background */
    background-color: var(--bs-primary-bg-subtle);
    border-right: none;
}

/* 2. Remove the left border of the input */
.form-control {
    border-left: none;
    box-shadow: none;
    /* Remove default Bootstrap shadow to handle it on the group */
}

/* 3. Make the whole group glow when the input is focused */
.input-group:focus-within {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
    border-color: #86b7fe;
    z-index: 5;
}

/* Optional: Ensure the group border color changes on focus */
.input-group:focus-within .input-group-text,
.input-group:focus-within .form-control {
    border-color: #86b7fe;
}

.input-group-text {
    border-color: #dee2e6;
    /* Standard Bootstrap border color */
}

/* 2. Turn off the default glow on just the input (we will apply it to the group instead) */
.form-control:focus {
    box-shadow: none;
    border-color: #dee2e6;
}

/* 3. THE MAGIC: When the input is focused, apply the Blue Glow to the PARENT group */
.seamless-input-group:focus-within {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    /* Bootstrap Blue Glow */
    border-color: #86b7fe;
    z-index: 5;
}

/* 4. Ensure the outer borders change color together on focus */
.seamless-input-group:focus-within .input-group-text,
.seamless-input-group:focus-within .form-control {
    border-color: #86b7fe;
}

.auction-card-body {
    background-color: #dededea1;
    /* Light grey base (or white) */
    border-radius: 20px;
    /* Rounded corners are key for 3D */

    /* 3. The Bevel Border */
    /* Top/Left is white (lit), Bottom/Right is transparent/dark (shaded) */
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-bottom-color: rgba(0, 0, 0, 0.05);
    border-right-color: rgba(0, 0, 0, 0.05);
}

/* The Overlay Container */
.result-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    backdrop-filter: blur(4px);
    /* Modern frosted glass effect behind it */
}

.card-box-shadow {
    /* 1. The Main 3D Shadow (Bottom Right) */
    /* Darker, wider shadow to simulate height */
    box-shadow:
        20px 20px 15px #bbbbbbea,

        /* 2. The Highlight (Top Left) */
        /* Pure white shadow to simulate light hitting the edge */
        -20px -20px 15px #ffffff;
}

/* Winning Style: Rich Green Gradient */
.bg-winner {
    background: linear-gradient(135deg, rgba(79, 209, 111, 0.95), rgba(40, 167, 69, 0.95));
}

/* Losing Style: Deep Red/Dark Gradient */
.bg-loser {
    background: linear-gradient(135deg, rgb(255, 53, 80), rgb(184, 0, 0));
}

.bg-second-round {
    background: linear-gradient(135deg, #fae039f2, rgba(248, 191, 58, 0.95));
}

/* Waiting Style: Calm Deep Blue Gradient */
/* Used for users who are locked out of the second round and just watching */
.bg-waiting {
    background: linear-gradient(135deg, rgba(54, 162, 235, 0.95), rgba(0, 96, 222, 0.95));
}

.bg-neutral {
    background: linear-gradient(135deg, rgba(108, 117, 125, 0.95), rgba(52, 58, 64, 0.95));
}

/* Vue Transition Animation (The 'pop-in' effect) */
.pop-in-enter-active {
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    /* Bouncy spring effect */
}

.pop-in-leave-active {
    transition: all 0.3s ease-in;
}

.pop-in-enter-from,
.pop-in-leave-to {
    opacity: 0;
    transform: scale(0.5);
}
</style>