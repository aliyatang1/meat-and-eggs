document.addEventListener("DOMContentLoaded", () => {
    const eggStyles = [
      {
        style: "Sunny Side Up",
        heat: "Medium-Low",
        timeBeforeFlip: 3,
        timeAfterFlip: 0,
        flip: false,
        description: "Whites set; yolk runny. Whites turn from clear to solid white.",
        image: "images/eggs-sunny.webp"
      },
      {
        style: "Over Easy",
        heat: "Medium",
        timeBeforeFlip: 2,
        timeAfterFlip: 1,
        flip: true,
        description: "Whites set; yolk runny. Flip when whites are opaque.",
        image: "images/eggs-easy.jpg"
      },
      {
        style: "Over Medium",
        heat: "Medium",
        timeBeforeFlip: 2,
        timeAfterFlip: 2,
        flip: true,
        description: "Whites set; yolk partially set/jammy.",
        image: "images/eggs-medium.jpg"
      },
      {
        style: "Over Hard",
        heat: "Medium",
        timeBeforeFlip: 3,
        timeAfterFlip: 3,
        flip: true,
        description: "Whites and yolks firm. Browning appears on whites.",
        image: "images/eggs-hard.webp"
      }
    ];
  
    const secondsPerRealMinute = 1.5; // adjust as needed for realism
    const sizzleSound = document.getElementById("sizzleSound");
  
    let currentStyle = eggStyles[0];
    let elapsedSeconds = 0;
    let isFlipped = false;
    let interval;
    let isCooking = false;
  
    const eggImage = document.getElementById("eggImage");
    const targetStyleLabel = document.getElementById("targetStyle");
    const startBtn = document.getElementById("startBtn");
    const flipBtn = document.getElementById("flipBtn");
    const timerDisplay = document.getElementById("cookingTimer");
    const eggButtons = document.getElementById("eggButtons");
    const resultContainer = document.getElementById("resultContainer");
    const resultMsg = document.getElementById("resultMsg");
    const tryAgainBtn = document.getElementById("tryAgainBtn");
  
    // Render buttons
    eggStyles.forEach(style => {
      const btn = document.createElement("button");
      btn.classList.add("btn", "btn-outline-secondary", "m-1");
      btn.textContent = style.style;
      btn.onclick = () => {
        if (isCooking) return;
        currentStyle = style;
        targetStyleLabel.textContent = style.style;
        resetEgg();
      };
      eggButtons.appendChild(btn);
    });
  
    function resetEgg() {
      clearInterval(interval);
      elapsedSeconds = 0;
      isFlipped = false;
      timerDisplay.textContent = "0 min";
      eggImage.src = "images/eggs-raw.png";
      resultContainer.style.display = "none";
      flipBtn.style.display = currentStyle.flip ? "inline-block" : "none";
      startBtn.style.display = "inline-block";
      startBtn.textContent = "Start Cooking";
    }
  
    function startCooking() {
      isCooking = true;
      sizzleSound.currentTime = 0;
      sizzleSound.play();
  
      startBtn.textContent = "Stop Cooking";
      interval = setInterval(() => {
        elapsedSeconds++;
        const realMinutes = (elapsedSeconds / secondsPerRealMinute).toFixed(1);
        timerDisplay.textContent = `${realMinutes} min`;
  
        const before = currentStyle.timeBeforeFlip * secondsPerRealMinute;
        const after = currentStyle.timeAfterFlip * secondsPerRealMinute;
  
        if (!currentStyle.flip && elapsedSeconds >= before) {
          showResult(true);
        }
  
        if (currentStyle.flip && isFlipped && elapsedSeconds >= before + after) {
          showResult(true);
        }
      }, 1000);
    }
  
    function stopCooking(failed = true) {
      clearInterval(interval);
      sizzleSound.pause();
      isCooking = false;
      if (failed) showResult(false);
    }
  
    function showResult(success) {
      clearInterval(interval);
      isCooking = false;
      eggImage.src = currentStyle.image;
      resultContainer.style.display = "block";
      startBtn.style.display = "none";
      flipBtn.style.display = "none";
  
      resultMsg.innerHTML = success
        ? `Perfect! You cooked a <strong>${currentStyle.style}</strong> egg!`
        : `Oops! You didn’t cook it correctly. Try for <strong>${currentStyle.style}</strong>:<br><br>${currentStyle.description}`;
    }
  
    startBtn.onclick = () => {
      if (!isCooking) {
        resetEgg();
        startCooking();
      } else {
        stopCooking(true);
      }
    };
  
    flipBtn.onclick = () => {
      isFlipped = true;
      flipBtn.disabled = true;
    };
  
    tryAgainBtn.onclick = () => {
      resetEgg();
    };
  
    // Default start
    targetStyleLabel.textContent = currentStyle.style;
    resetEgg();
  });
  