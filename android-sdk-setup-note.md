# Android SDK Kurulum Notu

`expo run:android` komutu çalıştırıldığında "SDK location not found" hatası alıyorsanız, aşağıdaki adımları izleyin:

## Çözüm 1: local.properties dosyası

Proje içinde `android/local.properties` dosyası oluşturun:

```properties
sdk.dir=C:\\Users\\KULLANICI_ADI\\AppData\\Local\\Android\\Sdk
```

> Not: `KULLANICI_ADI` kısmını kendi Windows kullanıcı adınızla değiştirin.

## Çözüm 2: ANDROID_HOME ortam değişkeni

Windows'ta ortam değişkeni ekleyin:

1. **Başlat** > "Ortam değişkenleri" ara > **Sistem ortam değişkenlerini düzenle**
2. **Ortam Değişkenleri** butonuna tıkla
3. **Kullanıcı değişkenleri** bölümünde **Yeni** tıkla:
   - Değişken adı: `ANDROID_HOME`
   - Değişken değeri: `C:\Users\KULLANICI_ADI\AppData\Local\Android\Sdk`
4. **Path** değişkenini düzenle ve şunları ekle:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
5. Terminali kapatıp yeniden aç

## Doğrulama

```bash
echo %ANDROID_HOME%
adb --version
```

## Alternatif: Expo Go

Native build yerine Expo Go kullanmak için:

```bash
npx expo start
```

Ardından Expo Go uygulamasından QR kodu okutun.

> **Not:** Bu projede `react-native-mmkv` native modül kullandığı için tam işlevsellik ancak development build ile çalışır.
