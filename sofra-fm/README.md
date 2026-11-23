# Sofra FM

Her ürünün kendi müziği olan Türkçe ve İngilizce restoran menüsü. İçecekler kategorisinde 24, başlangıçlar, ana yemekler, tatlılar ve taze seçenekler kategorilerinde sekizer ürün bulunur. 56 ürünün her birinin görseli ve özgün, kısa enstrümantal parçası vardır. Fiyatlar EUR cinsinden örnek menü verisidir. Menü araması iki dilde çalışır.

[Yayındaki menüyü aç](https://fatihyaylacimk.github.io/kafe-yonetim/)

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
- Ürün ayrıntılarında **Hikâye videosu** ile 12 saniyelik, 720 × 1280 boyutunda MP4 indirilebilir. 56 videonun her birinde ürüne ait görsel, fiyat ve müzik bulunur.

## Mutfak Mikseri

Köz Burger, Türk Kahvesi ve Naneli Limonata kartlarından açılır. **Karışımı çal** düğmesi ürünün mutfak sesi, bas ve melodi katmanlarını birlikte başlatır. Her katmanın seviyesi ve sesi ayrı kontrol edilir. Mutfak sesinin düzeyi öne çıktığında, servis fotoğrafı ürünün hazırlanışını gösteren yakın plana geçer. Izgara, cezve ve limonata sesleri dijital olarak üretilmiştir.

## Menü araçları

- **Buna benzer ama…** aynı türdeki ürünler arasından daha ferah, yoğun veya uygun fiyatlı seçenekleri gösterir. Lezzet profilleri `menu-options.js` dosyasında düzenlenir.
- **Bütçene göre sofra kur** ana yemek ve içecek, tatlı ve içecek ya da üç üründen oluşan seçenekler önerir. Hesaplar euro sentiyle yapılır ve kalan bütçe gösterilir.
- **İçeceğini ayarla** desteklenen 11 içeceğin ürün ayrıntısında görünür. İçeceğe göre buz, espresso shot ve süt seçenekleri açılır. Ekstra espresso shot için örnek ek ücret €0,60, yulaf içeceği için €0,50’dir. **Garsona göster** seçimi okunaklı bir özet olarak açar.
- **Haftaya menüye ne girsin?** aynı haftanın toplamını farklı cihazlarda gösterir. Tarayıcıda saklanan rastgele kimlikten oylamaya özel bir özet üretilir. Veritabanı her kimlik için o turda yalnızca bir oy tutar. Benzersiz kazanan sonraki hafta oylama bölümünde **Haftanın özel içeceği** olarak gösterilir.

İlk iki oylama 23 ve 30 Kasım 2026 haftaları için ayarlandı. Oylamalar İstanbul saatiyle pazartesi 00.00’da değişir. Sonraki adayların adı, fiyatı, fotoğrafı ve müziği `weeklyDrinks` listesiyle menüye eklenir. Her turun başlangıcı, bitişi ve iki ürün kimliği `sofra_poll.rounds` tablosuna girilir. Kurulum dosyaları `server/weekly-poll/` içindedir. Neon Function, veritabanına sunucuda sağlanan `DATABASE_URL` ile bağlanır. `weekly-poll.js` dosyasındaki adres HTTPS üzerinden yalnızca oylama API’sine bağlanır.

## Menü düzenleme

- `menu-data.js` iki dilde ürün adı, açıklama, fiyat ve parça bilgilerini içerir.
- `assets/food/` ürün görsellerini, `assets/tracks/` MP3 dosyalarını içerir. Dosya adları ürün kimliğiyle eşleşir.
- `tools/render_tracks.py` müzikleri ve dalga biçimi verisini yeniden oluşturur. Bu işlem Python, NumPy ve FFmpeg gerektirir. Menü sayfası statik çalışır.
- `python tools/render_mixer.py` mikserin seslerini yeniden üretir. Python, NumPy, SciPy ve FFmpeg kullanır. Tarayıcı, ihtiyaç olduğunda sesleri `assets/mixer/` dizininden yükler. Mikser `index.html` doğrudan açıldığında da çalışır.
- `python tools/render_stories.py` komutu videoları `assets/stories/` dizininde yeniden üretir. Python, Pillow, fontTools, Node.js ve FFmpeg kullanır. Tek ürün için `--product margherita` eklenebilir.
- GitHub Pages için `gh-pages` dalının kökünde sitenin statik dosyaları bulunur. Menü kaynakları `main` dalında `sofra-fm/` klasöründedir.

## English

Sofra FM is a bilingual restaurant menu with 24 drinks and eight items in each of the other four categories. All 56 items have a product image, an original instrumental clip, and an illustrative EUR price. Search works in both languages. Open `index.html` in a browser or serve the folder with a static web server. Individual product URLs accept `lang` and `dish` query parameters.

Tasting menus have their own links and sequence the original tracks. The music style filter works with the existing category filter and search. Display mode rotates through the dishes with a QR code linking to the current dish. Each dish has a downloadable 12-second portrait MP4.

The Kitchen Mixer is available for the Charcoal Burger, Turkish Coffee, and Mint Lemonade. Adjust or mute the kitchen, bass, and melody layers independently. Raising the kitchen above the other layers reveals a preparation close-up. The kitchen sounds are digitally generated.

The menu also includes taste and price alternatives, a budget planner, drink customization with a waiter view, and a weekly vote with shared results. A sole winner appears as the following week’s featured drink.

The food visuals were generated for this demo. Instrument Serif and DM Sans are distributed under their respective SIL Open Font Licenses, included in `assets/fonts/`.
The QR encoder is qrcode-generator 1.4.4 by Kazuhiko Arase. Its MIT license is in `assets/vendor/`.
