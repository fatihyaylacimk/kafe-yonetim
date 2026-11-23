"use strict";

const sections = [
  { id: "starters", name: { tr: "Başlangıçlar", en: "Starters" } },
  { id: "mains", name: { tr: "Ana yemekler", en: "Mains" } },
  { id: "desserts", name: { tr: "Tatlılar", en: "Desserts" } },
  { id: "drinks", name: { tr: "İçecekler", en: "Drinks" } },
  { id: "fresh", name: { tr: "Taze & ferah", en: "Fresh" } },
];

const products = [
  {
    id: "burrata", section: "starters", price: 340,
    name: { tr: "Burrata ve Domates", en: "Burrata & Tomatoes" },
    detail: { tr: "Kremamsı burrata, renkli domatesler, fesleğen ve zeytinyağı.", en: "Creamy burrata, heirloom tomatoes, basil and olive oil." },
    track: { tr: "Zeytin Gölgesi", en: "Olive Shade" }, genre: "Bossa nova", bpm: 106,
  },
  {
    id: "mantar-bruschetta", section: "starters", price: 260,
    name: { tr: "Mantarlı Bruschetta", en: "Mushroom Bruschetta" },
    detail: { tr: "Kekikle sotelenmiş mantar ve kızarmış ekşi mayalı ekmek.", en: "Thyme-sautéed mushrooms on toasted sourdough." },
    track: { tr: "Ahşap Masa", en: "The Wooden Table" }, genre: "Soft jazz", bpm: 83,
  },
  {
    id: "humus", section: "starters", price: 240,
    name: { tr: "Humus ve Fırın Ekmeği", en: "Hummus & Flatbread" },
    detail: { tr: "Tahin, limon ve zeytinyağı ile humus. Yanında sıcak fırın ekmeği.", en: "Tahini and lemon hummus with olive oil and warm flatbread." },
    track: { tr: "Pazar Yolu", en: "Market Lane" }, genre: "Downtempo", bpm: 89,
  },
  {
    id: "citir-patates", section: "starters", price: 220,
    name: { tr: "Çıtır Patates", en: "Crispy Potatoes" },
    detail: { tr: "Biberiye ile fırınlanmış patates ve sarımsaklı aioli.", en: "Rosemary-roasted potatoes with garlic aioli." },
    track: { tr: "Sıcak Servis", en: "Served Hot" }, genre: "Funk", bpm: 111,
  },
  {
    id: "koz-burger", section: "mains", price: 460,
    name: { tr: "Köz Burger", en: "Charcoal Burger" },
    detail: { tr: "Köz ateşinde iki dana köfte, erimiş cheddar, turşu ve kavrulmuş brioche ekmek.", en: "Two charcoal-grilled beef patties, melted cheddar and pickles on toasted brioche." },
    track: { tr: "Köz Başında", en: "By the Embers" }, genre: "Lo-fi funk", bpm: 94,
  },
  {
    id: "mantarli-risotto", section: "mains", price: 480,
    name: { tr: "Mantarlı Risotto", en: "Mushroom Risotto" },
    detail: { tr: "Arborio pirinci, tereyağında sotelenmiş mantar ve parmesan.", en: "Arborio rice with butter-sautéed mushrooms and parmesan." },
    track: { tr: "Yavaş Ateş", en: "Slow Heat" }, genre: "Late night jazz", bpm: 77,
  },
  {
    id: "limonlu-tavuk", section: "mains", price: 470,
    name: { tr: "Limonlu Izgara Tavuk", en: "Lemon Grilled Chicken" },
    detail: { tr: "Taze otlarla ızgara tavuk göğsü ve közlenmiş limon.", en: "Herb-grilled chicken breast with charred lemon." },
    track: { tr: "Güneşli Teras", en: "Sunny Terrace" }, genre: "Bossa nova", bpm: 108,
  },
  {
    id: "feslegenli-pappardelle", section: "mains", price: 440,
    name: { tr: "Fesleğenli Pappardelle", en: "Basil Pappardelle" },
    detail: { tr: "Geniş şerit makarna, taze fesleğen pestosu ve parmesan.", en: "Wide pasta ribbons with fresh basil pesto and shaved parmesan." },
    track: { tr: "Yeşil Işık", en: "Green Light" }, genre: "Soul jazz", bpm: 101,
  },
  {
    id: "fistikli-kruvasan", section: "desserts", price: 210,
    name: { tr: "Antep Fıstıklı Kruvasan", en: "Pistachio Croissant" },
    detail: { tr: "Tereyağlı çıtır katlar ve Antep fıstığı kreması.", en: "Flaky butter pastry filled with pistachio cream." },
    track: { tr: "İlk Kırıntı", en: "First Crumb" }, genre: "French jazz", bpm: 95,
  },
  {
    id: "san-sebastian", section: "desserts", price: 270,
    name: { tr: "San Sebastian Cheesecake", en: "Basque Cheesecake" },
    detail: { tr: "Karamelize kabuk ve ipeksi krem peynir dolgusu.", en: "Caramelised top and a silky cream cheese centre." },
    track: { tr: "Altın Kenar", en: "Golden Edge" }, genre: "Soft soul", bpm: 82,
  },
  {
    id: "tiramisu", section: "desserts", price: 250,
    name: { tr: "Tiramisu", en: "Tiramisu" },
    detail: { tr: "Espressolu kedi dili, mascarpone ve bitter kakao.", en: "Espresso-soaked ladyfingers, mascarpone and dark cocoa." },
    track: { tr: "Gece Yarısı Kakaosu", en: "Cocoa at Midnight" }, genre: "Chillhop", bpm: 86,
  },
  {
    id: "cikolatali-tart", section: "desserts", price: 260,
    name: { tr: "Bitter Çikolatalı Tart", en: "Dark Chocolate Tart" },
    detail: { tr: "Kıtır tart hamuru, bitter ganaj ve kakao parçaları.", en: "Crumbly pastry, dark ganache and cacao nibs." },
    track: { tr: "Kadife", en: "Velvet" }, genre: "Ambient jazz", bpm: 76,
  },
  {
    id: "flat-white", section: "drinks", price: 160,
    name: { tr: "Flat White", en: "Flat White" },
    detail: { tr: "Çift espresso ve ince dokulu buharda ısıtılmış süt.", en: "Double espresso with finely textured steamed milk." },
    track: { tr: "İlk Fincan", en: "First Cup" }, genre: "Café jazz", bpm: 92,
  },
  {
    id: "buzlu-matcha", section: "drinks", price: 220,
    name: { tr: "Buzlu Matcha Latte", en: "Iced Matcha Latte" },
    detail: { tr: "Çırpılmış yeşil matcha, soğuk süt ve buz.", en: "Whisked green matcha with cold milk over ice." },
    track: { tr: "Cam Bahçe", en: "Glass Garden" }, genre: "Ambient pop", bpm: 88,
  },
  {
    id: "vanilyali-cold-brew", section: "drinks", price: 190,
    name: { tr: "Vanilyalı Cold Brew", en: "Vanilla Cold Brew" },
    detail: { tr: "Soğuk demlenmiş kahve, vanilyalı krema ve buz.", en: "Cold-steeped coffee with vanilla cream over ice." },
    track: { tr: "Gece Servisi", en: "Night Service" }, genre: "Minimal house", bpm: 116,
  },
  {
    id: "hibiskus-cayi", section: "drinks", price: 150,
    name: { tr: "Hibiskuslu Buzlu Çay", en: "Hibiscus Iced Tea" },
    detail: { tr: "Ekşimsi hibiskus demlemesi ve buz.", en: "Tart hibiscus infusion served over ice." },
    track: { tr: "Kırmızı Gölge", en: "Red Shade" }, genre: "Downtempo", bpm: 97,
  },
  {
    id: "naneli-limonata", section: "fresh", price: 170,
    name: { tr: "Naneli Limonata", en: "Mint Lemonade" },
    detail: { tr: "Taze sıkılmış limon, nane yaprakları ve bol buz.", en: "Freshly squeezed lemon, mint leaves and plenty of ice." },
    track: { tr: "Limon Rüzgârı", en: "Lemon Breeze" }, genre: "Tropical jazz", bpm: 114,
  },
  {
    id: "portakal-zencefil", section: "fresh", price: 190,
    name: { tr: "Portakal ve Zencefil", en: "Orange & Ginger Juice" },
    detail: { tr: "Taze sıkılmış portakal suyu ve keskin bir zencefil dokunuşu.", en: "Freshly squeezed orange with a sharp touch of ginger." },
    track: { tr: "Turuncu Sabah", en: "Orange Morning" }, genre: "Sunshine funk", bpm: 112,
  },
  {
    id: "kinoa-kasesi", section: "fresh", price: 370,
    name: { tr: "Yeşil Kinoa Kasesi", en: "Green Quinoa Bowl" },
    detail: { tr: "Kinoa, avokado, salatalık, edamame ve limonlu sos.", en: "Quinoa, avocado, cucumber and edamame with lemon dressing." },
    track: { tr: "Açık Hava", en: "Open Air" }, genre: "Garden jazz", bpm: 99,
  },
  {
    id: "cilekli-yogurt", section: "fresh", price: 230,
    name: { tr: "Çilekli Yoğurt Kasesi", en: "Strawberry Yogurt Bowl" },
    detail: { tr: "Süzme yoğurt, taze çilek, granola ve nane.", en: "Strained yogurt, fresh strawberries, granola and mint." },
    track: { tr: "Çilek Tonları", en: "Strawberry Tones" }, genre: "Soft pop", bpm: 104,
  },
];
