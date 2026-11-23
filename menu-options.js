"use strict";

// Family, freshness and intensity describe each dish on a five-point scale.
const tasteProfiles = {
  burrata: ["cheese", 5, 2], "mantar-bruschetta": ["bread", 2, 4],
  humus: ["vegetable", 4, 3], "citir-patates": ["vegetable", 2, 3],
  "koz-domates-corbasi": ["vegetable", 3, 4], falafel: ["vegetable", 3, 4],
  "ispanakli-borek": ["bread", 1, 4], "izgara-hellim": ["cheese", 4, 3],
  "koz-burger": ["grill", 1, 5], "mantarli-risotto": ["pasta", 1, 5],
  "limonlu-tavuk": ["grill", 5, 2], "feslegenli-pappardelle": ["pasta", 4, 3],
  "izgara-somon": ["grill", 5, 3], "kofte-pilav": ["grill", 2, 4],
  margherita: ["dough", 3, 3], "sebzeli-taco": ["dough", 5, 3],
  "fistikli-kruvasan": ["cream", 1, 4], "san-sebastian": ["cream", 2, 4],
  tiramisu: ["cream", 2, 4], "cikolatali-tart": ["chocolate", 1, 5],
  "karamelli-brownie": ["chocolate", 1, 4], "limonlu-tart": ["fruit", 5, 3],
  "frambuazli-panna-cotta": ["fruit", 4, 2], "vanilyali-dondurma": ["cream", 4, 2],
  "flat-white": ["coffee", 1, 4], "buzlu-matcha": ["tea", 4, 3],
  "vanilyali-cold-brew": ["coffee", 3, 4], "hibiskus-cayi": ["tea", 5, 3],
  "turk-kahvesi": ["coffee", 1, 5], "sicak-cikolata": ["milk", 1, 5],
  "buzlu-karamel-latte": ["coffee", 2, 4], "masala-cai": ["tea", 1, 5],
  espresso: ["coffee", 1, 5], americano: ["coffee", 2, 4], cappuccino: ["coffee", 2, 3],
  "bitter-mocha": ["coffee", 1, 5], "buzlu-ispanyol-latte": ["coffee", 2, 4],
  "espresso-tonik": ["coffee", 5, 3], "buzlu-findik-latte": ["coffee", 2, 4],
  "cilekli-matcha-latte": ["tea", 4, 4], "bergamotlu-siyah-cay": ["tea", 3, 3],
  "balli-zencefil-cayi": ["tea", 3, 3], "buzlu-seftali-cayi": ["tea", 5, 2],
  "yaban-mersinli-bubble-tea": ["tea", 3, 4], "carkifelek-soda": ["sparkling", 5, 4],
  "salatalik-murver-soda": ["sparkling", 5, 1], "nar-greyfurt-kokteyli": ["sparkling", 5, 4],
  "fistikli-milkshake": ["milk", 2, 5], "naneli-limonata": ["sparkling", 5, 2],
  "portakal-zencefil": ["juice", 4, 4], "kinoa-kasesi": ["salad", 4, 3],
  "cilekli-yogurt": ["fruit", 3, 3], "mango-ananas": ["juice", 4, 4],
  "cilek-feslegen-soda": ["sparkling", 5, 3], "karpuz-nane": ["juice", 5, 2],
  "meyve-tabagi": ["fruit", 5, 1],
};

const freshDrinks = new Set([
  "naneli-limonata", "portakal-zencefil", "mango-ananas", "cilek-feslegen-soda", "karpuz-nane",
]);

// The remaining drink menu follows its original recipe.
const drinkRecipes = {
  "flat-white": { glass: "latte", shots: 2, milk: true },
  "buzlu-matcha": { glass: "matcha", iced: true, milk: true },
  "buzlu-karamel-latte": { glass: "latte", iced: true, shots: 1, milk: true },
  espresso: { glass: "black", shots: 1 },
  americano: { glass: "black", shots: 2 },
  cappuccino: { glass: "latte", shots: 1, milk: true },
  "bitter-mocha": { glass: "mocha", shots: 1 },
  "buzlu-ispanyol-latte": { glass: "latte", iced: true, shots: 1 },
  "espresso-tonik": { glass: "tonic", iced: true, shots: 1 },
  "buzlu-findik-latte": { glass: "latte", iced: true, shots: 1, milk: true },
  "cilekli-matcha-latte": { glass: "berry-matcha", iced: true, milk: true },
};

const weeklyDrinks = [
  {
    id: "kan-portakali-biberiye", price: 4.10,
    name: { tr: "Kan Portakalı ve Biberiye Sodası", en: "Blood Orange & Rosemary Soda" },
    detail: { tr: "Kan portakalı, taze biberiye ve maden suyu.", en: "Blood orange, fresh rosemary and sparkling mineral water." },
    track: { tr: "Kızıl Ritim", en: "Crimson Rhythm" },
  },
  {
    id: "bergamot-cold-brew", price: 4.20,
    name: { tr: "Bergamot Cold Brew", en: "Bergamot Cold Brew" },
    detail: { tr: "Soğuk demlenmiş kahve, bergamot kabuğu ve buz.", en: "Cold-steeped coffee over ice with a twist of bergamot peel." },
    track: { tr: "Bergamot Ritmi", en: "Bergamot Beat" },
  },
  {
    id: "armut-adacayi-fizz", price: 4.10,
    name: { tr: "Armut ve Adaçayı Sodası", en: "Pear & Sage Fizz" },
    detail: { tr: "Armut, adaçayı ve buzlu maden suyu.", en: "Pear and sage in sparkling mineral water over ice." },
    track: { tr: "Armut Esintisi", en: "Pear Breeze" },
  },
  {
    id: "balli-susam-latte", price: 4.40,
    name: { tr: "Ballı Susam Latte", en: "Honey Sesame Latte" },
    detail: { tr: "Espresso, süt, tahin ve bal. Buzlu servis edilir.", en: "Iced espresso with milk, tahini and honey." },
    track: { tr: "Susam Plakları", en: "Sesame Sessions" },
  },
];
