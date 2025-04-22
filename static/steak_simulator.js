document.addEventListener("DOMContentLoaded", () => {
  const donenessLevels = [
    {
      name: "Rare",
      temp: "125°F",
      simTime: 10, // seconds
      img: "steaksim-rare.png",
      desc: "Cool red center, very soft and moist."
    },
    {
      name: "Medium Rare",
      temp: "135°F",
      simTime: 14,
      img: "steaksim-mediumrare.png",
      desc: "Warm red-pink center, tender and juicy."
    },
    {
      name: "Medium",
      temp: "140°F",
      simTime: 18,
      img: "steaksim-medium.png",
      desc: "Warm pink center, moderately firm, juicy."
    },
    {
      name: "Medium Well",
      temp: "150°F",
      simTime: 22,
      img: "steaksim-mediumwell.png",
      desc: "Slight hint of pink in the center, firm and slightly juicy."
    },
    {
      name: "Well",
      temp: "160°F+",
      simTime: 26,
      img: "steaksim-well.png",
      desc: "No pink, firm, and dry throughout."
    }
  ];

  const burnt = {
    name: "Burnt",
    img: "steaksim-burnt.png",
    desc: "Charred and overcooked."
  };

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
  target = donenessLevels[Math.floor(Math.random() * donenessLevels.length)];
  targetLabel.textContent = target.name;

  actionBtn.addEventListener("click", () => {
    if (!isCooking) {
      // Start cooking
      isCooking = true;
      actionBtn.textContent = "Stop Cooking";
      resultContainer.style.display = "none";
      elapsedSeconds = 0;
      steakImage.src = "/static/images/steaksim-raw.png";
      const realMinutes = (elapsedSeconds / 2).toFixed(1);
      timerDisplay.textContent = `${realMinutes} min`;
      

      timerInterval = setInterval(() => {
        elapsedSeconds++;
        const realMinutes = (elapsedSeconds / 2).toFixed(1);
        timerDisplay.textContent = `${realMinutes} min`;
      }, 1000);
      

      interval = setInterval(() => {
        // Update steak image based on doneness thresholds
        const current = donenessLevels
          .slice()
          .reverse()
          .find(level => elapsedSeconds >= level.simTime);

        if (elapsedSeconds >= 28) {
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
      if (current?.name === target.name) {
        resultText = `✅ Nice! This would be ${target.temp}—${target.name.toLowerCase()}.`;
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
