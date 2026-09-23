const playlistEl = document.getElementById("playlist");
const whoEl = document.getElementById("who");
const lineEl = document.getElementById("line");
const progressEl = document.getElementById("progress");
const timeEl = document.getElementById("time");
const playBtn = document.getElementById("playBtn");
const topicTitle = document.getElementById("topicTitle");
const mayaCard = document.getElementById("mayaCard");
const alexCard = document.getElementById("alexCard");
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const speedEl = document.getElementById("speed");
const voiceToggle = document.getElementById("voiceToggle");
const statusEl = document.getElementById("audioStatus");
const audioEl = document.getElementById("lineAudio");

let topicIndex = 0;
let lineIndex = 0;
let playing = false;
let timer = null;
let waitingForAudio = false;

function totalLines(topic) {
  return topic.lines.length;
}

function clipUrl() {
  const topic = CONVERSATIONS[topicIndex];
  return `assets/audio/${topic.id}-${lineIndex}.mp3`;
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  CONVERSATIONS.forEach((topic, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${topic.title} · ${topic.durationHint}`;
    btn.className = index === topicIndex ? "active" : "";
    btn.addEventListener("click", () => loadTopic(index, true));
    playlistEl.appendChild(btn);
  });
}

function setActiveSpeaker(id) {
  mayaCard.classList.toggle("active", id === "maya");
  alexCard.classList.toggle("active", id === "alex");
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function showLine() {
  const topic = CONVERSATIONS[topicIndex];
  const item = topic.lines[lineIndex];
  const speaker = SPEAKERS[item.speaker];
  whoEl.textContent = `${speaker.name} · ${speaker.role}`;
  lineEl.textContent = item.text;
  topicTitle.textContent = topic.title;
  setActiveSpeaker(item.speaker);
  const pct = ((lineIndex + 1) / totalLines(topic)) * 100;
  progressEl.style.width = `${pct}%`;
  timeEl.textContent = `${lineIndex + 1} / ${totalLines(topic)}`;
}

function clearTimer() {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
}

function fallbackDuration() {
  const words = CONVERSATIONS[topicIndex].lines[lineIndex].text.split(/\s+/).length;
  return Math.max(4000, (words / 2.4) * 1000) / Number(speedEl.value);
}

function stopAudio() {
  waitingForAudio = false;
  audioEl.pause();
  audioEl.removeAttribute("src");
  audioEl.load();
}

function scheduleFallback() {
  clearTimer();
  timer = window.setTimeout(() => {
    if (playing && !waitingForAudio) nextLine();
  }, fallbackDuration());
}

function playCurrentAudio() {
  clearTimer();
  if (!voiceToggle.checked) {
    setStatus("Sound is off — captions only.");
    scheduleFallback();
    return;
  }

  waitingForAudio = true;
  audioEl.playbackRate = Number(speedEl.value);
  audioEl.volume = 1;
  audioEl.src = clipUrl();
  setStatus("Speaking… turn up device volume if needed.");

  const playPromise = audioEl.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => {
        waitingForAudio = false;
        setStatus(`Playing ${SPEAKERS[CONVERSATIONS[topicIndex].lines[lineIndex].speaker].name}`);
      })
      .catch(() => {
        waitingForAudio = false;
        setStatus("Could not start audio automatically. Press Play again after clicking the page.");
        scheduleFallback();
      });
  }
}

function play() {
  playing = true;
  playBtn.textContent = "Pause";
  playBtn.setAttribute("aria-pressed", "true");
  showLine();
  playCurrentAudio();
}

function pause() {
  playing = false;
  playBtn.textContent = "Play";
  playBtn.setAttribute("aria-pressed", "false");
  clearTimer();
  waitingForAudio = false;
  audioEl.pause();
  setStatus("Paused.");
}

function nextLine() {
  const topic = CONVERSATIONS[topicIndex];
  if (lineIndex < topic.lines.length - 1) {
    lineIndex += 1;
    showLine();
    if (playing) playCurrentAudio();
  } else if (topicIndex < CONVERSATIONS.length - 1) {
    loadTopic(topicIndex + 1, playing);
  } else {
    pause();
    setStatus("End of playlist.");
  }
}

function prevLine() {
  if (lineIndex > 0) {
    lineIndex -= 1;
    showLine();
    if (playing) playCurrentAudio();
  } else if (topicIndex > 0) {
    loadTopic(topicIndex - 1, playing);
    lineIndex = CONVERSATIONS[topicIndex].lines.length - 1;
    showLine();
    if (playing) playCurrentAudio();
  }
}

function loadTopic(index, autoplay) {
  stopAudio();
  topicIndex = index;
  lineIndex = 0;
  renderPlaylist();
  showLine();
  if (autoplay) play();
  else {
    playing = false;
    playBtn.textContent = "Play";
    setStatus("Press Play to hear this conversation.");
  }
}

audioEl.addEventListener("ended", () => {
  if (playing) nextLine();
});

audioEl.addEventListener("error", () => {
  waitingForAudio = false;
  if (playing) {
    setStatus("Audio clip missing — advancing on timer.");
    scheduleFallback();
  }
});

playBtn.addEventListener("click", () => {
  if (playing) pause();
  else if (audioEl.src && !audioEl.ended && audioEl.currentTime > 0) {
    playing = true;
    playBtn.textContent = "Pause";
    audioEl.playbackRate = Number(speedEl.value);
    audioEl.play().catch(() => play());
    setStatus("Speaking…");
  } else {
    play();
  }
});

document.getElementById("nextBtn").addEventListener("click", nextLine);
document.getElementById("prevBtn").addEventListener("click", prevLine);

speedEl.addEventListener("change", () => {
  audioEl.playbackRate = Number(speedEl.value);
});

voiceToggle.addEventListener("change", () => {
  if (!voiceToggle.checked) {
    audioEl.pause();
    if (playing) scheduleFallback();
    setStatus("Sound is off — captions only.");
  } else if (playing) {
    playCurrentAudio();
  }
});

menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

renderPlaylist();
loadTopic(0, false);
