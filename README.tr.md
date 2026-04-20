## 🇬🇧 English

Bu dokümanın İngilizce versiyonu için [README.md](README.md)

> Not: Bu doküman İngilizce versiyondan türetilmiştir ve zaman zaman geride kalabilir.

---

# Vardiya Planı (Zekra)

Vardiyalı çalışanlar için yerel-öncelikli (local-first) bir React Native /
Expo mobil uygulaması. Uygulama; tek bir kullanıcının kendi vardiya
rotasyonunu aylık bir takvim üzerinde görmesini, planlamasını ve
düzenlemesini sağlar. Tüm veriler yalnızca cihazda saklanır; giriş, bulut
senkronizasyonu veya herhangi bir backend yoktur.

Depo kök dizininde planlama dokümanları ve örnek bir ekran görüntüsü
bulunur. Gerçek uygulama kaynak kodu [vardiya-plani/](vardiya-plani/)
klasörü içindedir.

---

## Genel Bakış

**Ne yapıyor**

- Ana sayfada bugünün vardiyasını gösterir ("bugün sabah, öğle, gece mi,
  izin mi?"), 7 günlük bir önizleme ve küçük bir "akıllı ipucu" satırı
  sunar (ör. üst üste çalışılan gün sayısı, yaklaşan izin günü).
- Döngüsel bir şablondan
  (ör. `OFF1, OFF2, 0715, 0715, 1523, 1523, 2307, 2307`) ay boyutunda
  vardiya dağılımı üretir ve ay geçişlerinde döngü sürekliliğini korur.
- İstenen bir tarih aralığını tek vardiya ile doldurma veya aynı
  aralığı bir şablonla yeniden üretme (revize) imkânı verir.
- Tek bir günü elle düzenlemeye izin verir: vardiya değiştirme, o güne
  özel başlangıç/bitiş saati, not ekleme ve günü "kilitli" işaretleme
  (otomatik işlemler bu günü atlar).
- Program şablonlarını yönetmeye imkân tanır (4 hazır sistem şablonu
  gelir: `BYG-A1`, `BYG-B1`, `BYG-C1`, `BYG-D1`; kullanıcı yeni şablon
  ekleyebilir, düzenleyebilir, silebilir).
- Açık ve koyu temayı destekler; arayüz Türkçedir ve Türkçeye duyarlı
  metin işleme içerir (`i/İ/ı/I`, aylar, haftanın günleri).
- Mevcut planı Excel ile açılabilen UTF-8 CSV olarak dışa aktarır ve
  sistem paylaşım sayfası üzerinden paylaşır (`expo-sharing`).
- Tüm yerel verileri silip varsayılanlara döndürmeyi destekler.

**Kapsam**

- Tek kullanıcı, tek cihaz, çevrim dışı.
- Türkçe arayüz (etiketler, ay/gün isimleri, CSV başlıkları Türkçedir).
- Expo aracılığıyla Android ve iOS'u hedefler; `app.json` içinde bir web
  hedefi tanımlı olsa da birincil kullanım senaryosu değildir.
- Mevcut kodda açıkça **yer almayan** şeyler: kimlik doğrulama, hesap,
  bulut senkronizasyonu, takım yönetimi, OCR, AI/ML veya uygulama verisi
  için herhangi bir ağ I/O'su.

---

## Özellikler

Aşağıdaki özellikler kaynak kodda mevcuttur.

### Ana Sayfa (`app/(tabs)/index.tsx`)
- Türkçe tarih biçimi ile "Bugünün vardiyası" büyük kart
  (`TodayShiftCard`).
- 7 günlük yakın tarihler şeridi (`UpcomingDays`).
- Akıllı ipucu satırı (`SmartInsight`) şu durumlardan birini gösterir:
  - N gün üst üste çalışma,
  - "Sonraki izin: X gün sonra" (yaklaşan izin varsa),
  - "Sonraki mesai: <gün etiketi>" (bugün izinse).
- İki hızlı eylem butonu: takvime git, yeni plan oluştur.

### Takvim Ekranı (`app/(tabs)/calendar.tsx`)
- Türkçe haftanın gün başlıklarıyla ay ızgarası (grid oluşturucuda gün
  indeksi düzeltmesiyle Pazartesi başlangıçlı).
- Önceki/sonraki ay gezintisi ve "bugün" kısayolu
  (`goToPreviousMonth`, `goToNextMonth`, `goToToday`).
- Her hücre (`DayCell`) vardiya rengini ve kısa adını gösterir; hücreye
  dokunmak gün düzenleme ekranına (`/day/[date]`) götürür.
- Alt eylem çubuğunda "Oluştur" butonu.

### Gün Düzenleme Ekranı (`app/day/[date].tsx`)
- Ekran oluşturulmadan önce route parametresi olan `date` alanını ISO
  `YYYY-MM-DD` formatına göre doğrular.
- Görünür vardiya türlerinden seçim yaptırır (dahili `OFF1`/`OFF2`
  döngü varyantları gizlenir; tek bir "Off" seçeneği gösterilir).
- Opsiyonel, güne özel başlangıç/bitiş saati
  (`customStartTime`, `customEndTime`) `normalizeCustomTime` ile
  normalize edilir.
- Serbest metin not alanı.
- `isLocked` değerine eşlenen "Korumalı" anahtarı.
- Günü depodan kaldıran silme işlemi.

### Ay Oluştur (`app/generate.tsx`)
- Hedef ay ve başlangıç noktası (`month_start` ya da `today`) seçilir.
- Aralık ön-ayarları: bu ay, sonraki 3 ay, sonraki 6 ay, yıl sonuna
  kadar.
- Seçilen şablondan başlanır; kullanıcı şablonun okunabilir özetini
  (ör. "2 sabah, 2 öğle, 2 gece, 2 izin") önizleyebilir.
- Scheduling engine'in preview fonksiyonu üzerinden kaç günün
  üretileceği ve kaç günün (kilitli/manuel koruma nedeniyle)
  atlanacağı gösterilir.

### Aralık Revize (`app/revise.tsx`)
- Ekrandaki aylık seçiciyle serbest bir başlangıç/bitiş tarihi seçilir.
- İki mod:
  - `single_shift`: aralığı tek bir vardiya kodu ile doldur.
  - `from_template`: aralığı seçilen şablonla yeniden üret.
- Her işlem için `overrideLocked` ve `overrideManual` anahtarları.

### Şablonlar (`app/templates/index.tsx`, `app/templates/[id].tsx`)
- Tüm şablonları (varsayılanlar + kullanıcı oluşturduğu) kısa örüntü
  özetiyle listeler ve aktif olanı işaretler.
- Detay ekranı şablonun adı, döngü uzunluğu ve vardiya kodu listesi
  üzerinde düzenleme yaptırır; ayrıca yeni şablon oluşturma ve
  kullanıcıya ait şablonu silme imkânı sunar.

### Ayarlar (`app/(tabs)/settings.tsx`)
- Tema seçimi: Açık / Koyu.
- Şablonlar ekranına gitme (aktif şablonu gösterir).
- **Verileri Dışa Aktar** — UTF-8 BOM başlıklı bir CSV üretir
  (`zekra-vardiya-YYYY-MM-DD.csv`). Sütunlar: Tarih, Gün, Vardiya,
  Saat Başlangıç, Saat Bitiş, Not, Korumalı. Dosya uygulamanın cache
  dizinine yazılır ve `expo-sharing` ile sistem paylaşım sayfası
  üzerinden açılır.
- **Tüm Verileri Sil** — onay ister ve repository üzerinde
  `clearAllData()` çağırır, ardından varsayılanları yeniden ekler.
- Hakkında bölümünde sürüm (`1.0.0`) ve jenerik bilgi.

### Vardiya Türleri (sistem varsayılanları, `src/constants/shifts.ts`)
Kullanıcıya görünür 5 vardiya türü ve 2 dahili OFF varyantı:

| Kod    | Ad    | Saat        | Çalışma | Gece aşan |
|--------|-------|-------------|---------|-----------|
| 0715   | Sabah | 07:00–15:00 | evet    | hayır     |
| 1523   | Öğle  | 15:00–23:00 | evet    | hayır     |
| 2307   | Gece  | 23:00–07:00 | evet    | evet      |
| OFF    | Off   | —           | hayır   | hayır     |
| OFF1   | Off   | —           | hayır   | hayır     |
| OFF2   | Off   | —           | hayır   | hayır     |

`OFF1` ve `OFF2` ayrı kodlar olarak saklanır; böylece döngü rotasyonda
birinci ve ikinci izin gününü ayırt edebilir. Arayüz bunları tek bir
"Off" girdisine indirir (`isOffCode` üzerinden).

### Varsayılan Program Şablonları (`DEFAULT_TEMPLATES`)
Dördünün de `cycleLength` değeri 8'dir:

- **BYG-A1** — `OFF1, OFF2, 0715, 0715, 1523, 1523, 2307, 2307`
- **BYG-B1** — `2307, OFF1, OFF2, 0715, 0715, 1523, 1523, 2307`
- **BYG-C1** — `OFF2, 0715, 0715, 1523, 1523, 2307, 2307, OFF1`
- **BYG-D1** — `0715, 1523, 1523, 2307, 2307, OFF1, OFF2, 0715`

İlk açılışta aktif şablon `BYG-A1`'dir.

### Scheduling Engine (`src/services/schedulingEngine.ts`)
- `generateDays` — `preserveLocked` ve `preserveManual` koruma
  bayraklarına uyarak bir tarih aralığı için planlı günler üretir.
- `generateSchedule` — `generateDays`'i bir sonuç nesnesi
  (`success / daysGenerated / daysSkipped / errors`) ile sarmalar.
- `calculatePhaseForNewMonth` — yeni bir ayın başlangıç döngü offset'ini
  önceki günün `cycleIndex` değerinden hesaplar; cycleIndex yoksa
  şablon içinde son vardiya kodunu arayan fallback mekanizmasını
  kullanır.
- `calculatePhaseForAlignment` — belirli bir vardiya kodunu belirli bir
  tarihe denk getirecek offset değerini çözer (onboarding tarzı
  hizalama için).
- `reviseRange` — yukarıdaki iki revize modunu günlük
  `overrideLocked` / `overrideManual` kontrolleriyle uygular.
- `previewGeneration` / `previewRevision` — depoyu değiştirmeden
  aralık için istatistik döndürür.
- `isOvernightShiftByTime` / `formatOvernightShiftDisplay` — gece
  aşan vardiyalar için yardımcılar.

Engine'de kodlanmış alan kuralları:
- Gece aşan vardiyalar **başlangıç** tarihine aittir (ör. 3 Mart'ta
  23:00–07:00 vardiyası 3 Mart'a yazılır, 4 Mart'a değil).
- Kilitli günlere otomatik işlemler asla dokunmaz; manuel günler
  varsayılan olarak korunur.
- Aylar arası döngü sürekliliği her üretilen/revize edilen güne
  kaydedilen `cycleIndex` üzerinden sağlanır.

### Kalıcı Depolama (`src/repositories/`)
- `IScheduleRepository` (`types.ts`) — planlı günler, vardiya türleri,
  şablonlar, ayarlar ve veri yönetimi (`exportAllData`, `clearAllData`,
  `initializeDefaults`) için tamamen senkron bir repository arayüzü.
- `FileRepository` (`fileRepository.ts`) — `expo-file-system` (v55 yeni
  API: `File` / `Paths`) kullanan üretim uygulaması. Belleğe alınmış bir
  cache tutar ve tüm durumu `Paths.document/vardiya-plani-data.json`
  altında tek bir JSON dosyası olarak yazar. İlk erişim senkron
  `file.textSync()` okumasını tetikler, böylece React render edilmeden
  önce store zaten dolu olur. Global anahtarlı singleton Metro hot
  reload'u atlatır.
- `MemoryRepository` (`memoryRepository.ts`) — aynı arayüze sahip,
  kalıcı olmayan uygulama. Birim testlerde kullanılır ve
  `createTestRepository()` aracılığıyla erişilir.
- `index.ts` uygulama için `getRepository()` fonksiyonunu
  `getFileRepository()`'ye bağlar; testler memory varyantını doğrudan
  kullanır.

Saklanan JSON içinde ileride geriye dönük uyumluluk için bir
`version: 1` alanı vardır; şu an için migrasyon kodu gerekmemektedir.

### Durum Yönetimi (`src/stores/scheduleStore.ts`)
- Dosya repository'sinden **modül yüklenirken senkron olarak** hidrate
  edilen bir Zustand store. İlk render'da vardiyalar, şablonlar, planlı
  günler ve ayarlar hazırdır.
- Planlı günler, vardiya türleri, şablonlar ve ayarlar için CRUD
  eylemlerini; ayrıca `generateMonth`, `reviseRange`, `exportData`,
  `clearAllData` ile UI gezintisi yardımcılarını (`goToPreviousMonth`,
  `goToNextMonth`, `goToToday`, `setSelectedDate`, `setViewMonth`)
  dışa açar.
- Selektörler: `selectTodayShift`, `selectActiveTemplate`,
  `selectShiftType`, `selectViewMonthDays`.

### Tema (`src/context/ThemeContext.tsx`)
- `ThemeProvider`, store'dan `settings.theme` değerini okur ve bir
  `ThemeColors` nesnesi ile `isDark` bayrağını `useTheme()` aracılığıyla
  sunar.
- İki palet (`lightTheme`, `darkTheme`) — semantik renk yuvalarıyla
  (arka plan, yüzey, metin, primary, danger, warning, vs.).

### Splash Yaşam Döngüsü (`src/utils/splashController.ts`,
`app/_layout.tsx`)
- `preventAutoHide()` modül değerlendirmesi sırasında, React monte
  olmadan önce çağrılır ve native splash ekranını sabitler.
- İlk görünür ekran (Ana Sayfa), `onLayout` içinde
  `notifyFirstScreenReady()` çağırır; bir animasyon kare sonrası splash
  dismiss edilir.
- Root layout'ta çalışan 4 saniyelik bir watchdog, ilk ekran sinyal
  verememesi durumunda bile splash'ın gizleneceğini garanti eder.
- `src/utils/startupTimer.ts` içindeki `startupMark()`, başlangıç yolu
  boyunca adlandırılmış zaman damgaları kaydeder.

### Türkçe İşleme (`src/utils/turkish.ts`, `src/utils/date.ts`)
- `toUpperTR` / `toLowerTR` / `compareTR`, `tr-TR` locale kullanır;
  böylece `i/İ/ı/I` dönüşümü doğru çalışır.
- `includesTR` / `startsWithTR` Türkçeye duyarlı içerme / önek
  yardımcılarıdır.
- `TURKISH_MONTHS`, `TURKISH_WEEKDAYS`,
  `TURKISH_WEEKDAYS_MONDAY_START` ile `getMonthNameTR` /
  `getWeekdayNameTR` yerel isimleri sağlar.
- Tüm tarih biçimlendirmesi `date-fns` + `tr` locale üzerinden geçer
  (`formatDateTR`, `formatDateShortTR`, `formatMonthYearTR`,
  `formatWeekdayTR`).

### Dışa Aktarma Biçimi
UTF-8 BOM'lu ve Türkçe yerelleştirilmiş sütun başlıklarına sahip CSV.
Notlar tırnaklanarak kaçış yapılır; böylece içinde gömülü virgül/tırnak
olması parser'ı bozmaz. Dosya adı UTC yerine yerel tarihi kullanır, yani
"bugün" kullanıcının saat dilimiyle eşleşir.

### Testler
- `src/services/schedulingEngine.test.ts`,
  `src/repositories/fileRepository.test.ts` ve
  `src/utils/turkish.test.ts` Vitest ile yazılmıştır
  (`environment: 'node'`). `FileRepository`, ortak arayüz üzerinden
  bellekte test edilir.

---

## Proje Yapısı

```
zegra/
├─ README.md                        # bu dosyanın İngilizce versiyonu
├─ README.tr.md                     # bu dosya
├─ vardiya-plani-v1-final.md        # orijinal planlama dokümanı (TR)
├─ eski-planlar/                    # eski planlama taslakları (TR)
├─ komut.txt                        # Expo / Gradle komut notları
├─ ornek-program.jpeg               # referans ekran görüntüsü
├─ Kayit1.mp4                       # demo kaydı
├─ Çalışma Programı 2026.xlsx       # kaynak iş çizelgesi (Excel)
└─ vardiya-plani/                   # uygulama
   ├─ app/                          # expo-router route'ları
   │  ├─ _layout.tsx                # root Stack + tema + splash bağlantısı
   │  ├─ (tabs)/                    # alt sekme grubu
   │  │  ├─ _layout.tsx             # Ana Sayfa / Takvim / Ayarlar
   │  │  ├─ index.tsx               # ana sayfa
   │  │  ├─ calendar.tsx            # aylık takvim
   │  │  └─ settings.tsx            # ayarlar + CSV dışa aktarma + silme
   │  ├─ day/[date].tsx             # tek gün düzenleme (modal)
   │  ├─ generate.tsx               # şablondan ay oluşturma
   │  ├─ revise.tsx                 # tarih aralığı revize etme
   │  └─ templates/
   │     ├─ index.tsx               # şablon listesi
   │     └─ [id].tsx                # şablon detay / düzenleme
   ├─ src/
   │  ├─ components/
   │  │  ├─ calendar/               # CalendarHeader, Grid, DayCell, Actions
   │  │  ├─ home/                   # TodayShiftCard, UpcomingDays,
   │  │  │                          #   QuickActions, SmartInsight
   │  │  └─ ui/                     # PressableScale
   │  ├─ constants/shifts.ts        # varsayılan vardiya türleri + şablonlar
   │  ├─ context/ThemeContext.tsx   # açık/koyu tema
   │  ├─ repositories/              # IScheduleRepository, File + Memory
   │  ├─ services/schedulingEngine.ts
   │  ├─ stores/scheduleStore.ts    # Zustand store (modül yüklenirken hidrate)
   │  ├─ types/index.ts             # alan tipleri
   │  └─ utils/                     # date, turkish, splashController,
   │                                #   startupTimer, shiftTime
   ├─ assets/                       # ikonlar, splash
   ├─ app.json                      # Expo yapılandırması (isim, ikon, pluginler)
   ├─ eas.json                      # EAS build profilleri
   ├─ babel.config.js
   ├─ tsconfig.json                 # strict TS, @/* → src/*
   ├─ vitest.config.ts              # node ortamı, @ alias
   ├─ package.json
   └─ android-sdk-setup-note.md     # Android SDK kurulum notu (TR)
```

---

## Kullanılan Teknolojiler

[vardiya-plani/package.json](vardiya-plani/package.json) içinde
tanımlanmıştır:

- **Runtime / UI** — React 19.2.4, React Native 0.83.2, Expo SDK 55
  (`expo`, `expo-router`, `expo-splash-screen`, `expo-status-bar`,
  `expo-linear-gradient`, `expo-linking`, `expo-localization`,
  `expo-constants`, `expo-dev-client`).
- **Gezinti** — `expo-router` (dosya tabanlı, `experiments.typedRoutes`
  ile tipli route'lar) ve `@react-navigation/native`.
- **Durum** — `zustand` ^5 (tek store, `scheduleStore`).
- **Kalıcılık** — `expo-file-system` v55 yeni `File` / `Paths` API'si
  (`textSync` / `write`), tek JSON dosyası.
- **Tarihler** — `date-fns` + Türkçe (`tr`) locale.
- **Safe area / screens** — `react-native-safe-area-context`,
  `react-native-screens`.
- **Dışa aktarma / paylaşım** — CSV paylaşım sayfası için
  `expo-sharing`.
- **Yeni mimari** — `app.json` içinde `newArchEnabled: true`.
- **Dil / build** — TypeScript ~5.9 (strict,
  `noUncheckedIndexedAccess`, `baseUrl: "."`, `@/*` → `src/*`),
  `babel-preset-expo`.
- **Test** — Vitest ^4, Node ortamı.
- **Dağıtım** — `eas.json` içinde `development`, `preview`,
  `production` (app bundle) ve `production-apk` profilleri.

Android paketi / iOS bundle identifier: `com.vardiyaplani.app`.
Expo project ID: `9db300d9-669f-474f-98cf-4d9184605880`.

---

## Kurulum

Komutlar `vardiya-plani/` altından çalıştırılır.

```bash
cd vardiya-plani
npm install
```

Gereksinimler (bulut build'ler için `eas.json` içinde tanımlıdır):
- EAS build'leri için Node 22.14.0. `package.json` yerel için bir Node
  sürümü sabitlemez, ancak Expo SDK 55 güncel bir LTS (18+) bekler.
- Expo CLI `npx expo` / `npx eas` üzerinden çağrılır.
- Native Android build için Android SDK kurulu olmalıdır; `local.properties`
  ve `ANDROID_HOME` ayarları için
  [vardiya-plani/android-sdk-setup-note.md](vardiya-plani/android-sdk-setup-note.md)
  (TR) dokümanına bakın.

---

## Kullanım

[vardiya-plani/package.json](vardiya-plani/package.json) içindeki
betikler:

```bash
# Geliştirme
npm run start                 # expo start (Metro dev sunucusu)
npm run android               # expo run:android (yerel native build)
npm run ios                   # expo run:ios
npm run web                   # expo start --web

# Testler
npm run test                  # vitest (watch)
npm run test:run              # vitest run (tek geçiş)

# EAS bulut build'leri
npm run build:android:preview     # dahili APK
npm run build:android:prod        # Play Store app bundle
npm run build:android:prod-apk    # production APK
npm run build:ios:preview         # dahili iOS
npm run build:ios:prod            # App Store iOS
npm run build:all:preview         # her iki platform, preview profili
```

Açıldıktan sonra temel in-app akış:

1. İlk açılışta aktif şablon `BYG-A1`'dir ve hiç planlı gün yoktur;
   ana sayfa "plan oluştur" çağrısı gösterir.
2. **Plan Oluştur**'a dokununca Ay Oluştur ekranı açılır; aralık
   ön-ayarı ve başlangıç noktası seçip onaylarsınız — ay dolar.
3. Takvim sekmesi ayı ızgara olarak gösterir; herhangi bir güne
   dokunmak gün düzenleme modalını açar.
4. Aralık değişiklikleri için Revize ekranını, şablon yönetimi için
   Şablonlar ekranını, CSV dışa aktarma / tema değişimi / tüm verileri
   silme için Ayarlar'ı kullanın.

---

## Yapılandırma

- **Expo uygulama yapılandırması** —
  [vardiya-plani/app.json](vardiya-plani/app.json):
  uygulama adı `Vardiya Planı`, slug `vardiya-plani`, scheme
  `vardiyaplani`, sadece dikey yönlendirme, yeni mimari etkin, adaptive
  ikon arka planı `#0B1026`, splash-screen plugin'i `assets/icon2.png`
  ile yapılandırılmış, `extra.eas.projectId` içinde Expo project ID
  gömülü.
- **EAS build profilleri** —
  [vardiya-plani/eas.json](vardiya-plani/eas.json) —
  `development` (dev client, internal), `preview` (internal APK /
  internal iOS), `production` (app bundle / store), `production-apk`
  (production APK varyantı). Build'lerde Node 22.14.0 zorlanır ve
  `base` env'e `NPM_CONFIG_LEGACY_PEER_DEPS=true` eklenir.
- **TypeScript** — strict mode, `noUncheckedIndexedAccess`, path alias
  `@/*` → `src/*`
  ([vardiya-plani/tsconfig.json](vardiya-plani/tsconfig.json)).
- **Vitest** — `environment: 'node'`, `@` alias `src/`
  ([vardiya-plani/vitest.config.ts](vardiya-plani/vitest.config.ts)).
- **Uygulama ayarları** (çalışma anında, yerelde saklanır;
  [vardiya-plani/src/types/index.ts](vardiya-plani/src/types/index.ts)):
  - `activeTemplateId`
  - `weekStartsOnMonday` (varsayılan `true`)
  - `theme` (`light` | `dark`)
  - `showOffVariants` (`OFF1`/`OFF2` ayrı ayrı mı gösterilsin; varsayılan
    olarak kapalıdır — UI bunları tek bir "Off" olarak birleştirir)
  - `onboardingDone`

Çalışma anında herhangi bir ortam değişkeni, `.env` dosyası veya uzak
uç nokta kullanılmaz.

---

## Mimari / Temel Bileşenler

Katmanlı, tek yönlü veri akışı:

```
              React ekranları & bileşenleri  (app/ + src/components/)
                              │
                              ▼
                  Zustand store — scheduleStore
                  (src/stores/scheduleStore.ts)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  Scheduling engine     Repository (sync)    Domain tipleri
  (saf fonksiyonlar)    IScheduleRepository  (src/types)
  src/services/…        src/repositories/…
                              │
                              ▼
                    FileRepository (JSON)
                    expo-file-system v55
                    Paths.document/vardiya-plani-data.json
```

- **Ekranlar** store'dan Zustand selektörleriyle veri okur ve aksiyon
  tetikler; doğrudan repository ile konuşmaz.
- **Store** bellekteki tek kaynak doğrulayıcıdır. Her değiştirici
  aksiyon, değişikliği aynı anda kalıcı hale getirmek için repository'yi
  de çağırır.
- **Scheduling engine** saf fonksiyonlardan oluşur; hem store
  (üretim/revize sırasında) hem de doğrudan testlerden çağrılır.
- **Repository** iki uygulaması olan bir arayüzdür. Üretim
  bağlamında `FileRepository` kullanılır; `MemoryRepository` testler ve
  dosya sistemi olmayan ortamlar içindir.
- **Tema**, store'daki `settings.theme` değerine abone olan küçük bir
  React context tarafından yönetilir; böylece tema değişimi anlık ve
  kalıcıdır.

### Alan Modeli (`src/types/index.ts`)

- `ShiftType` — `id, code, name, shortName, color, startTime, endTime,
  isWorking, isOvernight, isEditable`.
- `ProgramTemplate` — `id, name, cycleLength, steps[], isActive,
  isDefault`.
- `PlannedDay` — `date (ISO), shiftCode, isLocked, source
  ('generated' | 'manual' | 'revised'), templateId, note, cycleIndex?,
  customStartTime?, customEndTime?`.
- `AppSettings` — `activeTemplateId, weekStartsOnMonday, theme,
  showOffVariants, onboardingDone`.
- `GenerateOptions` / `GenerateResult` / `RevisionOptions` engine'i
  besler.
- `MonthlySummary` / `ShiftCount` aylık özet için tanımlanmıştır.

---

## Veri Akışı / İşlem Akışı / Runtime Akışı

### Soğuk Başlangıç

1. `scheduleStore.ts` import edilir — modül değerlendirmesi sırasında
   `getRepository()` çağrılır ve `FileRepository` singleton döner.
2. `FileRepository.load()` **senkron olarak** `file.textSync()` ile
   çalışır ve bellekteki diziler/map'ler doldurulur;
   `initializeDefaults()` dosya boşsa varsayılan vardiya türü / şablonu
   ekler.
3. İlk değerler `useScheduleStore` içine akar, böylece her selektör ilk
   render'da gerçek veriye sahiptir.
4. `app/_layout.tsx` modül yüklenirken `preventAutoHide()` çağırır;
   root layout 4 saniyelik splash watchdog'u başlatır.
5. İlk ekran (`app/(tabs)/index.tsx`) `onLayout` bildirir,
   `notifyFirstScreenReady()` çağrılır ve bir animasyon kare sonrasında
   native splash kapatılır.

### Ay Üretme

1. Kullanıcı Ay Oluştur ekranını açar, şablon, başlangıç noktası ve
   aralık seçer.
2. Store'un `generateMonth` fonksiyonu aktif şablonu bulur; önceki
   günün saklı `cycleIndex` değerinden `calculatePhaseForNewMonth` ile
   bir `phaseOffset` türetir (cycleIndex yoksa vardiya kodu üzerinden
   geriye dönüşe başvurur).
3. `generateDays`, tarih aralığını dolaşır; `preserveLocked && isLocked`
   ya da `preserveManual && source='manual'` koşullarını sağlayan
   günleri atlar; geri kalan her tarihe `source: 'generated'` ve
   `cycleIndex` içeren bir `PlannedDay` yazar.
4. `FileRepository.setPlannedDays` cache'i günceller ve tüm JSON
   dosyasını diske yazar; store kendi `plannedDays` map'ini günceller.

### Aralık Revize

1. Kullanıcı bir aralık ve mod (`single_shift` veya `from_template`)
   seçer, kilitli/manuel günlerin üzerine yazma anahtarlarını ayarlar.
2. `reviseRange`, `source: 'revised'` ile yeni `PlannedDay` nesneleri
   üretir; mümkünse mevcut `note` ve `cycleIndex` değerlerini korur.
3. Sonuçlar kalıcı hale getirilir ve store'a yansıtılır.

### Tek Gün Düzenleme

1. Gün düzenleme ekranı `:date` route parametresini doğrular.
2. Değişiklikler `setPlannedDay(day)` ile kaydedilir; bu aksiyon günü
   (bu ekrandan oluşturulmuşsa) `source: 'manual'` olarak ve isteğe
   bağlı `isLocked: true` olarak işaretler; `deleteDay` günü siler.
3. Güne özel başlangıç/bitiş saatleri `PlannedDay` üzerinde saklanır
   (`customStartTime`, `customEndTime`), vardiya türünde değil.

### CSV Dışa Aktarma

1. Ayarlar → Verileri Dışa Aktar.
2. `generateExcelContent()` BOM ön ekli, Türkçe başlıklı, yerelleştirilmiş
   gün adlarına sahip ve notları tırnaklanmış bir CSV üretir.
3. Dosya `Paths.cache/zekra-vardiya-<yerel-tarih>.csv` konumuna yazılır
   ve `Sharing.shareAsync` ile gösterilir.

### Gece Aşan Vardiya Kuralı

Bir vardiya, `startHour > endHour` ise gece aşan olarak kabul edilir
(`isOvernightShiftByTime` kontrol eder). Gece aşan vardiyalar depoda
her zaman **başlangıç** tarihine bağlanır; UI, bitiş saatini
`formatOvernightShiftDisplay` üzerinden gösterir
("<ad> (<bitiş>'e kadar)").

---

## Sınırlamalar / Mevcut Durum

- **Sadece yerel.** Tüm veri tek bir JSON dosyasında
  (`Paths.document/vardiya-plani-data.json`) saklanır. Bulut senkronu,
  içe aktarma veya çok cihazlı destek yoktur. "Dışa Aktar" bir CSV
  üretir; "Tüm Verileri Sil" tüm verileri siler ve varsayılanları
  yeniden ekler.
- **Türkçe arayüz.** Etiketler, CSV başlıkları, ay/gün isimleri ve
  "Bugün", "Yarın", "Sonraki mesai" gibi ifadeler Türkçedir. Intl'in
  kullandığı sistem locale'i dışında çalışma anında locale geçişi
  yoktur.
- **Dahili OFF1 / OFF2.** Bunlar döngü rotasyonunun ayırt edilebilir
  kalmasını sağlar ama gün düzenleme seçicisinde gizlenir; aktif UI
  tek bir "Off" girdisi gösterir. `showOffVariants` ayarı tiplerde ve
  varsayılan ayarlarda mevcuttur ancak mevcut ekranlarda bu bayrağı
  değiştiren bir arayüz unsuru yoktur.
- **Varsayılanlar her zaman kaldırılamaz.** `DEFAULT_SHIFT_TYPES` ve
  `DEFAULT_TEMPLATES`, ilgili liste boşsa `initializeDefaults()` ile
  yeniden eklenir. Kullanıcının oluşturduğu şablon silinebilir;
  varsayılanları "temizlemek" ise "Tüm Verileri Sil" işlemidir (onları
  yine geri yükler).
- **Onboarding akışı yok.** `settings.onboardingDone` alanı tiplerde ve
  varsayılan ayarlarda mevcut ancak mevcut route'larda bir onboarding
  ekranı tanımlı değildir.
- **Hooks klasörü boş.** `src/hooks/` klasörü var ama içinde dosya
  yok.
- **Hafta başlangıcı.** `settings.weekStartsOnMonday` varsayılan olarak
  `true`'dur ve takvim, ay ızgarası oluşturucusu tarafından Pazartesi
  başlangıçlı çizilir; bunu çalışma anında değiştiren bir UI anahtarı
  yoktur.
- **Native build önkoşulları.** `expo run:android` için Android SDK
  yapılandırılmalıdır (bkz.
  [vardiya-plani/android-sdk-setup-note.md](vardiya-plani/android-sdk-setup-note.md)).
- **Depo kök içeriği.** Kök dizin ayrıca planlama dokümanları (TR),
  referans bir ekran görüntüsü (`ornek-program.jpeg`), bir demo kaydı
  (`Kayit1.mp4`) ve varsayılan vardiya türlerine ilham veren kaynak
  Excel çizelgesini (`Çalışma Programı 2026.xlsx`) barındırır.
  Uygulamanın kendisi tamamen
  [vardiya-plani/](vardiya-plani/) altındadır.

---

## Notlar

- "Zekra", uygulama başlığında ve Ayarlar'ın Hakkında bölümünde görünen
  ürün/marka adıdır; paket / bundle identifier `com.vardiyaplani.app`
  ve uygulamanın görünen adı "Vardiya Planı"dır.
- Uygulama **yeni React Native mimarisini** hedefler (`app.json` içinde
  `newArchEnabled: true`), React 19.2 ve RN 0.83 kullanır.
- Store hidrasyonu bilerek senkrondur: store dosyayı modül yüklenirken
  okur ve böylece ilk render zaten dolu olur; native splash de ilk
  ekran ekrana geldiği anda kapatılabilir.
- Depo kökündeki `Kayit1.mp4` bir demo kaydıdır ve build ile ilgisi
  yoktur; `komut.txt`, yazar tarafından saklanan kısa komut notlarını
  (`expo prebuild`, `gradlew assembleDebug`, `eas build` varyantları)
  içerir.
