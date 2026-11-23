(() => {
  "use strict";

  const translations = {
    tr: {
      skip: "Menüye geç", menuLink: "Menü", language: "Dil seçimi", tagline: "Menüyü dinle",
      player: "Müzik oynatıcı", seek: "Parça konumu", mute: "Sesi kapat", browse: "Ürünler arasında gezin",
      previous: "Önceki ürün", next: "Sonraki ürün", share: "Ürünü paylaş", menuHeading: "Tam menü",
      categories: "Menü kategorileri", all: "Tümü", count: number => number + " ürün", top: "Yukarı çık",
      openPlayer: "Oynatıcıyı aç", copyLabel: "Ürün bağlantısı", close: "Kapat",
      play: "Oynat", pause: "Duraklat", openDish: name => name + " ürün detayını aç",
      audioError: "Parça açılamadı. Tekrar oynatmayı dene.",
      copied: "Ürün bağlantısı kopyalandı.",
      position: (current, total) => total + " üründen " + current + ". ürün",
    },
    en: {
      skip: "Skip to the menu", menuLink: "Menu", language: "Language", tagline: "Listen to the menu",
      player: "Music player", seek: "Playback position", mute: "Mute audio", browse: "Browse dishes",
      previous: "Previous dish", next: "Next dish", share: "Share dish", menuHeading: "Full menu",
      categories: "Menu categories", all: "All", count: number => number + " items", top: "Back to top",
      openPlayer: "Open music player", copyLabel: "Dish link", close: "Close",
      play: "Play", pause: "Pause", openDish: name => "Open details for " + name,
      audioError: "This track could not load. Try playing it again.",
      copied: "Dish link copied.",
      position: (current, total) => "Item " + current + " of " + total,
    },
  };

  const turkishGenres = {
    "Soft jazz": "Yumuşak caz",
    "Late night jazz": "Gece cazı",
    "Soul jazz": "Soul caz",
    "French jazz": "Fransız cazı",
    "Ambient jazz": "Ambient caz",
    "Café jazz": "Kafe cazı",
    "Minimal house": "Minimal house",
    "Tropical jazz": "Tropikal caz",
    "Garden jazz": "Bahçe cazı",
    "Sunshine funk": "Gündüz funk",
    "Soft pop": "Yumuşak pop",
  };

  const find = selector => document.querySelector(selector);
  const byId = id => document.getElementById(id);
  const productById = new Map(products.map(product => [product.id, product]));
  const start = new URLSearchParams(location.search);
  const validLanguage = value => value === "en" || value === "tr";

  function readPreference(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function savePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The active session still works when storage is unavailable.
    }
  }

  const savedLanguage = readPreference("sofra-language");
  const initialLanguage = start.get("lang");
  const state = {
    lang: validLanguage(initialLanguage) ? initialLanguage : (validLanguage(savedLanguage) ? savedLanguage : "tr"),
    filter: "all",
    product: productById.get(start.get("dish")) || productById.get("koz-burger"),
    playerVisible: true,
  };

  const audio = byId("audio");
  const seek = byId("seek");
  const player = byId("player");
  const mini = byId("mini-player");
  const mute = byId("mute");
  const groups = byId("menu-groups");
  const filters = byId("filters");
  const wave = byId("waveform");
  const dishImage = byId("dish-image");
  const featurePhoto = byId("feature-photo");
  const share = byId("share");
  const shareDialog = byId("share-dialog");
  const alert = byId("status");
  const audioError = byId("audio-error");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const onWeb = location.protocol === "https:" || location.protocol === "http:";
  let noticeTimeout;
  let playAttempt = 0;

  const text = key => translations[state.lang][key];
  const inLanguage = pair => pair[state.lang];
  const foodPath = id => "assets/food/" + id + ".webp";
  const audioPath = id => "assets/tracks/" + id + ".mp3";
  const priceText = amount => new Intl.NumberFormat(state.lang === "tr" ? "tr-TR" : "en-GB").format(amount) + " MKD";

  function timing(seconds) {
    const rounded = Math.max(0, Math.floor(seconds));
    return Math.floor(rounded / 60) + ":" + String(rounded % 60).padStart(2, "0");
  }

  function syncProgress() {
    const expectedDuration = trackData[state.product.id].duration;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : expectedDuration;
    const elapsed = Math.min(audio.currentTime, duration);
    seek.max = String(duration);
    seek.value = String(elapsed);
    seek.setAttribute("aria-valuetext", timing(elapsed) + " / " + timing(duration));
    byId("time-elapsed").textContent = timing(elapsed);
    byId("time-total").textContent = timing(duration);

    const filled = Math.floor(elapsed / duration * wave.children.length);
    Array.from(wave.children).forEach((bar, index) => bar.classList.toggle("elapsed", index < filled));
  }

  function syncPlayback() {
    const playing = !audio.paused && !audio.error;
    player.dataset.playing = String(playing);
    mini.hidden = !playing || state.playerVisible;
    document.querySelectorAll("[data-play]").forEach(button => {
      const product = productById.get(button.dataset.play) || state.product;
      const active = playing && product.id === state.product.id;
      button.dataset.playing = String(active);
      button.setAttribute("aria-label", text(active ? "pause" : "play") + " · " + inLanguage(product.track));
    });
  }

  function paintWave() {
    const bars = trackData[state.product.id].wave.map(amplitude => {
      const bar = document.createElement("span");
      bar.style.setProperty("--amplitude", amplitude + "%");
      return bar;
    });
    wave.replaceChildren(...bars);
  }

  function setProductCopy() {
    const { product, lang } = state;
    const section = sections.find(entry => entry.id === product.section);
    const name = inLanguage(product.name);
    const track = inLanguage(product.track);
    const position = products.indexOf(product) + 1;
    const genre = lang === "tr" ? (turkishGenres[product.genre] || product.genre) : product.genre;
    byId("dish-category").textContent = inLanguage(section.name);
    byId("dish-name").textContent = name;
    byId("dish-detail").textContent = inLanguage(product.detail);
    byId("dish-price").textContent = priceText(product.price);
    byId("track-name").textContent = track;
    byId("track-genre").textContent = genre + " · " + product.bpm + " BPM";
    byId("mini-name").textContent = track;
    byId("mini-dish").textContent = name;
    dishImage.alt = name;
    byId("dish-position").textContent = String(position).padStart(2, "0") + " / " + products.length;
    byId("dish-position").setAttribute("aria-label", text("position")(position, products.length));
    document.title = name + " · Sofra FM";
    find('meta[name="description"]').content = inLanguage(product.detail);
    audioError.textContent = text("audioError");
  }

  function setPhoto(animate) {
    const path = foodPath(state.product.id);
    if (dishImage.getAttribute("src") === path) {
      return;
    }

    dishImage.src = path;
    byId("record-image").src = path;
    byId("mini-image").src = path;
    if (animate) {
      featurePhoto.classList.remove("is-changing");
      requestAnimationFrame(() => featurePhoto.classList.add("is-changing"));
    }
  }

  function syncSelectedCard() {
    groups.querySelectorAll(".product-card").forEach(card => {
      card.dataset.selected = String(card.dataset.id === state.product.id);
    });
  }

  function updateAddress() {
    if (!onWeb) {
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", state.lang);
    url.searchParams.set("dish", state.product.id);
    history.replaceState(null, "", url);
  }

  function loadTrack() {
    playAttempt += 1;
    audio.pause();
    audio.src = audioPath(state.product.id);
    audio.load();
    audioError.hidden = true;
    paintWave();
    syncProgress();
  }

  async function playTrack() {
    if (audio.error) {
      loadTrack();
    }
    const thisAttempt = ++playAttempt;
    audioError.hidden = true;
    try {
      await audio.play();
    } catch (error) {
      if (thisAttempt === playAttempt && error.name !== "AbortError") {
        audioError.hidden = false;
      }
    } finally {
      syncPlayback();
    }
  }

  function selectProduct(product, playAfterSelection) {
    if (product === state.product) {
      if (playAfterSelection) {
        void playTrack();
      }
      return;
    }
    state.product = product;
    loadTrack();
    setProductCopy();
    setPhoto(true);
    syncSelectedCard();
    syncPlayback();
    updateAddress();
    if (playAfterSelection) {
      void playTrack();
    }
  }

  function toggleProduct(product) {
    if (product === state.product && !audio.paused) {
      playAttempt += 1;
      audio.pause();
      return;
    }
    selectProduct(product, true);
  }

  function browse(direction) {
    const index = products.indexOf(state.product);
    const target = (index + direction + products.length) % products.length;
    selectProduct(products[target], !audio.paused);
  }

  function createCard(product) {
    const card = byId("card-template").content.firstElementChild.cloneNode(true);
    card.dataset.id = product.id;
    card.querySelector(".product-name button").textContent = inLanguage(product.name);
    card.querySelector(".product-detail").textContent = inLanguage(product.detail);
    card.querySelector(".product-price").textContent = priceText(product.price);
    card.querySelector(".product-track-name").textContent = inLanguage(product.track);
    card.querySelector(".product-image-button").setAttribute("aria-label", text("openDish")(inLanguage(product.name)));
    card.querySelector("img").src = foodPath(product.id);
    card.querySelector("[data-play]").dataset.play = product.id;
    return card;
  }

  function renderMenu() {
    const visibleSections = sections.filter(section => state.filter === "all" || section.id === state.filter);
    const parts = [];
    let count = 0;
    for (const section of visibleSections) {
      const group = document.createElement("section");
      group.className = "menu-group";
      const heading = document.createElement("h3");
      heading.textContent = inLanguage(section.name);
      const grid = document.createElement("div");
      grid.className = "product-grid";
      const items = products.filter(product => product.section === section.id);
      grid.append(...items.map(createCard));
      group.append(heading, grid);
      parts.push(group);
      count += items.length;
    }
    groups.replaceChildren(...parts);
    byId("item-count").textContent = text("count")(count);
    filters.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
    });
    syncSelectedCard();
    syncPlayback();
  }

  function renderLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-copy]").forEach(element => {
      element.textContent = text(element.dataset.copy);
    });
    document.querySelectorAll("[data-label]").forEach(element => {
      element.setAttribute("aria-label", text(element.dataset.label));
    });
    document.querySelectorAll("[data-lang]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
    });
    const choices = [{ id: "all", label: text("all") }, ...sections.map(section => ({
      id: section.id,
      label: inLanguage(section.name),
    }))];
    filters.replaceChildren(...choices.map(choice => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-button";
      button.dataset.filter = choice.id;
      button.textContent = choice.label;
      return button;
    }));
    setProductCopy();
    renderMenu();
  }

  function notify(message) {
    clearTimeout(noticeTimeout);
    alert.hidden = false;
    alert.textContent = message;
    noticeTimeout = setTimeout(() => {
      alert.hidden = true;
      alert.textContent = "";
    }, 2400);
  }

  async function shareProduct() {
    const url = new URL(location.href);
    url.search = new URLSearchParams({ lang: state.lang, dish: state.product.id }).toString();
    url.hash = "";
    const address = url.toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: inLanguage(state.product.name) + " · Sofra FM", url: address });
        return;
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(address);
        notify(text("copied"));
        return;
      } catch {
        // The manual copy field also works without clipboard permission.
      }
    }
    const field = byId("share-url");
    field.value = address;
    shareDialog.showModal();
    field.select();
  }

  function goToFeature(focus) {
    featurePhoto.scrollIntoView({ block: "start", behavior: motion.matches ? "instant" : "smooth" });
    focus.focus({ preventScroll: true });
  }

  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => {
    if (state.lang !== button.dataset.lang) {
      state.lang = button.dataset.lang;
      savePreference("sofra-language", state.lang);
      renderLanguage();
      updateAddress();
    }
  }));
  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (button && state.filter !== button.dataset.filter) {
      state.filter = button.dataset.filter;
      renderMenu();
    }
  });
  groups.addEventListener("click", event => {
    const button = event.target.closest("button");
    const card = button?.closest(".product-card");
    if (card) {
      const product = productById.get(card.dataset.id);
      if ("play" in button.dataset) {
        toggleProduct(product);
      } else {
        selectProduct(product, !audio.paused);
        goToFeature(byId("dish-name"));
      }
    }
  });

  byId("main-play").addEventListener("click", () => toggleProduct(state.product));
  byId("mini-play").addEventListener("click", () => {
    const currentCardPlay = groups.querySelector('[data-play="' + state.product.id + '"]');
    (currentCardPlay || byId("main-play")).focus({ preventScroll: true });
    toggleProduct(state.product);
  });
  byId("previous").addEventListener("click", () => browse(-1));
  byId("next").addEventListener("click", () => browse(1));
  byId("mini-track").addEventListener("click", () => goToFeature(byId("main-play")));
  share.addEventListener("click", () => { void shareProduct(); });
  share.hidden = !onWeb;
  seek.addEventListener("input", () => {
    audio.currentTime = Number(seek.value);
    syncProgress();
  });
  mute.addEventListener("click", () => {
    audio.muted = !audio.muted;
    mute.setAttribute("aria-pressed", String(audio.muted));
    savePreference("sofra-muted", String(audio.muted));
  });
  ["loadedmetadata", "timeupdate", "seeked"].forEach(event => audio.addEventListener(event, syncProgress));
  ["play", "pause", "ended", "playing"].forEach(event => audio.addEventListener(event, syncPlayback));
  audio.addEventListener("error", () => {
    if (audio.error) {
      audioError.hidden = false;
      syncPlayback();
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      state.playerVisible = entry.intersectionRatio >= .7;
      syncPlayback();
    }, { threshold: [0, .7, 1] });
    observer.observe(player);
  }

  audio.volume = 0.75;
  audio.muted = readPreference("sofra-muted") === "true";
  mute.setAttribute("aria-pressed", String(audio.muted));
  byId("dish-name").setAttribute("tabindex", "-1");
  loadTrack();
  setPhoto(false);
  renderLanguage();
})();
