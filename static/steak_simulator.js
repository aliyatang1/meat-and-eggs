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

function renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel) {
  donenessButtonsContainer.innerHTML = "";

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
      renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);
    });

    donenessButtonsContainer.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  
  function resetSimulator() {
    console.log("↩️ resetSimulator() called");
  
    // Reset UI elements
    document.getElementById("tempLabel").textContent = "Temp: 80°F";
    document.getElementById("thermo-fill").style.height = "0%";
    steakImage.src = "/static/images/steaksim-raw.png";
    resultContainer.style.display = "none";
    
    actionBtn.style.display = "inline-block";
    actionBtn.disabled = false;
    actionBtn.textContent = "Start Cooking";
    console.log("▶️ Start Cooking button reset:", actionBtn.style.display, actionBtn.disabled);
  
    timerDisplay.textContent = "0 min";
    console.log("🕒 Timer display reset:", timerDisplay.textContent);
  
    elapsedSeconds = 0;
    console.log("⏱️ elapsedSeconds reset:", elapsedSeconds);
  
    // Stop any audio playing
    sizzleSound.pause();
    sizzleSound.currentTime = 0;
  
    // Clear timers
    clearInterval(interval);
    clearInterval(timerInterval);
    console.log("🧹 Cleared cooking intervals");
  
    // Reset cooking flag
    _isCooking = false;
    console.log("🍳 Cooking state reset:", _isCooking);
  }
  

  const donenessLevels = [
    { name: "Rare", temp: "125°F", cookMinutes: 5, img: "steaksim-rare.png", desc: "Cool red center, very soft and moist." },
    { name: "Medium Rare", temp: "135°F", cookMinutes: 7, img: "steaksim-mediumrare.png", desc: "Warm red-pink center, tender and juicy." },
    { name: "Medium", temp: "140°F", cookMinutes: 9, img: "steaksim-medium.png", desc: "Warm pink center, moderately firm, juicy." },
    { name: "Medium Well", temp: "150°F", cookMinutes: 11, img: "steaksim-mediumwell.png", desc: "Slight hint of pink in the center, firm and slightly juicy." },
    { name: "Well", temp: "160°F+", cookMinutes: 13, img: "steaksim-well.png", desc: "No pink, firm, and dry throughout." }
  ];

  const burnt = { name: "Burnt", img: "steaksim-burnt.png", desc: "Charred and overcooked." };
  const secondsPerRealMinute = 2;
  const burntTime = 15 * secondsPerRealMinute;

  const sizzleSound = document.getElementById("sizzleSound");

  let elapsedSeconds = 0;
  let interval, timerInterval;
  let _isCooking = false;

  const steakImage = document.getElementById("steakImage");
  const targetLabel = document.getElementById("targetDoneness");
  const resultMsg = document.getElementById("resultMsg");
  const resultContainer = document.getElementById("resultContainer");
  const actionBtn = document.getElementById("startBtn");
  const timerDisplay = document.getElementById("cookingTimer");
  const donenessButtonsContainer = document.getElementById("donenessButtons");

  const playAgainBtn = document.getElementById("playAgainBtn");
  const quizBtn = document.getElementById("quizBtn");

  const isCooking = () => _isCooking;

  // Default to Medium on load
  target = donenessLevels.find(l => l.name === "Rare");
  targetLabel.textContent = target.name;
  renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);

  actionBtn.addEventListener("click", () => {
    console.log("👆 Start button clicked. _isCooking:", _isCooking);

    if (!_isCooking) {
      _isCooking = true;
      actionBtn.textContent = "Stop Cooking";
      resultContainer.style.display = "none";
      elapsedSeconds = 0;
      steakImage.src = "/static/images/steaksim-raw.png";      
      timerDisplay.textContent = "0 min";

      sizzleSound.pause(); // just in case
      sizzleSound.currentTime = 0;
      sizzleSound.volume = 1;
      sizzleSound.muted = false;
      
      sizzleSound.play().then(() => {
        console.log("🔊 Sizzle playing");
      }).catch((e) => {
        console.warn("❗Sizzle play blocked:", e);
      });
      

      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const realMinutes = (elapsedSeconds / secondsPerRealMinute).toFixed(1);
        timerDisplay.textContent = `${realMinutes} min`;
        const fillPercent = Math.min((elapsedSeconds / burntTime) * 100, 100);
        document.getElementById("thermo-fill").style.height = `${fillPercent}%`;

        const currentLevel = [...donenessLevels].reverse().find(level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute);
        if (currentLevel) {
          document.getElementById("tempLabel").textContent = `Temp: ${currentLevel.temp}`;
        }
      }, 1000);

      interval = setInterval(() => {
        const current = [...donenessLevels].reverse().find(level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute);
        if (elapsedSeconds >= burntTime) {
          steakImage.src = `/static/images/${burnt.img}`;
          clearInterval(interval);
          clearInterval(timerInterval);
          fadeOutAudio(sizzleSound, 1000);
          actionBtn.style.display = "none";
        
          resultMsg.textContent = "Merry Christmas, you got a block of charcoal.";
          resultContainer.style.display = "block";
        
          // ✅ Make play again work even when burned
          playAgainBtn.textContent = "Try Again";
          playAgainBtn.style.display = "inline-block";
          playAgainBtn.onclick = () => {
            resetSimulator();
            actionBtn.style.display = "inline-block";
            actionBtn.disabled = false;
          };
        
          _isCooking = false;
        }
         else if (current) {
          steakImage.src = `/static/images/${current.img}`;
        }
      }, 1000);
    } else {
      clearInterval(interval);
      clearInterval(timerInterval);
      fadeOutAudio(sizzleSound, 1000);
      actionBtn.style.display = "none";

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
        resultText = `You're cooking, literally and figuratively. <br><br>This steak is ${target.temp} — ${target.name.toLowerCase()}.`;

        const nextUncompleted = donenessLevels.find(level => !completedLevels.has(level.name));
        if (nextUncompleted) {
          playAgainBtn.textContent = "Next Level";
          playAgainBtn.style.display = "inline-block";
          playAgainBtn.onclick = () => {
            target = nextUncompleted;
            targetLabel.textContent = nextUncompleted.name;
            renderDonenessButtons(donenessLevels, donenessButtonsContainer, isCooking, targetLabel);
            resetSimulator();
            actionBtn.style.display = "inline-block"; // Make sure it's visible
            actionBtn.disabled = false;
          };          
          
          // Hide quiz button until all levels are done
         quizBtn.style.display = "none";

        } else {
          playAgainBtn.style.display = "none";
          quizBtn.classList.add("btn-lg");
          quizBtn.style.display = "inline-block";
        }
      } else {

        const centerMatch = target.desc.match(/(.*?)(\s*center)/i);
        const centerPart = centerMatch ? centerMatch[1].trim() + " center" : lowercaseFirstLetter(target.desc);
        const tempPart = target.temp;
        
        resultText = `You tried cooking but got cooked 😵‍💫<br><br>
          You ended up with ${userLevel?.name || "a raw steak"} —
          you can tell by the ${userLevel?.desc ? lowercaseFirstLetter(userLevel.desc) : "bloody red appearance"}.<br><br>
          A proper ${target.name} should have a ${lowercaseFirstLetter(centerPart)} and be cooked to ${tempPart}.`;

        playAgainBtn.textContent = "Try Again";
        playAgainBtn.style.display = "inline-block";
        playAgainBtn.onclick = () => {
          resetSimulator();
          actionBtn.style.display = "inline-block"; // Make sure it's visible
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
