# YKS Tercih Asistanı (Akıllı Tercih ve Karar Destek Sistemi)

**YKS Tercih Asistanı**, merkezi YKS lisans (Lisans) yerleştirmelerine hazırlanan öğrenciler ve tercih danışmanları için geliştirilmiş modern, veriye dayalı ve kişiselleştirilmiş bir karar destek asistanıdır.

Kullanıcılar başarı sıralamalarını, puan türlerini ve ilgilendikleri bölümleri girerek; şehir, öğretim dili, üniversite türü ve burs kriterlerini **Şart** veya **Tercih** olarak belirleyebilir. Sistem, geçmiş resmi taban sıralamaları üzerinden öğrencinin hedeflerini kategorize eder, doğal Türkçe açıklamalarla neden önerildiğini ve varsa ödünleşimleri (trade-offs) sunar.

Ayrıca geliştiriciler ve araştırmacılar için **Program Rehberi**, **2025 Random Forest Tahmin Modeli** ve **SHAP Waterfall Analizi** ayrı sekmeler altında aktif olarak korunmaktadır.

---

## 🚀 Hızlı Başlangıç (Quickstart)

Tüm komutlar **Windows PowerShell** ortamına uygun olarak hazırlanmıştır.

### 1. Bağımlılıkların Yüklenmesi (Tek Seferlik)

#### Backend Bağımlılıkları (Python):
```powershell
pip install -r requirements.txt
```

#### Frontend Bağımlılıkları (Node.js):
```powershell
cd frontend
npm.cmd install
cd ..
```

### 2. Modelleri Eğitme (LightGBM & XGBoost)
Depo klonlandığında model dosyasını (`models/yks_lgbm_models.joblib`) üretmek için kök dizinde eğitim betiğini bir kez çalıştırın (~10 saniye sürer):
```powershell
python train_model.py
```

### 3. Ortam Değişkenleri (.env)

Kök dizinde `.env` dosyasını oluşturun veya mevcut şablonu kullanın:
```powershell
Copy-Item .env.example .env
```

İsteğe bağlı olarak OpenAI API anahtarınızı tanımlayın (Anahtar tanımlanmasa dahi sistem SHAP ve kabul verilerine dayalı doğal Türkçe yedek motorunu çalıştırır):
```env
OPENAI_API_KEY=sk-proj-your-actual-api-key
OPENAI_MODEL=gpt-4o-mini
```

---

## 🖥️ Uygulamayı Çalıştırma (Running the App)

Uygulamanın çalışması için backend ve frontend sunucularını iki ayrı PowerShell veya terminal penceresinde başlatın:

### Terminal 1: Backend Sunucusu (FastAPI)
```powershell
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```
* **API Sağlık Kontrolü**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
* **İnteraktif API Belgeleri (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Terminal 2: Frontend Sunucusu (Vite)
```powershell
cd frontend
npm.cmd run dev
```
* **Web Uygulaması (Arayüz)**: [http://localhost:5173](http://localhost:5173)

---

## 💡 Yeni Öğrenci Tercih Akışı Özellikleri

### 1. Sade ve Güvenli Tercih Formu
- İsim, telefon numarası veya üyelik gerektirmez.
- **Puan Türü** (`SAY`, `EA`, `SÖZ`, `DİL`).
- **Başarı Sırası**: `120.000` gibi Türkçe noktalı formatları ve tamsayıları destekler.
- **Bölüm Tercihleri**: Veri setindeki 2.000+ gerçek program adına dayalı anlık otomatik tamamlama (autocomplete).
- **Şart vs. Tercih Ayrımı**: Şehir, dil, üniversite türü ve burs kriterlerini kesin filtre ("Şart") veya puan artırıcı ("Tercih") olarak işaretleme.
- **Benim İçin En Önemli Kriter**: Sıralama Uyumu, Şehir, Dil veya Maliyet odaklı sıralama ağırlıklandırması.
- **Form Belleği**: Sonuçlardan geri dönüldüğünde girilen tüm form değerleri korunur.

### 2. Şeffaf ve Deterministik Öneri Motoru
- **Filtre Gevşetme (Filter Relaxation)**: Tüm "Şart" kriterleri aynı anda sağlandığında 0 sonuç kalırsa, hangi kriterin kaç programı elediği gösterilir ve tek tıkla esnetme imkanı sunulur.
- **Kategorizasyon Sınırları**:
  - **Daha Rekabetçi (Reach)**: Taban sırası öğrenci sırasından %15'ten daha önde olan programlar.
  - **Sıralamana Yakın (Target)**: Taban sırası öğrenci sırasının %15 öncesi ile %25 sonrası arasındaki dengeli programlar.
  - **Geçmiş Verilere Göre Daha Ulaşılabilir (Safe)**: Taban sırası öğrenci sırasının %25'inden daha gerideki güvenli programlar.
  - **Veri Yetersiz**: Taban sırası oluşmamış programlar.
  *(Not: Kesin kabul garantisi veya yerleşme olasılığı iddia edilmez).*
- **Doğal Türkçe Açıklama ve Ödünleşimler (Trade-offs)**:
  Her öneri için dil ve şehir uyumu, geçmiş yıl taban sırası ile fark ve varsa ödünleşimler (örn. *"Bölüm tercihlerine uygun ancak tercih ettiğin şehir listesinin dışında yer alıyor"*) açıklanır.
- **Kişisel Liste ve 3 Program Karşılaştırma**:
  Beğenilen programlar yerel listeye eklenir; 3 programa kadar yan yana kontenjan, taban sıra ve özellik karşılaştırması yapılır.

---

## 🔄 Gelecek Yıl Veri Setini Güncelleme Rehberi (Dataset Replacement Guide)

Bir sonraki tercih döneminde (örneğin 2026/2027 YKS) yeni kılavuz ve yerleştirme sonuçları açıklandığında:

1. **Admissions CSV Güncellemesi**:
   - `admissions_history_readable.csv` dosyasını yeni yılın verileriyle güncelleyin veya satırları ekleyin.
   - Sütun yapısının korunduğundan emin olun:
     `program_code, year, university_name, program_name, score_type, published_quota, closing_rank, quota_source, rank_source_url`
   - Dosyayı **UTF-8 with BOM (`utf-8-sig`)** olarak kaydedin.
2. **Katalog CSV Güncellemesi**:
   - Yeni açılan bölümler veya değişen burs/dil bilgileri için `universities.csv` dosyasını `programme_code` bazında güncelleyin.
3. **Modelin Yeniden Eğitilmesi (Opsiyonel)**:
   ```powershell
   python train_model.py
   ```
   *(Eğitilen model `models/random_forest_yks.joblib`, test sonuçları `results/test_predictions_2025.csv` konumuna kaydedilir).*
4. **Sunucuyu Yeniden Başlatma**:
   FastAPI veri yükleyicisi başlangıçta yeni yılın verilerini ve yeni program adlarını otomatik olarak indeksler.

---

## 📁 Proje Dizin Yapısı

```
random forest/
├── backend/
│   ├── app.py                 # FastAPI ana uygulaması ve API uç noktaları
│   ├── advisor_service.py     # Tercih danışmanı, filtreleme, puanlama ve esnetme motoru
│   ├── data_loader.py         # CSV veri yükleyici, Türkçe arama indeksi ve katalog birleştirme
│   ├── model_service.py       # Random Forest tahmini, SHAP hesaplama ve değerlendirme
│   └── explanation_service.py # OpenAI Türkçe açıklaması ve yerel yedek motoru
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudentPreferenceForm.tsx # Öğrenci tercih formu (autocomplete & şart/tercih)
│   │   │   ├── AdvisorResults.tsx        # Öneri sonuçları, kategoriler ve açıklamalar
│   │   │   ├── FilterRelaxationModal.tsx # 0 eşleşmede kriter esnetme modalı
│   │   │   ├── ComparisonDrawer.tsx      # Kısa liste ve 3 program yan yana karşılaştırma
│   │   │   ├── ProgramExplorer.tsx       # Geliştirici program arama ekranı
│   │   │   ├── ProgramDetailModal.tsx    # Program detay ve SHAP waterfall modalı
│   │   │   ├── ShapWaterfallChart.tsx    # Görsel SHAP Waterfall grafiği
│   │   │   └── EvaluationPage.tsx        # 2025 model testi ve MAE karşılaştırma sayfası
│   │   ├── types/index.ts                # TypeScript tipleri
│   │   ├── api.ts                        # API istemci fonksiyonları ve sayı biçimlendirici
│   │   ├── App.tsx                       # Ana sayfa ve sekme navigasyonu
│   │   └── index.css                     # Tailwind CSS stilleri
│   ├── vite.config.ts                    # Vite sunucu ve proxy ayarları
│   └── package.json
├── models/
│   └── random_forest_yks.joblib          # Eğitilmiş Random Forest modeli
├── results/
│   ├── test_predictions_2025.csv         # 3.205 test programı tahmin sonuçları
│   ├── shap_explanation_2025.json        # Örnek SHAP çıktı dosyası
│   └── openai_explanation_2025.txt       # Üretilen Türkçe açıklama metni
├── admissions_history_readable.csv        # 2023-2025 YKS kabul geçmişi (34.197 kayıt)
├── universities.csv                       # YÖK lisans programları kataloğu (11.863 kayıt)
├── train_model.py                        # Model eğitim ve değerlendirme betiği
├── explain_prediction.py                 # SHAP CLI analiz betiği
├── summarize_explanation.py              # OpenAI Türkçe özet CLI betiği
├── .env / .env.example                    # Ortam değişkenleri
└── README.md
```
