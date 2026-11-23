"use strict";

function createKitchenMixer({ productById, foodPath, priceText, pauseTrack }) {
  const dishes = new Map([
    ["koz-burger", {
      sound: { tr: "Izgara sesi", en: "Grill sizzle" },
      scene: { tr: "Izgara başında", en: "At the grill" },
      alt: { tr: "Izgarada kızaran burger köfteleri", en: "Burger patties sizzling on the grill" },
    }],
    ["turk-kahvesi", {
      sound: { tr: "Cezve sesi", en: "Coffee bubbling" },
      scene: { tr: "Cezve başında", en: "At the cezve" },
      alt: { tr: "Bakır cezvede köpüren Türk kahvesi", en: "Turkish coffee foaming in a copper cezve" },
    }],
    ["naneli-limonata", {
      sound: { tr: "Buz ve limonata", en: "Ice and lemonade" },
      scene: { tr: "Bardağa dökülürken", en: "Into the glass" },
      alt: { tr: "Buz ve nane dolu bardağa dökülen limonata", en: "Lemonade pouring into a glass with ice and mint" },
    }],
  ]);
  const copy = {
    tr: {
      products: "Mikserdeki ürünler", layers: "Ses katmanları", bass: "Bas", melody: "Melodi",
      mute: name => name + " katmanını sustur", percent: value => "%" + value,
      play: "Karışımı çal", pause: "Duraklat", cancel: "İptal et", loading: "Sesler yükleniyor…",
      error: "Sesler açılamadı. Tekrar deneyebilirsin.",
      hint: "Mutfak sesini öne çıkarınca hazırlık anını görürsün.",
    },
    en: {
      products: "Mixer dishes", layers: "Audio layers", bass: "Bass", melody: "Melody",
      mute: name => "Mute " + name.toLowerCase(), percent: value => value + "%",
      play: "Play mix", pause: "Pause", cancel: "Cancel", loading: "Loading audio…",
      error: "The audio could not load. Try again.",
      hint: "Turn the kitchen sound above the other layers to see the dish being made.",
    },
  };

  const byId = id => document.getElementById(id);
  const dialog = byId("kitchen-mixer");
  const productList = byId("mixer-products");
  const layerList = byId("mixer-layers");
  const photo = byId("mixer-photo");
  const plate = byId("mixer-plate");
  const prep = byId("mixer-prep");
  const scene = byId("mixer-scene");
  const playButton = byId("mixer-play");
  const playLabel = byId("mixer-play-label");
  const status = byId("mixer-status");
  const template = byId("mixer-layer-template");
  const choices = new Map();
  const loaded = new Map();
  let language = "tr";
  let selectedId;
  let context;
  let mix;
  let offset = 0;
  let attempt = 0;
  let playback = "idle";

  const layers = [["kitchen", 38], ["bass", 68], ["melody", 72]].map(([key, volume]) => {
    const row = template.content.firstElementChild.cloneNode(true);
    const label = row.querySelector("label");
    const level = row.querySelector(".mixer-level");
    const slider = row.querySelector("input");
    const mute = row.querySelector("button");
    slider.id = "mixer-" + key;
    label.htmlFor = slider.id;
    slider.value = volume;
    const layer = { key, volume, muted: false, row, label, level, slider, mute };
    slider.addEventListener("input", () => {
      layer.volume = slider.valueAsNumber;
      updateLevels();
    });
    mute.addEventListener("click", () => {
      layer.muted = !layer.muted;
      updateLevels();
    });
    layerList.append(row);
    return layer;
  });

  function layerGain(layer) {
    return layer.muted ? 0 : layer.volume / 100;
  }

  function updateLevels() {
    layers.forEach((layer, index) => {
      const percent = copy[language].percent(layer.volume);
      layer.level.textContent = percent;
      layer.slider.setAttribute("aria-valuetext", percent);
      layer.slider.style.setProperty("--level", layer.volume + "%");
      layer.row.dataset.muted = String(layer.muted);
      layer.mute.setAttribute("aria-pressed", String(layer.muted));
      if (mix) {
        mix.gains[index].gain.setTargetAtTime(layerGain(layer), context.currentTime, .025);
      }
    });
    const [kitchen, bass, melody] = layers.map(layerGain);
    const closeup = kitchen > Math.max(bass, melody);
    photo.dataset.closeup = String(closeup);
    plate.setAttribute("aria-hidden", String(closeup));
    prep.setAttribute("aria-hidden", String(!closeup));
    scene.hidden = !closeup;
  }

  function setPlayback(value) {
    playback = value;
    dialog.dataset.state = value;
    playButton.dataset.playing = String(value === "playing");
    const words = copy[language];
    playLabel.textContent = words[{ playing: "pause", loading: "cancel" }[value] || "play"];
    status.textContent = value === "loading" || value === "error" ? words[value] : "";
    status.hidden = !status.textContent;
  }

  function renderDish() {
    const product = productById.get(selectedId);
    const dish = dishes.get(selectedId);
    for (const [id, button] of choices) {
      button.setAttribute("aria-pressed", String(id === selectedId));
    }
    const name = product.name[language];
    const platePath = foodPath(selectedId);
    const prepPath = "assets/mixer/" + selectedId + "-prep.webp";
    if (plate.getAttribute("src") !== platePath) {
      plate.src = platePath;
      prep.src = prepPath;
    }
    plate.alt = name;
    prep.alt = dish.alt[language];
    scene.textContent = dish.scene[language];
    byId("mixer-dish").textContent = name;
    byId("mixer-price").textContent = priceText(product.price);
    byId("mixer-track").textContent = product.track[language];
    for (const layer of layers) {
      const label = layer.key === "kitchen" ? dish.sound[language] : copy[language][layer.key];
      layer.label.textContent = label;
      layer.mute.setAttribute("aria-label", copy[language].mute(label));
    }
    updateLevels();
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    productList.setAttribute("aria-label", copy[language].products);
    layerList.setAttribute("aria-label", copy[language].layers);
    for (const [id, button] of choices) {
      button.textContent = productById.get(id).name[language];
    }
    byId("mixer-hint").textContent = copy[language].hint;
    setPlayback(playback);
    if (selectedId) {
      renderDish();
    }
  }

  function loadBundle(id) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "assets/mixer/" + id + ".js";
      script.onload = () => {
        script.remove();
        const encoded = globalThis.sofraMixerAudio?.[id];
        if (!encoded) {
          reject(new Error("Missing mixer audio"));
          return;
        }
        delete globalThis.sofraMixerAudio[id];
        resolve(encoded);
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("Mixer audio could not load"));
      };
      document.head.append(script);
    });
  }

  function loadLayers(id) {
    const cached = loaded.get(id);
    if (cached) {
      return cached;
    }
    const pending = loadBundle(id).then(encoded => Promise.all(layers.map(({ key }) => {
      const bytes = Uint8Array.from(atob(encoded[key]), character => character.charCodeAt(0));
      return context.decodeAudioData(bytes.buffer);
    })));
    loaded.set(id, pending);
    pending.catch(() => {
      if (loaded.get(id) === pending) {
        loaded.delete(id);
      }
    });
    return pending;
  }

  async function play() {
    const thisAttempt = ++attempt;
    setPlayback("loading");
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context ||= new AudioContextClass();
      const [, buffers] = await Promise.all([context.resume(), loadLayers(selectedId)]);
      if (thisAttempt !== attempt || !dialog.open) {
        return;
      }

      const duration = Math.min(...buffers.map(buffer => buffer.duration));
      const master = context.createGain();
      const startedAt = context.currentTime + .035;
      const startOffset = offset % duration;
      master.gain.value = 0;
      master.gain.setTargetAtTime(.52, startedAt, .012);
      master.connect(context.destination);
      const gains = layers.map(layer => {
        const node = context.createGain();
        node.gain.value = layerGain(layer);
        node.connect(master);
        return node;
      });
      const sources = buffers.map((buffer, index) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopEnd = duration;
        source.connect(gains[index]);
        source.start(startedAt, startOffset);
        return source;
      });
      mix = { duration, master, startedAt, startOffset, gains, sources };
      setPlayback("playing");
    } catch {
      if (thisAttempt === attempt && dialog.open) {
        setPlayback("error");
      }
    }
  }

  function stop(rememberPosition = false) {
    attempt += 1;
    if (!rememberPosition) {
      offset = 0;
    }
    if (mix) {
      const current = mix;
      const now = context.currentTime;
      if (rememberPosition) {
        offset = (current.startOffset + Math.max(0, now - current.startedAt)) % current.duration;
      }
      current.master.gain.cancelScheduledValues(now);
      current.master.gain.setTargetAtTime(0, now, .008);
      current.sources[0].onended = () => {
        current.sources.forEach(source => source.disconnect());
        current.gains.forEach(gain => gain.disconnect());
        current.master.disconnect();
      };
      current.sources.forEach(source => source.stop(now + .045));
      mix = undefined;
    }
    setPlayback("idle");
  }

  for (const id of dishes.keys()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mixer-choice";
    button.addEventListener("click", () => {
      if (id === selectedId) {
        return;
      }
      const resume = playback === "playing" || playback === "loading";
      stop();
      selectedId = id;
      renderDish();
      if (resume) {
        void play();
      }
    });
    choices.set(id, button);
    productList.append(button);
  }

  playButton.addEventListener("click", () => {
    if (playback === "playing" || playback === "loading") {
      stop(true);
    } else {
      void play();
    }
  });
  byId("mixer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (!dialog.open) {
      stop();
      loaded.clear();
    }
  });

  return {
    has: id => dishes.has(id),
    isOpen: () => dialog.open,
    setLanguage,
    open(id) {
      if (!dishes.has(id) || dialog.open) {
        return;
      }
      pauseTrack();
      stop();
      selectedId = id;
      renderDish();
      dialog.showModal();
      dialog.scrollTop = 0;
    },
  };
}
