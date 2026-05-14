## 🇬🇧 English

Bu dokümanın İngilizce versiyonu için [README.md](README.md)

---

# Vardiya Planı

Vardiyalı çalışanlar için yerel-öncelikli (local-first) bir React Native /
Expo mobil uygulaması. Uygulama; tek bir kullanıcının kendi vardiya
rotasyonunu aylık bir takvim üzerinde görmesini, planlamasını ve
düzenlemesini sağlar. Tüm veriler yalnızca cihazda saklanır; giriş, bulut
senkronizasyonu veya herhangi bir backend yoktur.

Uygulama kaynak kodu doğrudan depo kök dizinindedir (`app/`, `src/`,
`assets/` ve Expo/native yapılandırma dosyaları). Önceden üretilmiş bir
native Android projesi `android/` klasöründe yer alır.

- **Ürün adı:** Vardiya Planı
- **Geliştirici markası:** Demrivo
- **Paket / bundle kimliği:** `com.demrivo.vardiyaplani`

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
  özel başlangıç/bitiş saati (sabit `HH:mm` formatlı giriş ile), not
  ekleme, o güne özel fazla mesai / eksik saat kaydetme ve günü "kilitli"
  işaretleme (otomatik işlemler bu günü atlar).
- Çalışma vardiyalarının (Sabah, Öğle, Gece) varsayılan başlangıç/bitiş
  saatlerini, ayrı bir "Vardiya Saatleri" ekranından özelleştirmeye izin
  verir.
- Program şablonlarını yönetmeye imkân tanır (4 hazır sistem şablonu
  gelir: `BYG-A1`, `BYG-B1`, `BYG-C1`, `BYG-D1`; kullanıcı yeni şablon
  ekleyebilir, düzenleyebilir, silebilir).
- Aylık bir "Mesai Özeti" (fazla mesai / eksik saat toplamları) ve bir
  "Aylık Notlar" listesi gösterir; ikisi de ortak bir ay seçicisiyle
  çalışır.
- Türkiye resmi tatillerini takvimde ve gün detayında işaretler (yalnızca
  gösterim — tatiller planlamayı etkilemez).
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

Aşağıdaki özellikler kaynak ağacında mevcuttur.

### Ana sayfa (`app/(tabs)/index.tsx`)
- "Bugünün vardiyası" hero kartı (`TodayShiftCard`), Türkçe biçimli tarih.
- 7 günlük önizleme şeridi (`UpcomingDays`).
- Akıllı ipucu satırı (`SmartInsight`) şunlardan birini gösterir:
  - N gün üst üste çalışma (ve "bugün serinin kaçıncı günü" mesajı),
  - bir izin günü yaklaşırken "X gün sonra izin",
  - bugün izinse "Sonraki mesai: <gün etiketi>".
- İki hızlı işlem butonu (`QuickActions`): takvimi aç, yeni plan oluştur.
- Alt işlem satırı (`HomeBottomActions`) iki bottom sheet açar:
  - **Mesai Özeti** (`SummarySheet`) — aylık fazla mesai / eksik saat
    toplamları.
  - **Aylık Notlar** (`NotesSheet`) — o ayın gün notları.

### Takvim ekranı (`app/(tabs)/calendar.tsx`)
- Türkçe haftanın günü başlıklarıyla ay ızgarası (ızgara üreticideki bir
  gün-indeksi düzeltmesiyle Pazartesi-başlangıçlı).
- Önceki/sonraki ay gezinmesi ve "bugün" kısayolu
  (`goToPreviousMonth`, `goToNextMonth`, `goToToday`).
- Her hücre (`DayCell`) doygun, dolu bir vardiya rengiyle boyanır ve
  vardiya kısa adını gösterir (`S` / `Ö` / `G` / `Off`); açık ve koyu
  modun ayrı renk değerleri vardır. Hücreye dokununca gün düzenleme
  ekranına gidilir (`/day/[date]`).
- Bugün vurgulu bir kenarlık alır; tatiller gün numarasının altında ince
  bir kırmızı çizgi alır; notu olan günlerde küçük bir nokta, kilitli
  günlerde küçük bir kilit göstergesi belirir.
- Alt işlem çubuğu (`CalendarActions`) bir "Oluştur" butonu içerir.

### Gün düzenleme ekranı (`app/day/[date].tsx`)
- Render etmeden önce `date` rota parametresini ISO `YYYY-MM-DD`
  formatına göre doğrular.
- Kullanıcıya görünür vardiya tiplerinden seçim yaptırır (dahili
  `OFF1`/`OFF2` döngü varyantları gizlidir; tek bir "Off" seçeneği
  gösterilir).
- Opsiyonel güne özel başlangıç/bitiş saati (`customStartTime`,
  `customEndTime`), ortak `TimeInput` bileşeniyle girilir — sabit `HH:mm`
  formatı, silinemeyen `:` ve yalnızca rakam alan alanlar; kaydederken
  `normalizeTimeString` / `normalizeCustomTime` ile normalize edilir.
- O güne özel **Fazla Mesai** ve **Eksik Saat** girişleri; planlı günde
  `overtimeMinutes` / `shortageMinutes` olarak saklanır.
- Not alanı (serbest metin).
- `isLocked` alanına bağlanan "Bu Günü Koru" anahtarı.
- Tarih resmi tatilse bir tatil bilgi şeridi.
- Günü depolamadan kaldıran silme işlemi.

### Vardiya saatleri ekranı (`app/shift-times.tsx`)
- Çalışma vardiyalarının (Sabah, Öğle, Gece) varsayılan başlangıç/bitiş
  saatlerini özelleştirmeye izin verir; OFF varyantları ve düzenlenemez
  vardiyalar hariç tutulur.
- Ortak `TimeInput` bileşenini ve "varsayılana dön" işlemli bir
  bottom-sheet düzenleyici kullanır.
- Yeni saatler store'daki `ShiftType` üzerine kalıcı yazılır, böylece
  `startTime` / `endTime` okuyan her ekran etkilenir. Güne özel saatler
  yine `getEffectiveShiftTime` üzerinden önceliklidir.

### Ay oluştur (`app/generate.tsx`)
- Bir hedef ay ve bir başlangıç noktası seçer (`month_start` veya
  `today`).
- Aralık ön ayarları: bu ay, sonraki 3 ay, sonraki 6 ay, yıl sonuna kadar.
- Aktif şablondan başlar; şablon deseninin okunabilir bir özetini
  gösterir.
- Planlama motorunun önizlemesini kullanarak kaç günün üretileceğini ve
  kaçının atlanacağını (kilitli/elle koruma nedeniyle) gösterir.

### Aralık revizesi (`app/revise.tsx`)
- Ekran içi bir ay seçicisinden rastgele bir başlangıç/bitiş tarihi seçin.
- İki mod:
  - `single_shift`: aralığı tek bir vardiya kodu ile doldur.
  - `from_template`: aralığı seçilen bir şablondan yeniden üret.
- İşlem başına `overrideLocked` ve `overrideManual` anahtarları.
- Korumalı (override edilen) günlerdeki mevcut `note`, `overtimeMinutes`
  ve `shortageMinutes` değerleri korunur.

### Şablonlar (`app/templates/index.tsx`, `app/templates/[id].tsx`)
- Tüm şablonları (varsayılanlar + kullanıcının oluşturdukları) desenlerinin
  anlaşılır bir özetiyle listeler ve aktif olanı işaretler.
- Bir şablonun adını, döngü uzunluğunu ve sıralı vardiya kodu listesini
  düzenlemek için detay ekranı; ayrıca yeni şablon oluşturma ve kullanıcı
  şablonlarını silme.

### Ayarlar (`app/(tabs)/settings.tsx`)
- Tema anahtarı: Açık / Koyu.
- Şablonlar ekranına geçiş (o an aktif şablonu gösterir).
- Vardiya saatleri ekranına geçiş.
- **Verileri Dışa Aktar** — şu sütunlarla UTF-8 BOM'lu bir CSV
  (`vardiya-plani-YYYY-MM-DD.csv`) üretir:
  Tarih, Gün, Vardiya, Saat Başlangıç, Saat Bitiş, Not, Korumalı.
  Dosya uygulama önbellek dizinine yazılır ve `expo-sharing` ile işletim
  sistemi paylaşım sayfası üzerinden açılır.
- **Tüm Verileri Sil** — onaylar ve depoda `clearAllData()` çağırır,
  ardından varsayılanları yeniden ekler.
- Hakkında bölümü: ürün adı "Vardiya Planı", bir sürüm metni, "Demrivo
  tarafından geliştirildi" satırı ve katkı bilgileri (geliştirici /
  fikir katkısı).

### Vardiya tipleri (sistem varsayılanları `src/constants/shifts.ts`)
Kullanıcıya görünür dört vardiya tipi ve iki dahili OFF varyantı:

| Kod    | Ad    | Saat        | Renk (varsayılan) | Çalışma | Gece geçer |
|--------|-------|-------------|-------------------|---------|------------|
| 0715   | Sabah | 07:00–15:00 | `#16A34A`         | evet    | hayır      |
| 1523   | Öğle  | 15:00–23:00 | `#F97316`         | evet    | hayır      |
| 2307   | Gece  | 23:00–07:00 | `#3B82F6`         | evet    | evet       |
| OFF    | Off   | —           | `#94A3B8`         | hayır   | hayır      |
| OFF1   | Off   | —           | `#94A3B8`         | hayır   | hayır      |
| OFF2   | Off   | —           | `#94A3B8`         | hayır   | hayır      |

`OFF1` ve `OFF2` ayrı kodlar olarak saklanır, böylece döngü bir
rotasyondaki birinci ve ikinci izin gününü ayırt edebilir; ancak arayüz
bunları tek bir "Off" girişinde toplar (`isOffCode` ile).

`src/constants/shifts.ts` ayrıca, paleti koyulaştırılmadan önce uygulamayı
kuran kullanıcıları yükselten `FileRepository` migrasyonunun kullandığı
eski renk değerlerini de tutar (`LEGACY_SABAH_COLOR`, `LEGACY_OFF_COLOR`).

### Varsayılan program şablonları (`DEFAULT_TEMPLATES`)
Dördünün de `cycleLength: 8`:

- **BYG-A1** — `OFF1, OFF2, 0715, 0715, 1523, 1523, 2307, 2307`
- **BYG-B1** — `2307, OFF1, OFF2, 0715, 0715, 1523, 1523, 2307`
- **BYG-C1** — `OFF2, 0715, 0715, 1523, 1523, 2307, 2307, OFF1`
- **BYG-D1** — `0715, 1523, 1523, 2307, 2307, OFF1, OFF2, 0715`

İlk açılışta aktif şablon `BYG-A1`'dir.

### Planlama motoru (`src/services/schedulingEngine.ts`)
- `generateDays` — bir tarih aralığı için planlı günler üretir,
  `preserveLocked` ve `preserveManual` koruma bayraklarına uyar.
- `generateSchedule` — `generateDays`'i bir sonuç nesnesiyle sarar
  (`success / daysGenerated / daysSkipped / errors`).
- `calculatePhaseForNewMonth` — yeni bir ay için başlangıç döngü ofsetini,
  önceki günün saklı `cycleIndex` değerine göre hesaplar; şablon içinde
  son vardiya kodunu arayan bir geri-dönüş mekanizması içerir.
- `calculatePhaseForAlignment` — hedef bir vardiya kodunu hedef bir tarihe
  yerleştirecek faz ofsetini çözer (onboarding tarzı hizalama için).
- `reviseRange` — yukarıda anlatılan iki revize modunu uygular; gün başına
  `overrideLocked` / `overrideManual` kontrolleriyle; override edilen
  günlerde `note`, `overtimeMinutes` ve `shortageMinutes` korunur.
- `previewGeneration` / `previewRevision` — depolamayı değiştirmeden
  etkilenen aralık için istatistik döner.
- `isOvernightShiftByTime` / `formatOvernightShiftDisplay` — gece geçen
  vardiyalar için yardımcılar.

Motorda kodlanmış alan kuralları:
- Gece geçen vardiyalar **başlangıç** tarihine aittir (ör. 3 Mart'taki bir
  23:00–07:00 vardiyası 4 Mart'a değil 3 Mart'a kaydedilir).
- Kilitli günlere otomatik işlemler asla dokunmaz; elle girilen günler
  varsayılan olarak korunur.
- Aylar arası döngü sürekliliği, her üretilen/revize edilen güne kaydedilen
  `cycleIndex` ile sağlanır.
- Fazla mesai ve eksik saat **ayrı** tutulur — birbirinden mahsup edilmez
  ve uygulama hiçbir net mesai/ücret hesabı yapmaz.

### Kalıcılık (`src/repositories/`)
- `IScheduleRepository` (`types.ts`) — planlı günleri, vardiya tiplerini,
  şablonları, ayarları ve veri yönetimini (`exportAllData`, `clearAllData`,
  `initializeDefaults`) kapsayan tamamen senkron bir depo arayüzü.
- `FileRepository` (`fileRepository.ts`) — yeni `File` / `Paths` API'sini
  kullanan `expo-file-system` tabanlı üretim implementasyonu. Bellek içi
  bir önbellek tutar ve tüm durumu tek bir JSON dosyası olarak
  `Paths.document/vardiya-plani-data.json` konumuna yazar. İlk erişimde
  senkron bir `file.textSync()` okuması tetiklenir, böylece store React
  render etmeden önce doludur. Global-anahtarlı bir singleton Metro hot
  reload'ı atlatır. Yüklemede, yalnızca kullanıcının hiç özelleştirmediği
  vardiya renklerini yeniden yazan küçük bir renk migrasyonu
  (`migrateShiftColors`) çalışır.
- `MemoryRepository` (`memoryRepository.ts`) — aynı arayüze sahip, kalıcı
  olmayan bir implementasyon; birim testleri tarafından kullanılır ve
  `createTestRepository()` ile erişilebilir.
- `index.ts`, uygulama için `getRepository()`'yi `getFileRepository()`'ye
  bağlar; testler doğrudan bellek varyantını kullanır.

Saklanan JSON, ileri uyumluluk için bir `version: 1` alanı taşır; renk
migrasyonu dışında şu an bir şema migrasyon kodu gerekmiyor.

### Durum yönetimi (`src/stores/scheduleStore.ts`)
- **Modül yüklenirken senkron olarak** dosya deposundan hidre edilen bir
  Zustand store; böylece ilk render zaten vardiyalara, şablonlara, planlı
  günlere ve ayarlara sahip.
- Planlı günler, vardiya tipleri, şablonlar ve ayarlar için CRUD
  aksiyonları; ayrıca `generateMonth`, `reviseRange`, `exportData`,
  `clearAllData`, takvim gezinme yardımcıları (`goToPreviousMonth`,
  `goToNextMonth`, `goToToday`, `setSelectedDate`, `setViewMonth`) ve
  Mesai Özeti ile Aylık Notlar sheet'lerinin paylaştığı ayrı bir "özet
  ayı" imleci (`setSummaryMonth`, `goToPreviousSummaryMonth`,
  `goToNextSummaryMonth`, `resetSummaryToCurrentMonth`) sunar.
- Seçiciler: `selectTodayShift`, `selectActiveTemplate`, `selectShiftType`,
  `selectViewMonthDays`.

### Tema (`src/context/ThemeContext.tsx`)
- `ThemeProvider`, store'dan `settings.theme`'i okur ve `useTheme()`
  aracılığıyla bir `ThemeColors` nesnesi ile bir `isDark` bayrağı sunar.
- Anlamsal renk yuvalarına sahip iki palet (`lightTheme`, `darkTheme`):
  background, surface, text, primary, danger, warning ve ikon çipleri için
  `iconChipBg` / `iconChipFg`.

### Splash yaşam döngüsü (`src/utils/splashController.ts`, `app/_layout.tsx`)
- `preventAutoHide()`, React mount edilmeden önce, modül değerlendirme
  zamanında çalışır ve native splash ekranını dondurur.
- İlk görünen ekran (ana sayfa) `onLayout`'undan
  `notifyFirstScreenReady()` çağırır; bir animasyon karesi sonra splash
  kapatılır.
- Kök yerleşimdeki 4 saniyelik bir gözcü (watchdog), ilk ekran hazır
  sinyali veremese bile splash'ın gizlenmesini garanti eder.
- `src/utils/startupTimer.ts` içindeki `startupMark()`, açılış yolu boyunca
  isimli zaman damgaları kaydeder.

### Türkçe işleme (`src/utils/turkish.ts`, `src/utils/date.ts`)
- `toUpperTR` / `toLowerTR` / `compareTR`, `i/İ/ı/I` büyük-küçük harf
  eşlemesi doğru olsun diye `tr-TR` yerel ayarını kullanır.
- `includesTR` / `startsWithTR`, Türkçeye duyarlı alt dize/önek
  yardımcılarıdır.
- `TURKISH_MONTHS`, `TURKISH_WEEKDAYS`, `TURKISH_WEEKDAYS_MONDAY_START` ve
  `getMonthNameTR` / `getWeekdayNameTR` yerelleştirilmiş adlar sağlar.
- Tüm tarih biçimlendirme `tr` yerel ayarıyla `date-fns` üzerinden geçer
  (`formatDateTR`, `formatDateShortTR`, `formatMonthYearTR`,
  `formatWeekdayTR`).

### Saat ve süre yardımcıları
- `src/utils/shiftTime.ts` — `getEffectiveShiftTime` (güne özel saat vs.
  vardiya varsayılanı), `parseHM` / `isValidHM` / `formatHM`,
  `normalizeCustomTime`, `isOvernightFromHM`.
- `src/utils/duration.ts` — `minutesToHM` / `hmToMinutes`,
  `formatDurationTR` ("2 saat 30 dakika") ve bir ayın fazla mesaisi ile
  eksik saatini ayrı ayrı toplayan `sumMonthDurations`.
- `src/components/ui/TimeInput.tsx` — ortak `HH:mm` giriş bileşeni ve
  yapıştırma normalizasyonu yapan `normalizeTimeString`; gün düzenleyici
  ile vardiya saatleri ekranı tarafından yeniden kullanılır.

### Tatiller (`src/constants/holidays.ts`)
Türkiye resmi tatillerinin (2026) statik bir listesi; `getHolidayName` /
`isHoliday` yardımcıları ile. Bu yalnızca takvim ve gün detayı için
gösterim amaçlı meta veridir; planlamayı etkilemez. İslami bayram
tarihleri her yıl değişir ve dosyada yayından önce doğrulanması gerektiği
belirtilmiştir.

### Dışa aktarma formatı
UTF-8 BOM'lu ve Türkçe yerelleştirilmiş sütun başlıklarına sahip CSV;
notlara, gömülü virgül/tırnaklar ayrıştırmayı bozmasın diye tırnaklama
uygulanır. Dosya adı yerel tarihi kullanır (UTC değil), böylece "bugün"
kullanıcının saat dilimiyle eşleşir.

### Testler
Dört Vitest paketi (`environment: 'node'`), toplam **99 test**:
- `src/services/schedulingEngine.test.ts`
- `src/repositories/fileRepository.test.ts` — `FileRepository`, bellek içi
  yol üzerinden ortak arayüzle test edilir.
- `src/utils/turkish.test.ts`
- `src/utils/duration.test.ts`

---

## Proje Yapısı

```
vp/
├─ README.md                        # İngilizce versiyon
├─ README.tr.md                     # bu dosya
├─ android-sdk-setup-note.md        # Android SDK kurulumu (Türkçe not)
├─ icon.png                         # uygulama ikonu kaynağı
├─ app/                             # expo-router rotaları
│  ├─ _layout.tsx                   # kök Stack + tema + splash bağlantısı
│  ├─ (tabs)/                       # alt-sekme grubu
│  │  ├─ _layout.tsx                # Ana Sayfa / Takvim / Ayarlar sekmeleri
│  │  ├─ index.tsx                  # ana sayfa
│  │  ├─ calendar.tsx               # aylık takvim
│  │  └─ settings.tsx               # ayarlar + CSV dışa aktarma + silme
│  ├─ day/[date].tsx                # tek gün düzenleme (modal)
│  ├─ generate.tsx                  # şablondan bir ay oluştur
│  ├─ revise.tsx                    # bir tarih aralığını revize et
│  ├─ shift-times.tsx               # varsayılan vardiya saatlerini özelleştir
│  └─ templates/
│     ├─ index.tsx                  # şablon listesi
│     └─ [id].tsx                   # şablon detayı / düzenleme
├─ src/
│  ├─ components/
│  │  ├─ calendar/                  # CalendarHeader, Grid, DayCell, Actions
│  │  ├─ home/                      # TodayShiftCard, UpcomingDays,
│  │  │                             #   QuickActions, SmartInsight,
│  │  │                             #   HomeBottomActions, SummarySheet,
│  │  │                             #   NotesSheet, MonthPicker
│  │  └─ ui/                        # PressableScale, TimeInput
│  ├─ constants/
│  │  ├─ shifts.ts                  # varsayılan vardiya tipleri + şablonlar
│  │  └─ holidays.ts                # Türkiye resmi tatilleri (gösterim)
│  ├─ context/ThemeContext.tsx      # açık/koyu tema
│  ├─ repositories/                 # IScheduleRepository, File + Memory
│  ├─ services/schedulingEngine.ts
│  ├─ stores/scheduleStore.ts       # Zustand store (modül-yükleme hidrasyonu)
│  ├─ types/index.ts                # alan tipleri
│  └─ utils/                        # date, turkish, duration, shiftTime,
│                                   #   splashController, startupTimer
├─ assets/                          # ikonlar, splash, mağaza grafikleri
├─ android/                         # önceden üretilmiş native Android projesi
├─ app.json                         # Expo yapılandırması (ad, ikonlar, eklentiler)
├─ eas.json                         # EAS build profilleri
├─ babel.config.js
├─ tsconfig.json                    # strict TS, @/* → src/*
├─ vitest.config.ts                 # node env, @ alias
└─ package.json
```

---

## Kullanılan Teknolojiler

[package.json](package.json) içinde tanımlı:

- **Çalışma zamanı / UI** — React 19.1.0, React Native 0.81.5, Expo SDK 54
  (`expo`, `expo-router`, `expo-splash-screen`, `expo-status-bar`,
  `expo-linear-gradient`, `expo-linking`, `expo-localization`,
  `expo-constants`, `expo-dev-client`).
- **Gezinme** — `expo-router` (dosya tabanlı, `experiments.typedRoutes`
  ile tipli rotalar etkin) ve `@react-navigation/native`.
- **Durum** — `zustand` ^5 (tek store, `scheduleStore`).
- **Kalıcılık** — yeni `File` / `Paths` API'sini kullanan
  `expo-file-system` (`textSync` / `write`), tek JSON dosyası.
- **Tarihler** — Türkçe (`tr`) yerel ayarıyla `date-fns`.
- **Güvenli alan / ekranlar** — `react-native-safe-area-context`,
  `react-native-screens`.
- **Dışa aktarma / paylaşım** — CSV paylaşım sayfası için `expo-sharing`.
- **Mimari** — `app.json` içinde `newArchEnabled: false` (uygulama klasik
  React Native mimarisinde çalışır).
- **Dil / build** — TypeScript ~5.9 (strict, `noUncheckedIndexedAccess`,
  `baseUrl: "."`, `@/*` → `src/*`), `babel-preset-expo`.
- **Test** — Node ortamıyla Vitest ^4.
- **Dağıtım** — `development`, `preview`, `production` (app bundle) ve
  `production-apk` için EAS Build profilleri (bkz. `eas.json`).

Android paketi / iOS bundle kimliği: `com.demrivo.vardiyaplani`.
Expo proje kimliği: `9db300d9-669f-474f-98cf-4d9184605880`.

---

## Kurulum

Tüm komutlar depo kök dizininden çalıştırılır.

```bash
npm install
```

Gereksinimler:
- EAS bulut build'leri için Node 22.14.0 zorunludur (`eas.json`).
  `package.json` yerelde bir Node sürümü sabitlemez, ancak Expo SDK 54
  güncel bir LTS bekler.
- Expo CLI, `npx expo` / `npx eas` üzerinden çağrılır.
- Native Android build'leri için: Android SDK kurulu olmalıdır;
  `local.properties` ve `ANDROID_HOME` kurulumu için
  [android-sdk-setup-note.md](android-sdk-setup-note.md) (Türkçe)
  dosyasına bakın. Önceden üretilmiş bir `android/` projesi zaten depoda
  bulunur.

---

## Kullanım

[package.json](package.json) içinde tanımlı betikler:

```bash
# Geliştirme
npm run start                 # expo start (Metro geliştirme sunucusu)
npm run android               # expo run:android (yerel native build)
npm run ios                   # expo run:ios
npm run web                   # expo start --web

# Testler
npm run test                  # vitest (izleme)
npm run test:run              # vitest run (tek geçiş)

# EAS bulut build'leri
npm run build:android:preview     # dahili APK
npm run build:android:prod        # Play Store app bundle
npm run build:android:prod-apk    # üretim APK'sı
npm run build:ios:preview         # dahili iOS
npm run build:ios:prod            # App Store iOS
npm run build:all:preview         # her iki platform, preview profili
```

Açılıştan sonra temel uygulama akışı:

1. İlk açılışta aktif şablon `BYG-A1`'dir ve hiç planlı gün yoktur; ana
   sayfa "plan oluştur" çağrısını gösterir.
2. **Plan Oluştur**'a dokunup Oluştur ekranını açın, bir aralık ön ayarı
   ve bir başlangıç noktası seçip onaylayın — ay doldurulur.
3. Takvim sekmesi ayı bir ızgarada gösterir; herhangi bir güne dokunmak
   gün düzenleme modalını açar (vardiya, güne özel saat, fazla mesai/eksik
   saat, not, kilit).
4. Aralık değişiklikleri için Revize ekranını, şablon yönetimi için
   Şablonlar ekranını, varsayılan vardiya saatlerini değiştirmek için
   Vardiya Saatleri ekranını ve CSV dışa aktarmak / tema değiştirmek /
   her şeyi silmek için Ayarlar'ı kullanın.
5. Ana sayfada **Mesai Özeti** ve **Aylık Notlar**, seçilen bir ayı
   özetleyen bottom sheet'ler açar.

---

## Yapılandırma

- **Expo uygulama yapılandırması** — [app.json](app.json): uygulama adı
  `Vardiya Planı`, slug `vardiya-plani`, scheme `vardiyaplani`, yalnızca
  dikey, klasik mimari (`newArchEnabled: false`), adaptif ikon arka planı
  `#0B1026`, `assets/icon2.png` ile yapılandırılmış splash-screen
  eklentisi, `expo-router` ve `expo-localization` eklentileri, Expo proje
  kimliği `extra.eas.projectId` içine gömülü.
- **EAS build profilleri** — [eas.json](eas.json) — `development`
  (geliştirici istemci, dahili APK / iOS simülatörü), `preview` (dahili
  APK / dahili iOS), `production` (app bundle / mağaza), `production-apk`
  (üretimin APK varyantı). Build zamanında Node 22.14.0 zorunludur ve
  `base` env içinde `NPM_CONFIG_LEGACY_PEER_DEPS=true` ayarlıdır;
  `appVersionSource` değeri `local`.
- **TypeScript** — strict mod, `noUncheckedIndexedAccess`, yol takma adı
  `@/*` → `src/*` ([tsconfig.json](tsconfig.json)).
- **Vitest** — `environment: 'node'`, `src/`'ye `@` takma adı
  ([vitest.config.ts](vitest.config.ts)).
- **Uygulama ayarları** (çalışma zamanı, yerel olarak saklanır; bkz.
  [src/types/index.ts](src/types/index.ts)):
  - `activeTemplateId`
  - `weekStartsOnMonday` (varsayılan `true`)
  - `theme` (`light` | `dark`)
  - `showOffVariants` (`OFF1`/`OFF2` ayrı gösterilsin mi; varsayılan
    kapalı — arayüz bunları tek "Off"ta toplar)
  - `onboardingDone`

Çalışma zamanında herhangi bir ortam değişkeni, `.env` dosyası veya uzak
uç nokta yer almaz.

---

## Mimari / Çekirdek Bileşenler

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
  Planlama motoru       Depo (senkron)       Alan tipleri
  (saf fonksiyonlar)    IScheduleRepository  (src/types)
  src/services/…        src/repositories/…
                              │
                              ▼
                    FileRepository (JSON)
                    expo-file-system
                    Paths.document/vardiya-plani-data.json
```

- **Ekranlar**, veriyi Zustand seçicileriyle store'dan okur ve aksiyonlar
  gönderir; depoyla asla doğrudan konuşmazlar.
- **Store**, bellekteki tek doğruluk kaynağıdır. Mutasyon yapan her aksiyon
  aynı zamanda depoyu çağırır, böylece değişiklik anında kalıcı olur.
- **Planlama motoru** bir saf fonksiyon kümesidir; hem store tarafından
  (üretim/revize sırasında) hem de doğrudan testler tarafından çağrılır.
- **Depo**, iki implementasyonu olan bir arayüzdür. Üretim bağlantısı
  `FileRepository` kullanır; `MemoryRepository`, testler ve dosya sistemi
  olmayan ortamlarda çalışmak için vardır.
- **Tema**, store içindeki `settings.theme`'e abone olan küçük bir React
  context tarafından sürülür, böylece tema değişiklikleri anında ve
  kalıcıdır.

### Alan modeli (`src/types/index.ts`)

- `ShiftType` — `id, code, name, shortName, color, startTime, endTime,
  isWorking, isOvernight, isEditable`.
- `ProgramTemplate` — `id, name, cycleLength, steps[], isActive,
  isDefault`.
- `PlannedDay` — `date (ISO), shiftCode, isLocked, source
  ('generated' | 'manual' | 'revised'), templateId, note, cycleIndex?,
  customStartTime?, customEndTime?, overtimeMinutes?, shortageMinutes?`.
- `AppSettings` — `activeTemplateId, weekStartsOnMonday, theme,
  showOffVariants, onboardingDone`.
- `GenerateOptions` / `GenerateResult` / `RevisionOptions` motoru sürer.
- `MonthlySummary` / `ShiftCount` aylık toplama için tanımlıdır.

---

## Veri Akışı / İşleme Akışı / Çalışma Zamanı Akışı

### Soğuk başlangıç

1. `scheduleStore.ts` import edilir — modül değerlendirmesinde
   `getRepository()` çağrılır ve `FileRepository` singleton'ı döner.
2. `FileRepository.load()`, `file.textSync()` ile **senkron** çalışır ve
   bellek içi dizileri/kayıtları doldurur; dosya boşsa
   `initializeDefaults()` varsayılan vardiya tiplerini/şablonları ekler ve
   `migrateShiftColors()` dokunulmamış eski renkleri yamalar.
3. Başlangıç değerleri `useScheduleStore`'a akar, böylece ilk render'da
   her seçicide gerçek veri bulunur.
4. `app/_layout.tsx`, modül yüklemesinde `preventAutoHide()` çağırır; kök
   yerleşim 4 saniyelik bir splash gözcüsü başlatır.
5. İlk ekran (`app/(tabs)/index.tsx`) `onLayout` bildirir; bu
   `notifyFirstScreenReady()`'yi çağırır ve bir animasyon karesi sonra
   native splash kapatılır.

### Bir ay oluşturma

1. Kullanıcı Oluştur'u açar, bir başlangıç noktası (`month_start` veya
   `today`) ve bir aralık ön ayarı seçer.
2. Store'un `generateMonth`'u aktif şablonu çözer ve önceki günün saklı
   `cycleIndex` değerini kullanarak `calculatePhaseForNewMonth` ile bir
   `phaseOffset` türetir (yalnızca döngü indeksi bilinmiyorsa vardiya kodu
   aramasına düşer). Başlangıç noktası "bugün" olduğunda yeni şablon her
   zaman index 0'dan başlar.
3. `generateDays` tarih aralığını gezer; `preserveLocked && isLocked` veya
   `preserveManual && source='manual'` olan günleri atlar; kalan her tarih
   için `source: 'generated'` ve `cycleIndex` içeren bir `PlannedDay`
   yazar.
4. `FileRepository.setPlannedDays` önbelleği günceller ve tüm JSON
   dosyasını yazar; store kendi `plannedDays` haritasını günceller.

### Bir aralığı revize etme

1. Kullanıcı bir aralık ve bir mod seçer (`single_shift` veya
   `from_template`), kilitli/elle günleri override etme anahtarlarıyla.
2. `reviseRange`, `source: 'revised'` içeren yeni `PlannedDay` nesneleri
   üretir; uygun olduğunda mevcut `note`, `cycleIndex`, `overtimeMinutes`
   ve `shortageMinutes`'ı korur.
3. Sonuçlar kalıcılaştırılır ve store'a yansıtılır.

### Tek bir günü düzenleme

1. Gün düzenleme ekranı `:date` rota parametresini doğrular.
2. Değişiklikler `setPlannedDay(day)` üzerinden kaydedilir; bu, günü
   `source: 'manual'` olarak işaretler (bu ekrandan oluşturulduğunda) ve
   isteğe bağlı olarak `isLocked: true` yapar; `deleteDay` günü kaldırır.
3. Güne özel başlangıç/bitiş saatleri (`customStartTime`, `customEndTime`)
   ve güne özel fazla mesai/eksik saat dakikaları, vardiya tipinde değil,
   `PlannedDay`'in kendisinde tutulur.

### CSV dışa aktarma

1. Ayarlar → Verileri Dışa Aktar.
2. `generateExcelContent()`, Türkçe başlıklı, yerelleştirilmiş haftanın
   günü adlı ve tırnaklanmış notlu, BOM önekli bir CSV oluşturur.
3. Dosya `Paths.cache/vardiya-plani-<yerel-tarih>.csv` konumuna yazılır ve
   `Sharing.shareAsync` ile gösterilir.

### Gece geçen vardiya kuralı

Bir vardiya, ancak ve ancak `startHour > endHour` ise gece geçer
(`isOvernightShiftByTime` ile kontrol edilir). Gece geçen vardiyalar
depolamada daima **başlangıç** tarihine sabitlenir; arayüz,
`formatOvernightShiftDisplay` üzerinden bir bitiş saati notu render eder
("<ad> (<bitiş>'e kadar)").

---

## Sınırlamalar / Mevcut Durum

- **Yalnızca yerel.** Tüm veriler `Paths.document/vardiya-plani-data.json`
  konumundaki tek bir JSON dosyasında bulunur. Bulut senkronizasyonu, içe
  aktarma veya çoklu cihaz desteği yoktur. "Dışa Aktar" bir CSV üretir;
  "Tüm Verileri Sil" siler ve varsayılanları yeniden ekler.
- **Türkçe arayüz.** Etiketler, CSV başlıkları, ay/gün adları ve "Bugün",
  "Yarın", "Sonraki mesai" gibi metinler Türkçedir. Intl'in kullandığı
  sistem yerel ayarı dışında çalışma zamanı dil değişimi yoktur.
- **Dahili olarak OFF1 / OFF2.** Bunlar rotasyon döngüsünü ayırt
  edilebilir tutmak için vardır ama gün düzenleme seçicisinden gizlidir;
  aktif arayüz tek bir "Off" girişi gösterir. `showOffVariants` ayarlarda
  tanımlıdır ancak mevcut ekranlarda bunu değiştiren bir arayüz yoktur.
- **Fazla mesai / eksik saat mahsup edilmez.** Güne özel `overtimeMinutes`
  ve `shortageMinutes` ayrı izlenir ve ayrı toplanır; uygulama bilinçli
  olarak hiçbir ücret veya net saat hesabı yapmaz.
- **Tatiller yalnızca gösterim ve 2026 kapsamlı.** `holidays.ts` yalnızca
  2026 tarihlerini içerir; İslami bayram tarihleri resmi doğrulama
  gerektirir olarak işaretlidir. Tatiller planlamayı asla etkilemez.
- **Varsayılanlar her zaman kaldırılamaz.** `DEFAULT_SHIFT_TYPES` ve
  `DEFAULT_TEMPLATES`, ilgili liste boş olduğunda `initializeDefaults()`
  tarafından yeniden eklenir. Kullanıcının oluşturduğu bir şablonu silmek
  çalışır; varsayılanları silmek "Tüm Verileri Sil" ile yapılır (bu da
  onları geri yükler).
- **Onboarding akışı yok.** `settings.onboardingDone` tipte ve varsayılan
  ayarlarda mevcuttur ancak mevcut rotalarda bir onboarding ekranı bağlı
  değildir.
- **Hafta başlangıcı.** `settings.weekStartsOnMonday` varsayılan olarak
  `true`'dur ve takvim, ay-ızgarası üreticisi tarafından
  Pazartesi-başlangıçlı render edilir; bunu çalışma zamanında değiştiren
  bir arayüz yoktur.
- **Hakkında'daki sürüm metni elle yazılı.** Ayarlar → Hakkında kartı,
  `app.json`'dan okunmayan sabit bir sürüm metni gösterir; bu yüzden
  uygulama sürümü değiştiğinde elle güncellenmesi gerekir.
- **Native build ön koşulları.** `expo run:android` için Android SDK
  yapılandırılmış olmalıdır (bkz.
  [android-sdk-setup-note.md](android-sdk-setup-note.md)).

---

## Notlar

- "Vardiya Planı", uygulama başlığında ve Ayarlar → Hakkında kartında
  görünen ürün adıdır; "Demrivo" geliştirici markasıdır. Paket / bundle
  kimliği `com.demrivo.vardiyaplani`'dir.
- Uygulama, Expo SDK 54 üzerinde React 19.1 ve RN 0.81 ile **klasik React
  Native mimarisinde** çalışır (`app.json` içinde `newArchEnabled: false`).
- Store hidrasyonu bilinçli olarak senkrondur: store, dosyayı modül
  yüklemesinde okur, böylece ilk render zaten doludur ve native splash, ilk
  ekran çizilir çizilmez kapatılabilir.
- `android-sdk-setup-note.md` dosyası `react-native-mmkv`'den bahseder;
  uygulama artık MMKV kullanmıyor — kalıcılık, yukarıda anlatılan tek-JSON
  dosyalı `FileRepository`'dir. Notun SDK kurulum adımları yerel native
  build'ler için hâlâ geçerlidir.
