(() => {
  "use strict";

  const translations = {
    tr: {
      skip: "Menüye geç", menuLink: "Menü", language: "Dil seçimi", tagline: "Menüyü dinle",
      player: "Müzik oynatıcı", seek: "Parça konumu", mute: "Sesi kapat", browse: "Ürünler arasında gezin",
      previous: "Önceki ürün", next: "Sonraki ürün", share: "Ürünü paylaş", menuHeading: "Tam menü",
      categories: "Menü kategorileri", all: "Tümü", count: number => number + " ürün", top: "Yukarı çık",
      search: "Menüde ara", noItems: "Aramana uygun ürün bulunamadı.",
      openPlayer: "Oynatıcıyı aç", copyLabel: "Ürün bağlantısı", close: "Kapat",
      play: "Oynat", pause: "Duraklat", openDish: name => name + " ürün detayını aç",
      audioError: "Parça açılamadı. Tekrar oynatmayı dene.",
      copied: "Ürün bağlantısı kopyalandı.",
      position: (current, total) => total + " üründen " + current + ". ürün",
      story: "Hikâye videosu", mixer: "Mutfak Mikseri", tastings: "Tadım seçkileri", tastingsLink: "Seçkiler",
      listenTasting: "Seçkiyi dinle", pauseTasting: "Seçkiyi duraklat", shareTasting: "Seçkiyi paylaş",
      tastingLink: "Seçki bağlantısı", tastingCopied: "Seçki bağlantısı kopyalandı.",
      tastingTotal: "Seçki toplamı", musicStyle: "Müzik tarzı", musicAll: "Tüm tarzlar",
      openShowcase: "Vitrin modu", showcaseControls: "Vitrin kontrolleri",
      showcaseHold: "Durdur", showcaseResume: "Devam et", showcaseSound: "Müzik",
      productQr: "Ürünün QR kodu", openProduct: "Ürünü aç", qrOffline: "QR kod için menüyü web adresinden açın.",
      fullscreen: "Tam ekran", exitFullscreen: "Tam ekrandan çık",
      fullscreenError: "Vitrin pencereyi dolduruyor. Tam ekran için tarayıcının kendi seçeneğini kullanabilirsin.",
    },
    en: {
      skip: "Skip to the menu", menuLink: "Menu", language: "Language", tagline: "Listen to the menu",
      player: "Music player", seek: "Playback position", mute: "Mute audio", browse: "Browse dishes",
      previous: "Previous dish", next: "Next dish", share: "Share dish", menuHeading: "Full menu",
      categories: "Menu categories", all: "All", count: number => number + (number === 1 ? " item" : " items"), top: "Back to top",
      search: "Search the menu", noItems: "No items match your search.",
      openPlayer: "Open music player", copyLabel: "Dish link", close: "Close",
      play: "Play", pause: "Pause", openDish: name => "Open details for " + name,
      audioError: "This track could not load. Try playing it again.",
      copied: "Dish link copied.",
      position: (current, total) => "Item " + current + " of " + total,
      story: "Story video", mixer: "Kitchen Mixer", tastings: "Tasting menus", tastingsLink: "Tastings",
      listenTasting: "Play tasting menu", pauseTasting: "Pause tasting menu", shareTasting: "Share tasting menu",
      tastingLink: "Tasting menu link", tastingCopied: "Tasting menu link copied.",
      tastingTotal: "Tasting menu total", musicStyle: "Music style", musicAll: "All styles",
      openShowcase: "Display mode", showcaseControls: "Display controls",
      showcaseHold: "Pause rotation", showcaseResume: "Resume rotation", showcaseSound: "Music",
      productQr: "Dish QR code", openProduct: "Open dish", qrOffline: "Open the menu at its web address to show the QR code.",
      fullscreen: "Full screen", exitFullscreen: "Exit full screen",
      fullscreenError: "The display fills this window. You can also use the browser’s full screen control.",
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
  const tastingById = new Map(tastings.map(tasting => {
    const items = tasting.dishes.map(id => productById.get(id));
    const totalCents = items.reduce((sum, product) => sum + Math.round(product.price * 100), 0);
    return [tasting.id, { ...tasting, items, total: totalCents / 100 }];
  }));
  const musicById = new Map(musicStyles.map(style => [style.id, style.genres]));
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
  const linkedTasting = tastingById.get(start.get("tasting"));
  const linkedDish = productById.get(start.get("dish"));
  const firstDish = linkedTasting
    ? (linkedTasting.items.includes(linkedDish) ? linkedDish : linkedTasting.items[0])
    : (linkedDish || productById.get("koz-burger"));
  const state = {
    lang: validLanguage(initialLanguage) ? initialLanguage : (validLanguage(savedLanguage) ? savedLanguage : "tr"),
    filter: "all",
    music: "all",
    query: [],
    product: firstDish,
    tasting: linkedTasting || null,
    playerVisible: true,
  };

  const audio = byId("audio");
  const seek = byId("seek");
  const player = byId("player");
  const mini = byId("mini-player");
  const mute = byId("mute");
  const groups = byId("menu-groups");
  const filters = byId("filters");
  const search = byId("menu-search");
  const showAll = byId("show-all");
  const musicFilter = byId("music-style");
  const tastingGrid = byId("tasting-grid");
  const story = byId("story");
  const openMixer = byId("open-mixer");
  const showcase = byId("showcase");
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
  const display = { rotating: false, sound: false, timer: 0, previousMute: false, ownsFullscreen: false };
  const DISPLAY_SECONDS = 9;

  const text = key => translations[state.lang][key];
  const inLanguage = pair => pair[state.lang];
  const foodPath = id => "assets/food/" + id + ".webp";
  const audioPath = id => "assets/tracks/" + id + ".mp3";
  const tastingAnchor = tasting => "tasting-" + tasting.id;
  const playbackItems = () => state.tasting?.items || products;
  const currency = { style: "currency", currency: "EUR" };
  const priceFormatters = {
    tr: new Intl.NumberFormat("tr-TR", currency),
    en: new Intl.NumberFormat("en-IE", currency),
  };
  const priceText = amount => priceFormatters[state.lang].format(amount);
  const weekly = createWeeklyPoll({ byId, foodPath, priceText, onPlay: pauseTrack });
  const mixer = createKitchenMixer({ productById, foodPath, priceText, pauseTrack: () => {
    pauseTrack();
    weekly.pause();
  } });
  const menuTools = createMenuTools({ catalog: products, byId, foodPath, priceText, openProduct: openToolProduct });

  function searchable(value) {
    return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ı", "i");
  }

  const searchIndex = new Map(products.map(product => [
    product.id,
    searchable([product.name, product.detail, product.track].flatMap(pair => Object.values(pair)).join(" ")),
  ]));

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
    const playing = !audio.paused && !audio.ended && !audio.error;
    player.dataset.playing = String(playing);
    mini.hidden = !playing || state.playerVisible || showcase.open;
    document.querySelectorAll("[data-play]").forEach(button => {
      const product = productById.get(button.dataset.play) || state.product;
      const active = playing && product.id === state.product.id;
      button.dataset.playing = String(active);
      button.setAttribute("aria-label", text(active ? "pause" : "play") + " · " + inLanguage(product.track));
    });
    for (const card of tastingGrid.children) {
      const selected = card.dataset.tasting === state.tasting?.id;
      const active = selected && playing;
      const button = card.querySelector(".tasting-play");
      const label = text(active ? "pauseTasting" : "listenTasting");
      card.dataset.selected = String(selected);
      button.dataset.playing = String(active);
      button.querySelector(".tasting-play-label").textContent = label;
      button.setAttribute("aria-label", label + " · " + inLanguage(tastingById.get(card.dataset.tasting).name));
    }
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
    const queue = playbackItems();
    const position = queue.indexOf(product) + 1;
    const genre = lang === "tr" ? (turkishGenres[product.genre] || product.genre) : product.genre;
    byId("dish-category").textContent = inLanguage(section.name);
    byId("dish-name").textContent = name;
    byId("dish-detail").textContent = inLanguage(product.detail);
    byId("dish-price").textContent = priceText(product.price);
    byId("track-name").textContent = track;
    byId("track-genre").textContent = genre + " · " + product.bpm + " BPM";
    byId("mini-name").textContent = track;
    byId("mini-dish").textContent = name;
    player.dataset.section = product.section;
    mini.dataset.section = product.section;
    dishImage.alt = name;
    byId("dish-position").textContent = String(position).padStart(2, "0") + " / " + queue.length;
    byId("dish-position").setAttribute("aria-label", text("position")(position, queue.length));
    const tastingLabel = byId("active-tasting");
    tastingLabel.hidden = !state.tasting;
    if (state.tasting) {
      tastingLabel.textContent = inLanguage(state.tasting.name) + " · " + priceText(state.tasting.total);
      tastingLabel.href = "#" + tastingAnchor(state.tasting);
    }
    story.href = "assets/stories/" + product.id + ".mp4";
    story.download = "Sofra-FM-" + product.id + ".mp4";
    story.setAttribute("aria-label", text("story") + " · " + name);
    openMixer.hidden = !mixer.has(product.id);
    byId("open-drink").hidden = !menuTools.hasRecipe(product.id);
    document.title = name + " · Sofra FM";
    find('meta[name="description"]').content = inLanguage(product.detail);
    audioError.textContent = text("audioError");
    if (showcase.open) {
      renderShowcase();
    }
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
    if (!onWeb || showcase.open) {
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", state.lang);
    url.searchParams.set("dish", state.product.id);
    if (state.tasting) {
      url.searchParams.set("tasting", state.tasting.id);
    } else {
      url.searchParams.delete("tasting");
    }
    history.replaceState(null, "", url);
  }

  function loadTrack() {
    playAttempt += 1;
    audio.pause();
    audio.src = audioPath(state.product.id);
    audio.loop = !state.tasting && !showcase.open;
    audio.load();
    audioError.hidden = true;
    paintWave();
    syncProgress();
  }

  async function playTrack() {
    if (mixer.isOpen()) {
      return;
    }
    weekly.pause();
    if (audio.error) {
      loadTrack();
    }
    const thisAttempt = ++playAttempt;
    audioError.hidden = true;
    try {
      await audio.play();
    } catch (error) {
      if (thisAttempt === playAttempt && error.name !== "AbortError") {
        showPlaybackError();
      }
    } finally {
      syncPlayback();
    }
  }

  function selectProduct(product, playAfterSelection, restart = false) {
    const changed = state.product !== product;
    state.product = product;
    if (changed || restart) {
      loadTrack();
      setPhoto(changed);
    }
    setProductCopy();
    syncSelectedCard();
    syncPlayback();
    updateAddress();
    if (playAfterSelection) {
      void playTrack();
    }
  }

  function pauseTrack() {
    playAttempt += 1;
    audio.pause();
    syncPlayback();
  }

  function togglePlayer() {
    if (!audio.paused) {
      pauseTrack();
    } else if (audio.ended && state.tasting && state.tasting.items.at(-1) === state.product) {
      selectProduct(state.tasting.items[0], true, true);
    } else {
      void playTrack();
    }
  }

  function setTasting(tasting) {
    state.tasting = tasting;
    audio.loop = !tasting && !showcase.open;
  }

  function toggleTasting(tasting) {
    if (tasting === state.tasting) {
      togglePlayer();
    } else {
      setTasting(tasting);
      selectProduct(tasting.items[0], true, true);
    }
  }

  function browse(direction) {
    const queue = playbackItems();
    const index = (queue.indexOf(state.product) + direction + queue.length) % queue.length;
    selectProduct(queue[index], !audio.paused);
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
    if (mixer.has(product.id)) {
      const button = card.querySelector(".mixer-card-button");
      button.querySelector(".mixer-card-label").textContent = text("mixer");
      button.setAttribute("aria-label", text("mixer") + " · " + inLanguage(product.name));
      button.hidden = false;
    }
    return card;
  }

  function createTastingCard(tasting) {
    const card = byId("tasting-template").content.firstElementChild.cloneNode(true);
    card.id = tastingAnchor(tasting);
    card.dataset.tasting = tasting.id;
    const name = inLanguage(tasting.name);
    card.querySelector("h3").textContent = name;
    const total = card.querySelector(".tasting-total");
    total.textContent = priceText(tasting.total);
    total.setAttribute("aria-label", text("tastingTotal") + " " + total.textContent);

    const photos = card.querySelector(".tasting-photos");
    const dishes = card.querySelector(".tasting-dishes");
    for (const item of tasting.items) {
      const image = document.createElement("img");
      image.src = foodPath(item.id);
      image.alt = "";
      image.width = 623;
      image.height = 623;
      image.loading = "lazy";
      image.decoding = "async";
      photos.append(image);

      const row = document.createElement("li");
      const itemName = document.createElement("strong");
      itemName.textContent = inLanguage(item.name);
      const trackName = document.createElement("small");
      trackName.textContent = inLanguage(item.track);
      const caption = document.createElement("span");
      const price = document.createElement("span");
      price.textContent = priceText(item.price);
      caption.append(itemName, trackName);
      row.append(caption, price);
      dishes.append(row);
    }
    const shareButton = card.querySelector(".tasting-share");
    shareButton.hidden = !onWeb;
    shareButton.setAttribute("aria-label", text("shareTasting") + " · " + name);
    shareButton.querySelector(".tasting-share-label").textContent = text("shareTasting");
    return card;
  }

  function renderMenu() {
    const visibleSections = sections.filter(section => state.filter === "all" || section.id === state.filter);
    const selectedGenres = musicById.get(state.music);
    const parts = [];
    let count = 0;
    for (const section of visibleSections) {
      const items = products.filter(product => product.section === section.id &&
        (!selectedGenres || selectedGenres.includes(product.genre)) &&
        state.query.every(word => searchIndex.get(product.id).includes(word)));
      if (items.length === 0) {
        continue;
      }
      const group = document.createElement("section");
      group.className = "menu-group";
      const heading = document.createElement("h3");
      heading.textContent = inLanguage(section.name);
      const grid = document.createElement("div");
      grid.className = "product-grid";
      grid.append(...items.map(createCard));
      group.append(heading, grid);
      parts.push(group);
      count += items.length;
    }
    groups.replaceChildren(...parts);
    byId("item-count").textContent = text("count")(count);
    byId("menu-empty").hidden = count > 0;
    showAll.setAttribute("aria-pressed", String(state.filter === "all"));
    filters.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
    });
    syncSelectedCard();
    syncPlayback();
  }

  function createCategoryTile(section) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-tile";
    button.dataset.filter = section.id;
    const image = document.createElement("img");
    image.src = foodPath(section.cover);
    image.alt = "";
    image.width = 623;
    image.height = 623;
    image.loading = "lazy";
    image.decoding = "async";
    const label = document.createElement("span");
    label.className = "category-label";
    label.textContent = inLanguage(section.name);
    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = text("count")(products.filter(product => product.section === section.id).length);
    const caption = document.createElement("span");
    caption.className = "category-caption";
    caption.append(label, count);
    button.append(image, caption);
    return button;
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
    search.placeholder = text("search");
    filters.replaceChildren(...sections.map(createCategoryTile));
    musicFilter.replaceChildren(new Option(text("musicAll"), "all"), ...musicStyles.map(style =>
      new Option(inLanguage(style.name), style.id)));
    musicFilter.value = state.music;
    tastingGrid.replaceChildren(...Array.from(tastingById.values(), createTastingCard));
    mixer.setLanguage(state.lang);
    menuTools.setLanguage(state.lang);
    weekly.setLanguage(state.lang);
    setProductCopy();
    renderMenu();
  }

  function selectFilter(filter) {
    if (state.filter !== filter) {
      state.filter = filter;
      renderMenu();
    }
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

  function menuUrl(parameters, hash = "") {
    const url = new URL(location.href);
    url.search = new URLSearchParams({ lang: state.lang, ...parameters }).toString();
    url.hash = hash;
    return url.toString();
  }

  async function shareLink(address, name, copyLabel, copied) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name + " · Sofra FM", url: address });
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
        notify(text(copied));
        return;
      } catch {
        // The manual copy field also works without clipboard permission.
      }
    }
    const field = byId("share-url");
    byId("share-url-label").textContent = text(copyLabel);
    field.value = address;
    shareDialog.showModal();
    field.select();
  }

  function paintQr(address) {
    const code = qrcode(0, "M");
    code.addData(address);
    code.make();
    const canvas = byId("showcase-code");
    const modules = code.getModuleCount();
    const scale = 6;
    const border = 4;
    canvas.width = canvas.height = (modules + 2 * border) * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (code.isDark(row, col)) {
          ctx.fillRect((col + border) * scale, (row + border) * scale, scale, scale);
        }
      }
    }
  }

  function renderShowcase() {
    const product = state.product;
    const index = products.indexOf(product) + 1;
    const image = byId("showcase-photo");
    image.src = foodPath(product.id);
    image.alt = inLanguage(product.name);
    byId("showcase-category").textContent = inLanguage(sections.find(section => section.id === product.section).name);
    byId("showcase-title").textContent = inLanguage(product.name);
    byId("showcase-price").textContent = priceText(product.price);
    byId("showcase-track").textContent = inLanguage(product.track);
    byId("showcase-position").textContent = index + " / " + products.length;
    byId("showcase-qr").hidden = !onWeb;
    byId("showcase-offline").hidden = onWeb;
    if (onWeb) {
      const address = menuUrl({ dish: product.id });
      byId("showcase-link").href = address;
      paintQr(address);
    }
  }

  function syncShowcaseControls() {
    byId("showcase-rotate").textContent = text(display.rotating ? "showcaseHold" : "showcaseResume");
    byId("showcase-sound").setAttribute("aria-pressed", String(display.sound));
    byId("showcase-fullscreen").textContent = text(display.ownsFullscreen ? "exitFullscreen" : "fullscreen");
  }

  function scheduleShowcase() {
    clearTimeout(display.timer);
    if (showcase.open && display.rotating && !display.sound) {
      display.timer = setTimeout(() => moveShowcase(1), DISPLAY_SECONDS * 1000);
    }
  }

  function moveShowcase(direction) {
    const index = (products.indexOf(state.product) + direction + products.length) % products.length;
    selectProduct(products[index], display.rotating && display.sound);
    scheduleShowcase();
  }

  function openShowcase() {
    weekly.pause();
    display.previousMute = audio.muted;
    display.rotating = true;
    display.sound = false;
    byId("showcase-audio-error").hidden = true;
    byId("showcase-fullscreen-error").hidden = true;
    pauseTrack();
    showcase.showModal();
    setTasting(null);
    setProductCopy();
    syncShowcaseControls();
    syncPlayback();
    scheduleShowcase();
  }

  function closeShowcase() {
    display.rotating = false;
    display.sound = false;
    clearTimeout(display.timer);
    pauseTrack();
    audio.muted = display.previousMute;
    audio.loop = true;
    if (display.ownsFullscreen && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    display.ownsFullscreen = false;
    updateAddress();
  }

  function toggleShowcaseRotation() {
    display.rotating = !display.rotating;
    if (display.sound) {
      if (display.rotating) {
        void playTrack();
      } else {
        pauseTrack();
      }
    }
    syncShowcaseControls();
    scheduleShowcase();
  }

  function toggleShowcaseSound() {
    display.sound = !display.sound;
    byId("showcase-audio-error").hidden = true;
    if (display.sound) {
      audio.muted = false;
      if (display.rotating) {
        void playTrack();
      }
    } else {
      pauseTrack();
      audio.muted = display.previousMute;
    }
    syncShowcaseControls();
    scheduleShowcase();
  }

  async function toggleFullscreen() {
    const errorMessage = byId("showcase-fullscreen-error");
    errorMessage.hidden = true;
    try {
      if (display.ownsFullscreen) {
        await document.exitFullscreen();
        display.ownsFullscreen = false;
      } else {
        await showcase.querySelector(".showcase-inner").requestFullscreen();
        display.ownsFullscreen = true;
        if (!showcase.open) {
          await document.exitFullscreen();
          display.ownsFullscreen = false;
        }
      }
    } catch {
      display.ownsFullscreen = false;
      errorMessage.hidden = false;
    }
    syncShowcaseControls();
  }

  function showPlaybackError() {
    audioError.hidden = false;
    if (showcase.open && display.sound) {
      display.sound = false;
      audio.muted = display.previousMute;
      byId("showcase-audio-error").hidden = false;
      syncShowcaseControls();
      scheduleShowcase();
    }
  }

  function finishTrack() {
    if (!audio.ended || mixer.isOpen()) {
      return;
    }
    if (showcase.open && display.rotating && display.sound) {
      moveShowcase(1);
      return;
    }
    const queue = state.tasting?.items;
    const next = queue?.[queue.indexOf(state.product) + 1];
    if (next) {
      selectProduct(next, true);
    } else {
      syncPlayback();
    }
  }

  function goToFeature(focus) {
    featurePhoto.scrollIntoView({ block: "start", behavior: motion.matches ? "instant" : "smooth" });
    focus.focus({ preventScroll: true });
  }

  function openToolProduct(id) {
    setTasting(null);
    selectProduct(productById.get(id), !audio.paused);
    goToFeature(byId("dish-name"));
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
    if (button) {
      selectFilter(button.dataset.filter);
    }
  });
  showAll.addEventListener("click", () => selectFilter("all"));
  search.addEventListener("input", () => {
    const query = searchable(search.value).trim();
    state.query = query ? query.split(/\s+/) : [];
    renderMenu();
  });
  musicFilter.addEventListener("change", () => {
    state.music = musicFilter.value;
    renderMenu();
  });
  tastingGrid.addEventListener("click", event => {
    const card = event.target.closest("[data-tasting]");
    const tasting = card && tastingById.get(card.dataset.tasting);
    if (!tasting) {
      return;
    }
    if (event.target.closest(".tasting-play")) {
      const willPlay = tasting !== state.tasting || audio.paused;
      toggleTasting(tasting);
      if (willPlay) {
        goToFeature(byId("main-play"));
      }
    } else if (event.target.closest(".tasting-share")) {
      const url = menuUrl({ tasting: tasting.id }, tastingAnchor(tasting));
      void shareLink(url, inLanguage(tasting.name), "tastingLink", "tastingCopied");
    }
  });
  groups.addEventListener("click", event => {
    const button = event.target.closest("button");
    const card = button?.closest(".product-card");
    if (card) {
      const product = productById.get(card.dataset.id);
      if (button.classList.contains("mixer-card-button")) {
        mixer.open(product.id);
        return;
      }
      const wasPlaying = !audio.paused;
      setTasting(null);
      if ("play" in button.dataset) {
        const pause = product === state.product && wasPlaying;
        selectProduct(product, !pause);
        if (pause) {
          pauseTrack();
        }
      } else {
        selectProduct(product, wasPlaying);
        goToFeature(byId("dish-name"));
      }
    }
  });

  openMixer.addEventListener("click", () => mixer.open(state.product.id));
  byId("open-alternatives").addEventListener("click", () => menuTools.showAlternatives(state.product));
  byId("open-drink").addEventListener("click", () => menuTools.buildDrink(state.product));
  byId("main-play").addEventListener("click", togglePlayer);
  byId("mini-play").addEventListener("click", () => {
    const currentCardPlay = groups.querySelector('[data-play="' + state.product.id + '"]');
    (currentCardPlay || byId("main-play")).focus({ preventScroll: true });
    togglePlayer();
  });
  byId("previous").addEventListener("click", () => browse(-1));
  byId("next").addEventListener("click", () => browse(1));
  byId("mini-track").addEventListener("click", () => goToFeature(byId("main-play")));
  share.addEventListener("click", () => {
    void shareLink(menuUrl({ dish: state.product.id }), inLanguage(state.product.name), "copyLabel", "copied");
  });
  share.hidden = !onWeb;
  byId("open-showcase").addEventListener("click", openShowcase);
  byId("showcase-close").addEventListener("click", () => showcase.close());
  byId("showcase-previous").addEventListener("click", () => moveShowcase(-1));
  byId("showcase-next").addEventListener("click", () => moveShowcase(1));
  byId("showcase-rotate").addEventListener("click", toggleShowcaseRotation);
  byId("showcase-sound").addEventListener("click", toggleShowcaseSound);
  byId("showcase-fullscreen").hidden = !document.fullscreenEnabled;
  byId("showcase-fullscreen").addEventListener("click", toggleFullscreen);
  showcase.addEventListener("close", closeShowcase);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      display.ownsFullscreen = false;
      syncShowcaseControls();
    }
  });
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
  ["play", "pause", "playing"].forEach(event => audio.addEventListener(event, syncPlayback));
  audio.addEventListener("ended", finishTrack);
  audio.addEventListener("error", () => {
    if (audio.error) {
      showPlaybackError();
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
  if (linkedTasting && location.hash === "#" + tastingAnchor(linkedTasting)) {
    requestAnimationFrame(() => byId(tastingAnchor(linkedTasting)).scrollIntoView({ behavior: "instant", block: "start" }));
  }
})();
