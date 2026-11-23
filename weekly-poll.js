"use strict";

const weeklyPollEndpoint = "https://br-winter-salad-bh4879ny-weeklypoll.compute.c-10.eu-central-1.aws.neon.tech/";

function createWeeklyPoll({ byId, foodPath, priceText, onPlay }) {
  const translations = {
    tr: {
      jump: "Haftanın oylaması", title: "Haftaya menüye ne girsin?", refresh: "Oyları yenile", retry: "Tekrar dene",
      loading: "Ortak oylar yükleniyor…", awaiting: "Yeni oylama hazırlanıyor.",
      unavailable: "Oylar şu anda alınamıyor. Tekrar deneyebilirsin.",
      offline: "Haftalık oylama çevrimiçi menüde açılır.",
      voted: "Oyun kaydedildi.", chosen: "Oyun", sending: "Oy kaydediliyor…", vote: "Oy ver",
      votes: count => count + " oy", closes: date => "Oylama " + date + " tarihinde kapanır", winner: "Haftanın özel içeceği",
      play: track => track + " parçasını çal", pause: track => track + " parçasını duraklat",
      audioError: "Parça açılmadı. Tekrar deneyebilirsin.",
    },
    en: {
      jump: "Weekly vote", title: "What goes on next week’s menu?", refresh: "Refresh votes", retry: "Try again",
      loading: "Loading shared results…", awaiting: "A new vote is being prepared.",
      unavailable: "Voting is unavailable right now. Try again in a moment.",
      offline: "The weekly vote is available in the online menu.",
      voted: "Your vote is saved.", chosen: "Your vote", sending: "Saving your vote…", vote: "Vote",
      votes: count => count + (count === 1 ? " vote" : " votes"), closes: date => "Voting closes " + date, winner: "This week’s featured drink",
      play: track => "Play " + track, pause: track => "Pause " + track,
      audioError: "The track could not play. Try again.",
    },
  };
  const formats = Object.fromEntries([["tr", "tr-TR"], ["en", "en-IE"]].map(([key, locale]) => [key, new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul",
  })]));
  const section = byId("weekly");
  const status = byId("weekly-status");
  const deadline = byId("weekly-deadline");
  const grid = byId("weekly-grid");
  const winnerBox = byId("weekly-winner");
  const refreshButton = byId("weekly-refresh");
  const catalog = new Map(weeklyDrinks.map(drink => [drink.id, drink]));
  const online = (location.protocol === "http:" || location.protocol === "https:") && Boolean(weeklyPollEndpoint);
  const audio = new Audio();
  audio.preload = "none";
  audio.volume = .75;

  const storagePrefix = "sofra-fm:weekly:";
  const memory = new Map();
  let lang = "tr";
  let response;
  let busy = false;
  let alertKey = online ? "" : "offline";
  let audioId = "";
  let playAttempt = 0;
  const text = key => translations[lang][key];

  function stored(key) {
    try {
      return localStorage.getItem(storagePrefix + key) ?? memory.get(key);
    } catch {
      return memory.get(key);
    }
  }

  function remember(key, value) {
    const string = String(value);
    memory.set(key, string);
    try {
      localStorage.setItem(storagePrefix + key, string);
    } catch {
      // The active page can keep the receipt while storage is unavailable.
    }
  }

  function visitor() {
    const key = "visitor";
    const original = stored(key);
    if (original) return original;
    const id = crypto.randomUUID();
    remember(key, id);
    return id;
  }

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }

  function sharedRound(round) {
    return round && typeof round.id === "string" && !Number.isNaN(Date.parse(round.closesAt)) &&
      round.options?.length === 2 && round.options.every(id => catalog.has(id)) &&
      round.counts?.length === 2 && round.counts.every(count => Number.isInteger(count) && count >= 0) ? round : null;
  }

  function buildDrink(drink) {
    const item = node("article", "weekly-drink");
    const image = node("img", "weekly-photo");
    image.src = foodPath(drink.id);
    image.alt = "";
    image.width = 623;
    image.height = 623;
    image.loading = "lazy";
    const details = node("div", "weekly-info");
    const row = node("div", "weekly-name");
    row.append(node("h3", "", drink.name[lang]), node("strong", "", priceText(drink.price)));
    const sound = node("button", "weekly-sound");
    sound.type = "button";
    sound.dataset.weeklyPlay = drink.id;
    const glyph = node("span", "play-icon");
    glyph.setAttribute("aria-hidden", "true");
    sound.append(glyph, node("span", "", drink.track[lang]));
    details.append(row, node("p", "", drink.detail[lang]), sound);
    item.append(image, details);
    return { item, details };
  }

  function syncAudio() {
    section.querySelectorAll("[data-weekly-play]").forEach(button => {
      const isPlaying = !audio.paused && button.dataset.weeklyPlay === audioId;
      const track = catalog.get(button.dataset.weeklyPlay).track[lang];
      button.dataset.playing = String(isPlaying);
      button.setAttribute("aria-label", text(isPlaying ? "pause" : "play")(track));
    });
  }

  function render() {
    const current = sharedRound(response?.current);
    const previous = sharedRound(response?.previous);
    const vote = current ? stored("vote:" + current.id) : undefined;
    const hasVoted = vote === "0" || vote === "1";
    status.textContent = text(alertKey || (response && !current ? "awaiting" : "")) || "";
    status.hidden = !status.textContent;
    refreshButton.disabled = busy;
    refreshButton.hidden = !online;
    refreshButton.textContent = text(alertKey === "unavailable" ? "retry" : "refresh");
    deadline.hidden = !current;
    if (current) {
      deadline.dateTime = current.closesAt;
      deadline.textContent = text("closes")(formats[lang].format(new Date(current.closesAt)));
      const sum = current.counts[0] + current.counts[1];
      grid.replaceChildren(...current.options.map((id, index) => {
        const { item, details } = buildDrink(catalog.get(id));
        const button = node("button", "weekly-vote", text(vote === String(index) ? "chosen" : "vote"));
        button.type = "button";
        button.dataset.voteChoice = index;
        button.setAttribute("aria-pressed", String(vote === String(index)));
        button.setAttribute("aria-label", button.textContent + " · " + catalog.get(id).name[lang]);
        button.disabled = busy || hasVoted;
        const row = node("div", "weekly-results-line");
        row.append(node("span", "", text("votes")(current.counts[index])), button);
        const bar = node("span", "weekly-bar");
        bar.style.setProperty("--vote-share", (sum ? current.counts[index] * 100 / sum : 0) + "%");
        bar.setAttribute("aria-hidden", "true");
        details.append(row, bar);
        return item;
      }));
    } else {
      grid.replaceChildren();
    }
    if (previous && previous.counts[0] !== previous.counts[1]) {
      const winner = catalog.get(previous.options[previous.counts[0] > previous.counts[1] ? 0 : 1]);
      winnerBox.replaceChildren(node("h3", "weekly-winner-title", text("winner")), buildDrink(winner).item);
      winnerBox.hidden = false;
    } else {
      winnerBox.replaceChildren();
      winnerBox.hidden = true;
    }
    syncAudio();
  }

  async function requestVote(ballot) {
    const choice = ballot?.choice;
    busy = true;
    alertKey = ballot ? "sending" : "loading";
    status.textContent = text(alertKey);
    status.hidden = false;
    refreshButton.disabled = true;
    grid.querySelectorAll("[data-vote-choice]").forEach(button => { button.disabled = true; });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const result = await fetch(weeklyPollEndpoint, {
        cache: "no-store", credentials: "omit", signal: controller.signal,
        ...(ballot ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ballot) } : {}),
      });
      const payload = await result.json();
      if (!result.ok && !(result.status === 409 && payload.error === "round_closed")) throw new Error("Vote unavailable");
      if (ballot && (payload.choice === 0 || payload.choice === 1)) remember("vote:" + ballot.round, payload.choice);
      response = payload;
      alertKey = ballot && result.ok ? "voted" : "";
    } catch {
      alertKey = "unavailable";
    } finally {
      clearTimeout(timeout);
      busy = false;
      render();
      if (choice !== undefined && !document.activeElement?.closest(".weekly-section")) {
        const target = alertKey === "unavailable" ? grid.querySelector('[data-vote-choice="' + choice + '"]') : refreshButton;
        target?.focus({ preventScroll: true });
      }
    }
  }

  function pause() {
    playAttempt += 1;
    audio.pause();
  }

  async function play(id) {
    if (id === audioId && !audio.paused) {
      pause();
      return;
    }
    const attempt = ++playAttempt;
    if (id !== audioId) {
      audioId = id;
      audio.src = "assets/tracks/" + id + ".mp3";
    }
    onPlay();
    try {
      await audio.play();
    } catch {
      if (attempt === playAttempt) {
        status.textContent = text("audioError");
        status.hidden = false;
      }
    }
    syncAudio();
  }

  section.addEventListener("click", event => {
    const player = event.target.closest("[data-weekly-play]");
    const button = event.target.closest("[data-vote-choice]");
    if (player) void play(player.dataset.weeklyPlay);
    if (button && !busy && response?.current) {
      try {
        void requestVote({ round: response.current.id, choice: Number(button.dataset.voteChoice), visitor: visitor() });
      } catch {
        alertKey = "unavailable";
        render();
      }
    }
  });
  ["playing", "pause", "ended"].forEach(event => audio.addEventListener(event, syncAudio));
  refreshButton.addEventListener("click", () => { if (!busy) void requestVote(); });
  window.addEventListener("storage", event => {
    if (!busy && event.key?.startsWith(storagePrefix + "vote:")) render();
  });
  if (online && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        if (!busy && !response) void requestVote();
      }
    }, { rootMargin: "300px" });
    observer.observe(section);
  } else if (online) {
    void requestVote();
  }

  return {
    pause,
    setLanguage(language) {
      lang = language;
      document.querySelectorAll("[data-vote-copy]").forEach(element => {
        element.textContent = text(element.dataset.voteCopy);
      });
      render();
    },
  };
}
