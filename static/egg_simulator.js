function resetSession() {
  completedLevels.clear();
  location.reload(); // easy way to reset the session cleanly
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
    btn.innerHTML = isDone ? `${level.name} ✅` : level.name;

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
    elapsedSeconds = 0;

    sizzleSound.pause();
    sizzleSound.currentTime = 0;

    clearInterval(interval);
    clearInterval(timerInterval);
    _isCooking = false;
  }

  const donenessLevels = [
    { name: "Sunny Side Up", temp: "Medium-Low", cookMinutes: 3, img: "eggsim-sunny.png", desc: "Whites set; yolk runny." },
    { name: "Over Easy", temp: "Medium", cookMinutes: 4, img: "eggsim-overeasy.png", desc: "Flipped briefly; runny yolk." },
    { name: "Over Medium", temp: "Medium", cookMinutes: 5, img: "eggsim-overmedium.png", desc: "Yolk partially set, jammy." },
    { name: "Over Hard", temp: "Medium", cookMinutes: 6, img: "eggsim-overhard.png", desc: "Yolk fully cooked, whites firm." }
  ];

  const burnt = { name: "Burnt", img: "steaksim-burnt.png", desc: "Charred and rubbery." };
  const secondsPerRealMinute = 3;
  const burntTime = 8 * secondsPerRealMinute;

  const sizzleSound = document.getElementById("sizzleSound");

  let elapsedSeconds = 0;
  let interval, timerInterval;
  let _isCooking = false;

  const eggImage = document.getElementById("eggImage");
  const targetLabel = document.getElementById("targetDoneness");
  const resultMsg = document.getElementById("resultMsg");
  const resultContainer = document.getElementById("resultContainer");
  const actionBtn = document.getElementById("startBtn");
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
      eggImage.src = "/static/images/eggsim-raw.png";
      timerDisplay.textContent = "0 min";

      sizzleSound.pause();
      sizzleSound.currentTime = 0;
      sizzleSound.volume = 1;
      sizzleSound.play().catch(e => console.warn("❗Sizzle play blocked:", e));

      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const minutes = Math.floor(elapsedSeconds / secondsPerRealMinute);
        const seconds = Math.floor((elapsedSeconds % secondsPerRealMinute) * (60 / secondsPerRealMinute));
        timerDisplay.textContent = `${minutes} min ${seconds}s`;
        
        const currentLevel = [...donenessLevels].reverse().find(
          level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute
        );
      }, 1000);

      interval = setInterval(() => {
        const current = [...donenessLevels].reverse().find(
          level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute
        );
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
        } else if (current) {
          eggImage.src = `/static/images/${current.img}`;
        }
      }, 1000);
    } else {
      clearInterval(interval);
      clearInterval(timerInterval);
      fadeOutAudio(sizzleSound, 1000);
      actionBtn.style.display = "none";
      flipBtn.style.display = "none";


      let userLevel = null;
      for (const level of donenessLevels) {
        const threshold = level.cookMinutes * secondsPerRealMinute;
        if (elapsedSeconds >= threshold) {
          userLevel = level;
        } else break;
      }

      let resultText = "";
      if (userLevel?.name === target.name) {
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
        resultText = `You ended up with ${userLevel?.name || "a raw egg"} —
          description: ${userLevel?.desc || "barely cooked whites, runny yolk."}<br><br>
          A proper ${target.name} egg should be cooked ${target.desc}`;

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
});
