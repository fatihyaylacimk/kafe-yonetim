# Sofra FM

Her ürünün kendi müziği olan Türkçe ve İngilizce restoran menüsü. Başlangıçlar, ana yemekler, tatlılar, içecekler ve taze seçenekler beş görselli kategoride sunulur. Her kategoride sekiz ürün bulunur. 40 ürünün her birinin görseli ve özgün, kısa enstrümantal parçası vardır. Fiyatlar EUR cinsinden örnek menü verisidir. Menü araması iki dilde çalışır.

## Açma

`index.html` dosyasını tarayıcıda aç. Yerel web sunucusunda ürün bağlantısı paylaşımı da etkinleşir.

```bash
cd sofra-fm
python -m http.server 8080
```

Tarayıcıda `http://localhost:8080` adresini aç. İngilizce bir ürün bağlantısı örneği `?lang=en&dish=tiramisu`.

## Seçkiler, vitrin ve video

- **Tadım seçkileri** bölümünde toplam fiyatı ve üç ürünün parça adlarını görebilirsin. **Seçkiyi dinle** ürünleri ve parçaları sırayla açar. Seçkinin bağlantısı ilgili kartı açar. Örnek bağlantı `?lang=tr&tasting=aksam-menusu#tasting-aksam-menusu`.
- **Müzik tarzı** filtresi arama ve kategori seçimiyle birlikte çalışır.
- **Vitrin modu** ürünleri dokuz saniyede bir döndürür. Müzik açıkken bir sonraki ürüne parça bittiğinde geçer. Ürün QR kodu web adresindeki ilgili menü kaydını açar. QR bağlantılarının erişimi, menünün yayın ayarına bağlıdır.
- Ürün ayrıntılarında **Hikâye videosu** ile 12 saniyelik, 720 × 1280 boyutunda MP4 indirilebilir. 40 videonun her birinde ürüne ait görsel, fiyat ve müzik bulunur.

## Menü düzenleme

- `menu-data.js` iki dilde ürün adı, açıklama, fiyat ve parça bilgilerini içerir.
- `assets/food/` ürün görsellerini, `assets/tracks/` MP3 dosyalarını içerir. Dosya adları ürün kimliğiyle eşleşir.
- `tools/render_tracks.py` müzikleri ve dalga biçimi verisini yeniden oluşturur. Bu işlem Python, NumPy ve FFmpeg gerektirir. Menü sayfası statik çalışır.
- `python tools/render_stories.py` komutu videoları `assets/stories/` dizininde yeniden üretir. Python, Pillow, fontTools, Node.js ve FFmpeg kullanır. Tek ürün için `--product margherita` eklenebilir.
- Depoda GitHub Pages kök klasörden yayınlanıyorsa menü `/sofra-fm/` yolunda açılır.

## English

Sofra FM is a bilingual restaurant menu with eight items in each of five illustrated categories. All 40 items have a product image, an original instrumental clip, and an illustrative EUR price. Search works in both languages. Open `index.html` in a browser or serve the folder with a static web server. Individual product URLs accept `lang` and `dish` query parameters.

Tasting menus have their own links and sequence the original tracks. The music style filter works with the existing category filter and search. Display mode rotates through the dishes with a QR code linking to the current dish. Each dish has a downloadable 12-second portrait MP4.

The food visuals were generated for this demo. Instrument Serif and DM Sans are distributed under their respective SIL Open Font Licenses, included in `assets/fonts/`.
The QR encoder is qrcode-generator 1.4.4 by Kazuhiko Arase. Its MIT license is in `assets/vendor/`.
