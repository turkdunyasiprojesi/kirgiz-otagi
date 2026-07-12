const video = document.getElementById("introVideo");
const backgroundLayer = document.getElementById("backgroundLayer");
const overlay = document.getElementById("infoOverlay");
const startButton = document.getElementById("startButton");
const soundToggle = document.getElementById("soundToggle");
const replayButton = document.getElementById("replayButton");
const backToMenu = document.getElementById("backToMenu");
const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");
const backgroundMusic = document.getElementById("backgroundMusic");
const introSound = document.getElementById("introSound");
const sectionSound = document.getElementById("sectionSound");
const glassElements = document.querySelectorAll(".glass-card");

const INTRO_VIDEO = "giris.mp4";
const INTRO_START_BG = "bgs/ilk.jpg";
const INTRO_END_BG = "bgs/son.jpg";
const audioElements = [backgroundMusic, introSound, sectionSound];
const sectionDetails = {
  1: {
    title: "TÜNDÜK",
    description:
      "Otağın tepesindeki daire şeklindeki açıklıktır. Güneşin ve gökyüzünün sembolüdür. Aile birliği ve yaşamın kaynağını temsil eder.",
  },
  2: {
    title: "KEREGE",
    description: "Otağın duvarını oluşturan kafes şeklindeki ahşap yapıdır. Katlanabilir özelliktedir.",
  },
  3: {
    title: "ESİK (KAPI)",
    description:
      "Otağın giriş kapısıdır. Genellikle güneye dönük yerleştirilir. Güneşi, bereketi ve aydınlığı simgeler.",
  },
  4: {
    title: "UUUK",
    description: "Tündükten çevreye doğru uzanan ağaç direklerdir. Otağın iskeletini oluşturur.",
  },
  5: {
    title: "KIYIZ",
    description:
      "Keçi yününden yapılan keçedir. Otağın üzerini örter, yazın serin, kışın sıcak tutar. Su geçirmez özelliktedir.",
  },
  6: {
    title: "İÇ DÜZEN",
    description:
      "Otağın içi temiz ve düzenli tutulur. Orta bölüm aile toplantıları ve misafirler için ayrılır. Eşyalar belirli bir düzene göre yerleştirilir.",
  },
};

let overlayShown = false;
let fallbackTimer;
let audioMuted = false;
let sectionMode = false;
let introSoundPlayed = false;
let appStarted = false;
let isReversePlaying = false;
let currentSectionIndex = null;

function setBackgroundImage(src) {
  backgroundLayer.style.backgroundImage = `url("${src}")`;
}

function revealVideo() {
  video.classList.remove("is-background-revealed");
}

function showBackgroundImage(src) {
  setBackgroundImage(src);
  video.classList.add("is-background-revealed");
}

function showOverlay() {
  if (overlayShown) return;
  overlayShown = true;
  overlay.classList.add("is-visible");
  replayButton.classList.add("is-visible");
}

function hideOverlay() {
  overlayShown = false;
  overlay.classList.remove("is-visible");
  replayButton.classList.remove("is-visible");
}

function syncSoundLabel() {
  soundToggle.classList.toggle("is-unmuted", !audioMuted);
  soundToggle.setAttribute("aria-pressed", String(!audioMuted));
}

function applyAudioState() {
  backgroundMusic.volume = 0.5;
  introSound.volume = 1;
  sectionSound.volume = 1;
  audioElements.forEach((audio) => {
    audio.muted = audioMuted;
  });
  video.muted = true;
  syncSoundLabel();
}

function playMedia(media) {
  const playAttempt = media.play();

  if (playAttempt && typeof playAttempt.catch === "function") {
    return playAttempt.then(() => true).catch(() => false);
  }

  return Promise.resolve(true);
}

function playStartupAudio() {
  applyAudioState();
  playMedia(backgroundMusic);

  if (!introSoundPlayed) {
    introSound.currentTime = 0;
    playMedia(introSound).then((played) => {
      introSoundPlayed = played;
    });
  }
}

function unlockAudioOnce() {
  if (!appStarted) return;

  playStartupAudio();
  window.removeEventListener("pointerdown", unlockAudioOnce);
  window.removeEventListener("keydown", unlockAudioOnce);
}

function showNearVideoEnd() {
  if (!appStarted || sectionMode || isReversePlaying || !video.duration || Number.isNaN(video.duration)) return;

  const secondsLeft = video.duration - video.currentTime;
  if (secondsLeft <= 5) {
    showOverlay();
  }
}

function playVideo() {
  revealVideo();
  const playAttempt = video.play();

  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {
      showOverlay();
      replayButton.classList.add("is-visible");
    });
  }
}

function playSection(index) {
  if (isReversePlaying) return;

  sectionMode = true;
  currentSectionIndex = index;
  backToMenu.disabled = true;
  showOverlay();
  document.body.classList.remove("section-ended", "reverse-mode");
  document.body.classList.add("detail-mode");

  const detail = sectionDetails[index];
  if (detail) {
    detailTitle.textContent = detail.title;
    detailDescription.textContent = detail.description;
  }

  const sectionVideo = `videolar/video${index}.mp4`;
  video.src = sectionVideo;
  video.currentTime = 0;
  video.load();
  video.addEventListener("canplay", playVideo, { once: true });
  playVideo();

  introSound.pause();
  sectionSound.pause();
  sectionSound.src = `sesler/ses${index}.mpeg`;
  sectionSound.currentTime = 0;
  applyAudioState();
  playMedia(backgroundMusic);
  playMedia(sectionSound);
}

function finishReverseToMenu() {
  sectionMode = false;
  isReversePlaying = false;
  backToMenu.disabled = false;
  currentSectionIndex = null;
  showBackgroundImage(INTRO_END_BG);
  document.body.classList.remove("detail-mode", "section-ended", "reverse-mode");
  showOverlay();
  playMedia(backgroundMusic);
}

function returnToMenu() {
  if (isReversePlaying || !currentSectionIndex || !document.body.classList.contains("section-ended")) return;

  isReversePlaying = true;
  backToMenu.disabled = true;
  document.body.classList.remove("section-ended");
  document.body.classList.add("reverse-mode");
  sectionSound.pause();
  sectionSound.removeAttribute("src");
  sectionSound.load();

  video.src = `videolar/video${currentSectionIndex}ters.mp4`;
  video.currentTime = 0;
  video.load();
  video.addEventListener("canplay", playVideo, { once: true });
  playVideo();
  playMedia(backgroundMusic);
}

function replayIntro() {
  sectionMode = false;
  isReversePlaying = false;
  currentSectionIndex = null;
  backToMenu.disabled = false;
  document.body.classList.remove("detail-mode", "section-ended", "reverse-mode");
  sectionSound.pause();
  sectionSound.removeAttribute("src");
  sectionSound.load();

  if (!video.currentSrc.endsWith(INTRO_VIDEO)) {
    video.src = INTRO_VIDEO;
    video.load();
  }

  setBackgroundImage(INTRO_START_BG);
  video.currentTime = 0;
  hideOverlay();
  playStartupAudio();
  playVideo();
}

video.addEventListener("loadedmetadata", () => {
  if (!appStarted || sectionMode || isReversePlaying) return;
  clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(showOverlay, Math.max((video.duration - 5) * 1000, 1200));
});

video.addEventListener("timeupdate", showNearVideoEnd);
video.addEventListener("ended", () => {
  if (isReversePlaying) {
    finishReverseToMenu();
    return;
  }

  if (sectionMode) {
    backToMenu.disabled = false;
    showBackgroundImage(`bgs/bg${currentSectionIndex}.jpg`);
    document.body.classList.add("section-ended");
    return;
  }

  if (!sectionMode) {
    showBackgroundImage(INTRO_END_BG);
    showOverlay();
  }
});
video.addEventListener("error", () => {
  if (isReversePlaying) {
    finishReverseToMenu();
  }
});
video.addEventListener("play", () => {
  if (!sectionMode && !isReversePlaying && video.currentTime < 0.4) {
    hideOverlay();
  }
});

soundToggle.addEventListener("click", () => {
  audioMuted = !audioMuted;
  applyAudioState();

  if (!audioMuted) {
    playStartupAudio();
    if (sectionSound.src) {
      playMedia(sectionSound);
    }
  }
});

replayButton.addEventListener("click", replayIntro);
backToMenu.addEventListener("click", returnToMenu);
startButton.addEventListener("click", () => {
  if (appStarted) return;

  appStarted = true;
  document.body.classList.add("app-started");
  setBackgroundImage(INTRO_START_BG);
  playStartupAudio();
  playVideo();
  clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(showOverlay, 12000);
});

glassElements.forEach((element) => {
  element.addEventListener("click", () => {
    playSection(element.dataset.mediaIndex);
  });

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playSection(element.dataset.mediaIndex);
    }
  });

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    element.style.setProperty("--mx", `${x}%`);
    element.style.setProperty("--my", `${y}%`);
  });
});

setBackgroundImage(INTRO_START_BG);
applyAudioState();
window.addEventListener("pointerdown", unlockAudioOnce);
window.addEventListener("keydown", unlockAudioOnce);
