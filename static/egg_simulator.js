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
    btn.innerHTML = isDone ? `${level.name} \u2713` : level.name;

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

  let currentEggStage = "eggsim-raw.png";


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
      desc: "Whites set, yolk runny.",
      sideASeconds: 180,
      sideAMaxSeconds: 240,
      sideBSeconds: 0
    },
    {
      name: "Over Easy",
      img: "eggsim-overeasy.png",
      desc: "runny yolk.",
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

  function isCorrectlyCooked(target, aTime, bTime, hasBeenFlipped) {
    if (target.name === "Sunny Side Up") {
      return !hasBeenFlipped && aTime >= target.sideASeconds && aTime <= target.sideAMaxSeconds;
    }

    if (target.name === "Over Easy") {
      const longMin = 100, longMax = 140;
      const shortMin = 30, shortMax = 60;

      const side1Valid = aTime >= longMin && aTime <= longMax && bTime >= shortMin && bTime <= shortMax;
      const side2Valid = bTime >= longMin && bTime <= longMax && aTime >= shortMin && aTime <= shortMax;

      return hasBeenFlipped && (side1Valid || side2Valid);
    }

    if (target.name === "Over Medium") {
      const min = 100, max = 140;
      return hasBeenFlipped &&
        ((aTime >= min && aTime <= max) && (bTime >= min && bTime <= max));
    }

    if (target.name === "Over Hard") {
      const min = 100, max = 180;
      return hasBeenFlipped &&
        ((aTime >= min && aTime <= max) && (bTime >= min && bTime <= max));
    }

    return false;
  }

  function getProgressiveDonenessImage(aTime, bTime, hasBeenFlipped) {
    if (!hasBeenFlipped) {
      if (aTime >= 160) return "eggsim-sunny.png"; // Sunny side up threshold
      return "eggsim-raw.png";
    }
  
    const inRange = (actual, target, leeway = 20) =>
      actual >= (target - leeway) && actual <= (target + leeway);
  
    const isOverEasy =
      (inRange(aTime, 120) && inRange(bTime, 30, 10)) ||
      (inRange(bTime, 120) && inRange(aTime, 30, 10));
  
    const isOverMedium =
      inRange(aTime, 120) && inRange(bTime, 120);
  
    const isOverHard =
      inRange(aTime, 180) && inRange(bTime, 180);
  
    // Order matters: show most advanced image reached so far
    if (isOverHard) return "eggsim-overhard.png";
    if (isOverMedium) return "eggsim-overmedium.png";
    if (isOverEasy) return "eggsim-overeasy.png";
  
    return "eggsim-raw.png"; // default if nothing matches
  }
  

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
      sizzleSound.play().catch(e => console.warn("\uD83D\uDD0A Sizzle play blocked:", e));

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
        if (
          elapsedSeconds >= burntTime ||
          (target.name === "Sunny Side Up" && !hasBeenFlipped && sideATime > 240)
        ) {
          eggImage.src = "/static/images/steaksim-burnt.png";
          clearInterval(interval);
          clearInterval(timerInterval);
          fadeOutAudio(sizzleSound, 1000);
      
          actionBtn.style.display = "none";
          flipBtn.style.display = "none";
      
          let burnReason = "Merry Christmas, you got a block of charcoal.";
          if (target.name === "Sunny Side Up" && !hasBeenFlipped && sideATime > 240) {
            burnReason = "You cooked it too long on one side and now it's burnt. Try flipping it next time!";
          }
      
          resultMsg.textContent = burnReason;
          resultContainer.style.display = "block";
          playAgainBtn.textContent = "Try Again";
          playAgainBtn.style.display = "inline-block";
          playAgainBtn.onclick = () => {
            resetSimulator();
            actionBtn.style.display = "inline-block";
            actionBtn.disabled = false;
          };
          _isCooking = false;
          return;
        }
      
// Track and update egg doneness stage without regressing
const newStage = (() => {
  if (!hasBeenFlipped) {
    if (sideATime >= 160) return "eggsim-sunny.png";
    return "eggsim-raw.png";
  }

  const inRange = (actual, target, leeway) =>
    actual >= (target - leeway) && actual <= (target + leeway);

  const isOverEasy =
    (inRange(sideATime, 120, 20) && inRange(sideBTime, 30, 10)) ||
    (inRange(sideBTime, 120, 20) && inRange(sideATime, 30, 10));

  const isOverMedium =
    inRange(sideATime, 120, 20) && inRange(sideBTime, 120, 20);

  const isOverHard =
    inRange(sideATime, 180, 20) && inRange(sideBTime, 180, 20);

  if (isOverHard) return "eggsim-overhard.png";
  if (isOverMedium) return "eggsim-overmedium.png";
  if (isOverEasy) return "eggsim-overeasy.png";

  return currentEggStage; // fallback: keep current image
})();

if (newStage !== currentEggStage) {
  currentEggStage = newStage;
  eggImage.src = `/static/images/${newStage}`;
}

                                
      }, 1000);          
    } else {
      clearInterval(interval);
      clearInterval(timerInterval);
      fadeOutAudio(sizzleSound, 1000);
      actionBtn.style.display = "none";
      flipBtn.style.display = "none";     

      const cookedCorrectly = isCorrectlyCooked(target, sideATime, sideBTime, hasBeenFlipped);

      let resultText = "";
      if (cookedCorrectly) {
        completedLevels.add(target.name);
        resultText = `You’re an egg-spert now! <br><br>This egg is cooked ${target.name.toLowerCase()}.`;

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
        const actualState = eggImage.src.includes("overhard")
          ? "Over Hard"
          : eggImage.src.includes("overmedium")
          ? "Over Medium"
          : eggImage.src.includes("overeasy")
          ? "Over Easy"
          : eggImage.src.includes("sunny")
          ? "Sunny Side Up"
          : "Raw";
      
        resultText = "You cracked under pressure 🫠<br><br>";
        resultText += `Looks like this egg is <strong>${actualState}</strong>.<br><br>`;
      
        let cookTimeText = "";
        if (target.name === "Sunny Side Up") {
          cookTimeText = "about 3 minutes on one side";
        } else if (target.name === "Over Easy") {
          cookTimeText = "about 2 minutes on one side and 30–60 seconds on the other";
        } else if (target.name === "Over Medium") {
          cookTimeText = "about 2 minutes per side";
        } else if (target.name === "Over Hard") {
          cookTimeText = "about 2–3 minutes per side";
        }
      
        resultText += `A proper <strong>${target.name}</strong> egg should be cooked for ${cookTimeText}. Key features include: ${target.desc.toLowerCase()}</div>`;
      
        resultMsg.innerHTML = resultText;
        resultContainer.style.display = "block";
      
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
    console.log('some message');
    currentSide = currentSide === 'A' ? 'B' : 'A';
    hasBeenFlipped = true;
  
    const egg = document.getElementById("eggImage");
    egg.classList.toggle("egg-flipped");
  });
  
});