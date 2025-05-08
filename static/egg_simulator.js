function resetSession() {
  completedLevels.clear();
  location.reload();
}

function lowercaseFirstLetter(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function fadeOutAudio(audio, duration = 1000) {
  const step = 50;
  const fadeAmount = audio.volume / (duration / step);

  const fadeAudio = setInterval(() => {
    if (audio.volume > fadeAmount) {
      audio.volume -= fadeAmount;
    } else {
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
      clearInterval(fadeAudio);
    }
  }, step);
}

const completedLevels = new Set();
let target = null;

function renderDonenessButtons(donenessLevels, container, isCooking, targetLabel) {
  container.innerHTML = "";

  donenessLevels.forEach(level => {
    const btn = document.createElement("button");
    btn.classList.add("btn", "btn-outline-accent", "m-1");
    btn.dataset.doneness = level.name;

    const isDone = completedLevels.has(level.name);
    btn.innerHTML = isDone ? `${level.name} ✓` : level.name;

    if (target?.name === level.name) {
      btn.classList.remove("btn-outline-accent");
      btn.classList.add("btn-accent");
    }

    btn.addEventListener("click", () => {
      if (isCooking()) return;
      target = level;
      targetLabel.textContent = level.name;
      renderDonenessButtons(donenessLevels, container, isCooking, targetLabel);
    });

    container.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const timerSideA = document.getElementById("timerSideA");
  const timerSideB = document.getElementById("timerSideB");

  function resetSimulator() {
    eggImage.src = "/static/images/eggsim-raw.png";
    resultContainer.style.display = "none";

    actionBtn.style.display = "inline-block";
    actionBtn.disabled = false;
    actionBtn.textContent = "Start Cooking";

    flipBtn.style.display = "inline-block";
    flipBtn.disabled = false;
    flipBtn.textContent = "Flip Egg";

    timerDisplay.textContent = "0 min";
    timerSideA.textContent = "Side A: 0m 0s";
    timerSideB.textContent = "Side B: 0m 0s";

    sideATime = 0;
    sideBTime = 0;
    elapsedSeconds = 0;
    currentSide = "A";
    hasBeenFlipped = false;

    sizzleSound.pause();
    sizzleSound.currentTime = 0;

    clearInterval(interval);
    clearInterval(timerInterval);
    _isCooking = false;
  }

  const donenessLevels = [
    {
      name: "Sunny Side Up",
      img: "eggsim-sunny.png",
      desc: "Whites set; yolk runny.",
      sideASeconds: 180,
      sideBSeconds: 0
    },
    {
      name: "Over Easy",
      img: "eggsim-overeasy.png",
      desc: "Flipped briefly; runny yolk.",
      sideASeconds: 120,
      sideBMinSeconds: 30,
      sideBMaxSeconds: 60
    },
    {
      name: "Over Medium",
      img: "eggsim-overmedium.png",
      desc: "Yolk partially set, jammy.",
      sideASeconds: 120,
      sideBSeconds: 120
    },
    {
      name: "Over Hard",
      img: "eggsim-overhard.png",
      desc: "Yolk fully cooked, whites firm.",
      sideAMinSeconds: 120,
      sideAMaxSeconds: 180,
      sideBMinSeconds: 120,
      sideBMaxSeconds: 180
    }
  ];  

  const burnt = { name: "Burnt", img: "steaksim-burnt.png", desc: "Charred and rubbery." };
  const secondsPerRealMinute = 6;
  const simulatedSecondsPerTick = 10;
  const burntTime = 8 * 60;

  const sizzleSound = document.getElementById("sizzleSound");

  let elapsedSeconds = 0;
  let sideATime = 0;
  let sideBTime = 0;
  let interval, timerInterval;
  let currentSide = 'A';
  let hasBeenFlipped = false;
  let _isCooking = false;

  const eggImage = document.getElementById("eggImage");
  const targetLabel = document.getElementById("targetDoneness");
  const resultMsg = document.getElementById("resultMsg");
  const resultContainer = document.getElementById("resultContainer");
  const actionBtn = document.getElementById("startBtn");
  const flipBtn = document.getElementById("flipBtn");
  const timerDisplay = document.getElementById("cookingTimer");
  const donenessButtonsContainer = document.getElementById("donenessButtons");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const quizBtn = document.getElementById("quizBtn");

  const isCooking = () => _isCooking;

  target = donenessLevels[0];
  targetLabel.textContent = target.name;
  renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);

  actionBtn.addEventListener("click", () => {
    if (!_isCooking) {
      _isCooking = true;
      actionBtn.textContent = "Stop Cooking";
      resultContainer.style.display = "none";
      elapsedSeconds = 0;
      sideATime = 0;
      sideBTime = 0;
      currentSide = "A";
      hasBeenFlipped = false;

      eggImage.src = "/static/images/eggsim-raw.png";
      timerDisplay.textContent = "0 min";

      sizzleSound.pause();
      sizzleSound.currentTime = 0;
      sizzleSound.volume = 1;
      sizzleSound.play().catch(e => console.warn("🔊 Sizzle play blocked:", e));

      timerInterval = setInterval(() => {
        elapsedSeconds += simulatedSecondsPerTick;
        if (currentSide === "A") {
          sideATime += simulatedSecondsPerTick;
        } else {
          sideBTime += simulatedSecondsPerTick;
        }

        const totalMinutes = Math.floor(elapsedSeconds / 60);
        const totalSeconds = elapsedSeconds % 60;
        timerDisplay.textContent = `${totalMinutes} min ${totalSeconds}s`;

        const aMin = Math.floor(sideATime / 60);
        const aSec = sideATime % 60;
        const bMin = Math.floor(sideBTime / 60);
        const bSec = sideBTime % 60;
        timerSideA.textContent = `Side A: ${aMin}m ${aSec}s`;
        timerSideB.textContent = `Side B: ${bMin}m ${bSec}s`;
      }, 1000);

      interval = setInterval(() => {
        // Determine latest eligible level based on total simulated cook time
        const totalCookTime = sideATime + sideBTime;
      
        const current = [...donenessLevels].reverse().find(level => {
          if (level.name === "Sunny Side Up") return totalCookTime >= level.sideASeconds;
          if (level.name === "Over Easy") return totalCookTime >= level.sideASeconds + level.sideBMinSeconds;
          if (level.name === "Over Medium") return totalCookTime >= level.sideASeconds + level.sideBSeconds;
          if (level.name === "Over Hard") return totalCookTime >= level.sideAMinSeconds + level.sideBMinSeconds;
        });
      
        if (elapsedSeconds >= burntTime) {
          eggImage.src = `/static/images/${burnt.img}`;
          clearInterval(interval);
          clearInterval(timerInterval);
          fadeOutAudio(sizzleSound, 1000);
          actionBtn.style.display = "none";
          resultMsg.textContent = "Merry Christmas, you got a block of charcoal.";
          resultContainer.style.display = "block";
          playAgainBtn.textContent = "Try Again";
          playAgainBtn.style.display = "inline-block";
          playAgainBtn.onclick = () => {
            resetSimulator();
            actionBtn.style.display = "inline-block";
            actionBtn.disabled = false;
          };
          _isCooking = false;
        } else if (current && !(current.name === "Sunny Side Up" && hasBeenFlipped)) {
          eggImage.src = `/static/images/${current.img}`;
        }
      }, 1000);      
    } else {
      clearInterval(interval);
      clearInterval(timerInterval);
      fadeOutAudio(sizzleSound, 1000);
      actionBtn.style.display = "none";
      flipBtn.style.display = "none";

      function isCorrectlyCooked(target, aTime, bTime) {
        if (target.name === "Sunny Side Up") {
          return !hasBeenFlipped && aTime >= target.sideASeconds;
        }
        if (target.name === "Over Easy") {
          return (
            hasBeenFlipped &&
            aTime >= target.sideASeconds &&
            bTime >= target.sideBMinSeconds &&
            bTime <= target.sideBMaxSeconds
          );
        }
        if (target.name === "Over Medium") {
          return (
            hasBeenFlipped &&
            aTime >= target.sideASeconds &&
            bTime >= target.sideBSeconds
          );
        }
        if (target.name === "Over Hard") {
          return (
            hasBeenFlipped &&
            aTime >= target.sideAMinSeconds &&
            aTime <= target.sideAMaxSeconds &&
            bTime >= target.sideBMinSeconds &&
            bTime <= target.sideBMaxSeconds
          );
        }
        return false;
      }
      
      const totalCookTime = sideATime + sideBTime;
const userLevel = [...donenessLevels].reverse().find(level => {
  if (level.name === "Sunny Side Up") return totalCookTime >= level.sideASeconds;
  if (level.name === "Over Easy") return totalCookTime >= level.sideASeconds + level.sideBMinSeconds;
  if (level.name === "Over Medium") return totalCookTime >= level.sideASeconds + level.sideBSeconds;
  if (level.name === "Over Hard") return totalCookTime >= level.sideAMinSeconds + level.sideBMinSeconds;
});


      const cookedCorrectly = isCorrectlyCooked(target, sideATime, sideBTime);
      
      let resultText = "";
      if (cookedCorrectly) {      
        completedLevels.add(target.name);
        resultText = `You nailed it! <br><br>This egg is cooked ${target.name.toLowerCase()}.`;

        const nextUncompleted = donenessLevels.find(level => !completedLevels.has(level.name));
        if (nextUncompleted) {
          playAgainBtn.textContent = "Next Level";
          playAgainBtn.style.display = "inline-block";
          playAgainBtn.onclick = () => {
            target = nextUncompleted;
            targetLabel.textContent = nextUncompleted.name;
            renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);
            resetSimulator();
            actionBtn.style.display = "inline-block";
            actionBtn.disabled = false;
          };
          quizBtn.style.display = "none";
        } else {
          playAgainBtn.style.display = "none";
          quizBtn.classList.add("btn-lg");
          quizBtn.style.display = "inline-block";
        }
      } else {
        resultText = `You ended up with ${userLevel?.name || "a raw egg"} — description: ${userLevel?.desc || "barely cooked whites, runny yolk."}<br><br> A proper ${target.name} egg should be cooked ${target.desc}`;

        playAgainBtn.textContent = "Try Again";
        playAgainBtn.style.display = "inline-block";
        playAgainBtn.onclick = () => {
          resetSimulator();
          actionBtn.style.display = "inline-block";
          actionBtn.disabled = false;
        };
      }

      renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);
      resultMsg.innerHTML = resultText;
      resultContainer.style.display = "block";
      _isCooking = false;
    }
  });

  flipBtn.addEventListener("click", () => {
    currentSide = currentSide === 'A' ? 'B' : 'A';
    hasBeenFlipped = true;
  });
});