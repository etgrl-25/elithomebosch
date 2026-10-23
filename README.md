# Elit home — İlk sürüm

Beyaz eşya mağazası için satış, ciro ve stok takip uygulaması.

## Hazır özellikler

- Satışları tutar, ödeme türü, tarih ve açıklama ile tek tek kaydetme.
- Günlük, aylık ve tüm dönem ciro özeti; nakit, kart ve havale dağılımı.
- Satış arama, tarih filtresi, satış iptali ve CSV dışa aktarma.
- Ürün adı, marka, model, stok kodu, başlangıç adedi ve kritik stok eşiği.
- Manuel stok giriş ve çıkışı; son 200 hareketin kaydı.
- Yetersiz stok, tekrarlanan işlem ve eşzamanlı stok çıkışı korumaları.
- Telefon ve bilgisayara uyumlu Elit home görünümü.

## Bu sürümün kapsamı

Satış ve stok işlemleri ayrıdır: satış kaydı otomatik stok düşürmez.
Kayıtlar giriş yapan kullanıcıya aittir. Ortak mağaza, personel rolleri ve çok kullanıcılı çalışma eklenmedi.
İnternet yayını tamamlanmadı. localhost bağlantısı yalnızca uygulamanın çalıştığı bilgisayardaki önizlemedir.
Yerel önizlemenin deneme girişi gerçek e-posta doğrulaması değildir; internete doğrudan açılmamalıdır.
Yerel deneme verileri .wrangler/state içinde kalır ve bu proje arşivine dahil edilmez.
Gerçek mağaza verilerini kullanmadan önce canlı yayın ve giriş kontrolleri tamamlanmalıdır.

## Geliştirme ortamında çalıştırma

Node.js 22.13 veya üstü ve npm gerekir.

1. npm ci
2. npm run build
3. Aşağıdaki iki komutu yalnızca yeni yerel veritabanında, sırayla çalıştırın:
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_colorful_mephistopheles.sql
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_absent_thunderbolt_ross.sql
4. npm run dev
5. Terminalde gösterilen yerel adresi açın.

Uygulanmış veritabanı değişikliklerini tekrar çalıştırmayın.
Yayın için Sites iş akışı ve .openai/hosting.json içindeki mevcut proje kimliği kullanılmalıdır.

## Doğrulama

Tür kontrolü ve üretim derlemesi başarılı.
Satış kaydı, kuruş hassasiyeti, iptal, hatalı giriş ve tekrar güvenliği denendi.
Stok kaydı, giriş/çıkış, yetersiz stok, tekrar güvenliği ve eşzamanlı çıkış denendi.
Yerel önizlemede ekranlar kontrol edildi.
