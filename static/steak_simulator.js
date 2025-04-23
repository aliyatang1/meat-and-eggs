function resetSession() {
  completedLevels.clear();
  location.reload(); // easy way to reset the session cleanly
}


document.addEventListener("DOMContentLoaded", () => {
  const donenessLevels = [
    {
      name: "Rare",
      temp: "125°F",
      simTime: 5, // seconds
      img: "steaksim-rare.png",
      desc: "Cool red center, very soft and moist."
    },
    {
      name: "Medium Rare",
      temp: "135°F",
      simTime: 7,
      img: "steaksim-mediumrare.png",
      desc: "Warm red-pink center, tender and juicy."
    },
    {
      name: "Medium",
      temp: "140°F",
      simTime: 9,
      img: "steaksim-medium.png",
      desc: "Warm pink center, moderately firm, juicy."
    },
    {
      name: "Medium Well",
      temp: "150°F",
      simTime: 11,
      img: "steaksim-mediumwell.png",
      desc: "Slight hint of pink in the center, firm and slightly juicy."
    },
    {
      name: "Well",
      temp: "160°F+",
      simTime: 13,
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
      actionBtn.textContent = "Stop Cooking";
      resultContainer.style.display = "none";
      elapsedSeconds = 0;
      steakImage.src = "/static/images/steaksim-raw.png";
      const realMinutes = elapsedSeconds.toFixed(1);
      timerDisplay.textContent = `${realMinutes} min`;
      

      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const realMinutes = elapsedSeconds.toFixed(1);
        timerDisplay.textContent = `${realMinutes} min`;
      }, 1000);
      

      interval = setInterval(() => {
        // Update steak image based on doneness thresholds
        const current = donenessLevels
          .slice()
          .reverse()
          .find(level => elapsedSeconds >= level.simTime);

        if (elapsedSeconds >= 14) {
          steakImage.src = `/static/images/${burnt.img}`;
          clearInterval(interval);
          clearInterval(timerInterval);
          actionBtn.style.display = "none";
          resultMsg.textContent = "🔥 Nice try, but you cooked it too long and now it's burnt.";
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

      const current = donenessLevels
        .slice()
        .reverse()
        .find(level => elapsedSeconds >= level.simTime);

        let resultText;

        const currentSteak = donenessLevels.slice().reverse().find(level => elapsedSeconds >= level.simTime);
        const userLevel = currentSteak;


        if (userLevel?.name === target.name) {
          completedLevels.add(target.name);
          resultText = `Nice! This would be ${target.temp}—${target.name.toLowerCase()}.`;
        
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
        
        } else if (current) {
          resultText = `❌ Boo you suck at cooking :( This is ${current.name} — you can tell by the ${current.desc}. ${target.name} should have ${target.desc}`;
        } else {
          resultText = `❌ That steak is undercooked. ${target.name} should have ${target.desc}`;
        }
        

      

      resultMsg.textContent = resultText;
      resultContainer.style.display = "block";
    }
  });
});
