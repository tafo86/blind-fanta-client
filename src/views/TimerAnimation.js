// --- Configuration ---
const COUNTDOWN_DURATION = 1000; // seconds
const COUNTDOWN_DURATION_SECOND_ROUND = 10;
const FONT_STYLE = 'bold 40px "Segoe UI", sans-serif';
const TEXT_COLOR = "#0a58ca";

// --- State ---
let ctx = null;
let offscreenCanvas = null;
let animationFrameId = null;
let targetEndTime = 0; // The timestamp when the timer should stop

// --- Message Handler ---
self.onmessage = (e) => {
  const { type, offscreenCanvas: canvas } = e.data;

  switch (type) {
    case "init":
      if (canvas) {
        offscreenCanvas = canvas;
        ctx = offscreenCanvas.getContext("2d");
        setupContextStyles();
      }
      break;

    case "auctionStarted":
      setupContextStyles();
      startTimer(COUNTDOWN_DURATION);
      break;

    case "secondRoundUpdate":
      // Reset logic is handled automatically by startTimer
      setupContextStyles();
      startTimer(COUNTDOWN_DURATION_SECOND_ROUND); 
      break;

    case "stop":
      cancelAnimationFrame(animationFrameId);
      break;
  }
};

// --- Core Logic ---

function startTimer(seconds) {
  // 1. Cancel any existing animation to prevent double-speed bugs
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // 2. Calculate the absolute time when the timer finishes
  const now = Date.now();
  targetEndTime = now + (seconds * 1000);

  // 3. Start the loop
  tick();
}

function tick() {
  const now = Date.now();
  const timeLeftMs = targetEndTime - now;
  
  // Convert to seconds (Math.ceil makes 9.1s show as 10s, 0.1s as 1s)
  const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

  resetCanvas();

  if (timeLeftSeconds > 0) {

    // Still running
    drawText(`TEMPO RIMANENTE ${timeLeftSeconds} s`);
    
    // Schedule next frame
    animationFrameId = self.requestAnimationFrame(tick);
  } else {
    // Time is up!
    drawText("TIME OUT");
    
    // Notify the main thread
    postMessage({ timeout: "timeout" });
    
    // Stop the loop
    animationFrameId = null; 
  }
}

// --- Canvas Helpers ---

function setupContextStyles() {
  if (!ctx) return;
  ctx.font = FONT_STYLE;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
}

function resetCanvas() {
  if (!ctx || !offscreenCanvas) return;

  // 1. Reset the transformation matrix to identity (clears previous translate/rotate)
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // 2. Clear the entire canvas
  ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  // 3. Move origin to center (so 0,0 is the middle)
  ctx.translate(offscreenCanvas.width / 2, offscreenCanvas.height / 2);
}

function drawText(text) {
  if (!ctx) return;
  ctx.fillText(text, 0, 0);
}