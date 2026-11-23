# Sofra FM

Her ürünün kendi müziği olan Türkçe ve İngilizce restoran menüsü. Başlangıçlar, ana yemekler, tatlılar, içecekler ve taze seçenekler beş kategoride sunulur. 20 ürünün her birinin görseli ve özgün, kısa enstrümantal parçası vardır. Ürünler ve MKD fiyatları örnek menü verisidir.

## Açma

`index.html` dosyasını tarayıcıda aç. Yerel web sunucusunda ürün bağlantısı paylaşımı da etkinleşir.

```bash
cd sofra-fm
python -m http.server 8080
```

Tarayıcıda `http://localhost:8080` adresini aç. İngilizce bir ürün bağlantısı örneği `?lang=en&dish=tiramisu`.

## Menü düzenleme

- `menu-data.js` iki dilde ürün adı, açıklama, fiyat ve parça bilgilerini içerir.
- `assets/food/` ürün görsellerini, `assets/tracks/` MP3 dosyalarını içerir. Dosya adları ürün kimliğiyle eşleşir.
- `tools/render_tracks.py` müzikleri ve dalga biçimi verisini yeniden oluşturur. Bu işlem Python, NumPy ve FFmpeg gerektirir. Menü sayfası statik çalışır.
- Depoda GitHub Pages kök klasörden yayınlanıyorsa menü `/sofra-fm/` yolunda açılır.

## English

Sofra FM is a bilingual restaurant menu with five categories, 20 product images, and 20 original instrumental clips. The menu and MKD prices are illustrative. Open `index.html` in a browser or serve the folder with a static web server. Individual product URLs accept `lang` and `dish` query parameters.

The food visuals were generated for this demo. Instrument Serif and DM Sans are distributed under their respective SIL Open Font Licenses, included in `assets/fonts/`.
