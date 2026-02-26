// --- Animation Core Functions ---

const countDownTime = 30;
const timerCanvasSize = 400;
const auctionResultCanvasSize = [1000, 400];
let animationFrameId = null;
let ctx = null;
let offscreenCanvas = null;
let imageBitmap = null;
let timeout = false;

function draw(timeLeft, prevTime) {
  // Safely check if the image object and its dimensions are ready
  // FIX: Check img.value instead of img
  if (
    !imageBitmap ||
    imageBitmap.naturalWidth === 0 ||
    imageBitmap.naturalHeight === 0
  ) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    return;
  }

  resetCanvas();
  ctx.translate(timerCanvasSize / 2, timerCanvasSize / 2);

  const time = new Date();

  if (time - prevTime > 1000) {
    timeLeft = timeLeft - 1;
    prevTime = time;
  }

  ctx.fillText(timeLeft.toString(), 0, 0);

  // 3. Calculate rotation based on time (Full orbit every 5 seconds)
  const orbitSpeed = 5;
  const angle =
    ((2 * Math.PI) / orbitSpeed) * time.getSeconds() +
    ((2 * Math.PI) / (orbitSpeed * 1000)) * time.getMilliseconds();

  ctx.rotate(angle);

  // 4. Move out along the rotated axis to the orbit distance
  const orbitRadius = 150;
  ctx.translate(orbitRadius, 0);

  // 5. Draw the image (centered on the translated point)
  const imageSize = 50;
  // FIX: Use img.value
  ctx.drawImage(
    imageBitmap,
    -imageSize / 2,
    -imageSize / 2,
    imageSize,
    imageSize
  );

  // 6. Restore the canvas state (undoes all translates and rotates)
  ctx.restore();

  // Loop: Schedule the next frame
  if (timeLeft > 0) {
    animationFrameId = self.requestAnimationFrame(function () {
      draw(timeLeft, prevTime);
    });
  } else {
    resetCanvas();
    ctx.translate(timerCanvasSize / 2, timerCanvasSize / 2);
    ctx.fillText("TIME OUT", 0, 0);
    cancelAnimationFrame(animationFrameId);
    timeout = true;
  }
}

self.addEventListener("message", async (e) => {
  const eventType = e.data.type;
  if (eventType == "init") {
    offscreenCanvas = e.data.offscreenCanvas;
    imageBlob = e.data.imageBlob;
    ctx = offscreenCanvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    // 1. Decode the Blob into an ImageBitmap (Worker-safe decoding)
    imageBitmap = await self.createImageBitmap(imageBlob);
  } else if (eventType == "auctionStarted") {
    offscreenCanvas.width = timerCanvasSize;  // 400
    offscreenCanvas.height = timerCanvasSize
    ctx.font = "bold 70px 'Roboto',sans-serif";
    ctx.fillStyle = "#3e4248";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    animationFrameId = self.requestAnimationFrame(function () {
      draw(countDownTime, new Date());
    });
    while (!timeout) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    postMessage({
      timeout: "timeout",
    });
    timeout = false;
  } else if (eventType == "auctionEnded") {
    offscreenCanvas.width = auctionResultCanvasSize[0];
    resetCanvas();
    ctx.translate(auctionResultCanvasSize[0] / 2, auctionResultCanvasSize[1] / 2);
    playerName = e.data.playerName;
    ctx.font = "bold 40px 'Roboto',sans-serif";
    ctx.textAlign = "center";
    if (e.data.auctionResult.isPurchaser) {
      ctx.fillStyle = "rgba(79, 209, 111, 1)";
      const awardedAuctionStr = ` Ti sei aggiudicato l'asta per ${playerName}!`;
      ctx.fillText("Complimenti!", 0, 0);
      ctx.fillText(awardedAuctionStr, 0, 50);
    } else {
      if (e.data.auctionResult.purchaserName) {
        ctx.fillStyle = "rgba(218, 36, 60, 1)";
        const lostAuctionStr1 = `Non ti sei aggiudicato l'asta per ${playerName}`;
        ctx.fillText(lostAuctionStr1, 0, 0);
        const lostAuctionStr2 = `Il fortunato è ${e.data.auctionResult.purchaserName}`;
        ctx.fillText(lostAuctionStr2, 0, 50);
      }else{
        ctx.fillStyle = "rgba(75, 75, 76, 1)";
        const lostAuctionStr1 = `Nessuna offerta per ${playerName}`;
        ctx.fillText(lostAuctionStr1, 0, 0);
      }
    }
  }
});
function resetCanvas() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  // 1. Save the initial state (before transformation)
  ctx.save();
}
