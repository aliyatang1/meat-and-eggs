function resetSession() {
  completedLevels.clear();
  location.reload(); // easy way to reset the session cleanly
}

function lowercaseFirstLetter(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function fadeOutAudio(audio, duration = 1000) {
  const step = 50; // ms between volume changes
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


document.addEventListener("DOMContentLoaded", () => {
  const donenessLevels = [
    {
      name: "Rare",
      temp: "125°F",
      cookMinutes: 5,
      img: "steaksim-rare.png",
      desc: "Cool red center, very soft and moist."
    },
    {
      name: "Medium Rare",
      temp: "135°F",
      cookMinutes: 7,
      img: "steaksim-mediumrare.png",
      desc: "Warm red-pink center, tender and juicy."
    },
    {
      name: "Medium",
      temp: "140°F",
      cookMinutes: 9,
      img: "steaksim-medium.png",
      desc: "Warm pink center, moderately firm, juicy."
    },
    {
      name: "Medium Well",
      temp: "150°F",
      cookMinutes: 11,
      img: "steaksim-mediumwell.png",
      desc: "Slight hint of pink in the center, firm and slightly juicy."
    },
    {
      name: "Well",
      temp: "160°F+",
      cookMinutes: 13,
      img: "steaksim-well.png",
      desc: "No pink, firm, and dry throughout."
    }
  ];
  

  const burnt = {
    name: "Burnt",
    img: "steaksim-burnt.png",
    desc: "Charred and overcooked."
  };

  const completedLevels = new Set(); // Tracks which doneness levels were correctly hit
  const secondsPerRealMinute = 2; // ⏱ 2 simulator second = 1 real minute
  const burntTime = 15 * secondsPerRealMinute;

  const sizzleSound = document.getElementById("sizzleSound");


  let elapsedSeconds = 0;
  let interval;
  let timerInterval;
  let target = null;
  let isCooking = false;

  const steakImage = document.getElementById("steakImage");
  const targetLabel = document.getElementById("targetDoneness");
  const resultMsg = document.getElementById("resultMsg");
  const resultContainer = document.getElementById("resultContainer");
  const actionBtn = document.getElementById("startBtn");
  const timerDisplay = document.getElementById("cookingTimer");

  // Pick a target doneness
  const remainingLevels = donenessLevels.filter(level => !completedLevels.has(level.name));

  if (remainingLevels.length === 0) {
    // All levels completed
    targetLabel.textContent = "🎉 All done!";
    actionBtn.style.display = "none";
    steakImage.style.opacity = 0.5;
    resultMsg.textContent = "✅ You’ve successfully cooked all doneness levels!";
    resultContainer.style.display = "block";
    return;
  }
  
  // Pick a new target from remaining levels
  target = remainingLevels[Math.floor(Math.random() * remainingLevels.length)];
  targetLabel.textContent = target.name;
  

  actionBtn.addEventListener("click", () => {
    if (!isCooking) {
      // Start cooking
      isCooking = true;

      sizzleSound.currentTime = 0; // rewind to start
      sizzleSound.play();

      actionBtn.textContent = "Stop Cooking";
      resultContainer.style.display = "none";
      elapsedSeconds = 0;
      steakImage.src = "/static/images/steaksim-raw.png";
      const realMinutes = (elapsedSeconds / secondsPerRealMinute).toFixed(1);
      timerDisplay.textContent = `${realMinutes} min`;      
      

      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const realMinutes = (elapsedSeconds / secondsPerRealMinute).toFixed(1);
        timerDisplay.textContent = `${realMinutes} min`;
      
        // update thermometer fill (still gradual visual rise)
        const fillPercent = Math.min((elapsedSeconds / burntTime) * 100, 100);
        document.getElementById("thermo-fill").style.height = `${fillPercent}%`;
      
        // update thermometer TEMP TEXT only when reaching doneness milestones
        const currentLevel = donenessLevels
          .slice()
          .reverse()
          .find(level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute);
      
        if (currentLevel) {
          document.getElementById("tempLabel").textContent = `Temp: ${currentLevel.temp}`;
        }
      }, 1000);
      
         
      

      interval = setInterval(() => {
        // Update steak image based on doneness thresholds
        const current = donenessLevels
        .slice()
        .reverse()
        .find(level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute);
      
        if (elapsedSeconds >= burntTime) {
          steakImage.src = `/static/images/${burnt.img}`;
          clearInterval(interval);
          clearInterval(timerInterval);
          fadeOutAudio(sizzleSound, 1000);
          actionBtn.style.display = "none";
          resultMsg.textContent = "Merry Christmas, you got a nice block of charcoal.";
          resultContainer.style.display = "block";
        } else if (current) {
          steakImage.src = `/static/images/${current.img}`;
        }
      }, 1000); // Check every 1 second

    } else {
      // Stop cooking and evaluate
      clearInterval(interval);
      clearInterval(timerInterval);
      actionBtn.style.display = "none";

      fadeOutAudio(sizzleSound, 1000); // 1 second fade


      const current = donenessLevels
        .slice()
        .reverse()
        .find(level => elapsedSeconds >= level.simTime);

        const currentSteak = donenessLevels.slice().reverse().find(level => elapsedSeconds >= level.cookMinutes * secondsPerRealMinute);
        const userLevel = currentSteak;
        
        let resultText;
        
        if (userLevel?.name === target.name) {
          // ✅ Correct cooking
          completedLevels.add(target.name);
          resultText = `You're cooking, literally and <br><br>This steak is ${target.temp} — ${target.name.toLowerCase()}.`;
        
          const progressText = `You’ve cooked ${completedLevels.size} of ${donenessLevels.length} doneness levels.`;
          document.getElementById("donenessProgress").textContent = progressText;
        
          if (completedLevels.size === donenessLevels.length) {
            resultText += ` 🎉 You’ve mastered all 5 doneness levels!`;
        
            const playAgainBtn = document.querySelector('a[href="/simulator/steak"]');
            playAgainBtn.style.display = "none";
        
            const quizBtn = document.querySelector('a[href="/quiz/meat/1"]');
            quizBtn.classList.add("btn-lg");
            quizBtn.textContent = "🎓 You’re Ready — Take the Steak Quiz!";
          }
        
        } else {
          resultText = `You tried cooking but got cooked 😵‍💫<br><br>
          You ended up with ${userLevel?.name || "a raw steak"} — 
          you can tell by the ${userLevel?.desc ? lowercaseFirstLetter(userLevel.desc) 
            : "bloody red appearance"} <br><br>
            For a proper ${target.name}, you should see a 
            ${lowercaseFirstLetter(target.desc)}`;
        }
        
        // Show result
        resultMsg.innerHTML = resultText;
        resultContainer.style.display = "block";
        
        

      
      resultContainer.style.display = "block";
    }
  });
});
