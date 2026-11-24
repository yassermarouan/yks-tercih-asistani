# Açıklanabilir Yapay Zekâ (Explainable AI – XAI) Akademik Sunumu

Bu dizin, **Açıklanabilir Yapay Zekâ (XAI)** konusunu kuramsal temelleri, metodolojisi ve geliştirilen **YKS Tercih Karar Destek Sistemi** üzerindeki gerçek dünya uygulamasıyla sunan modern, interaktif ve web tabanlı bir sunum uygulamasıdır.

Sunum, proje kodlarını değiştirmeksizin tamamen bağımsız bir modül olarak `presentation/` dizininde geliştirilmiştir.

---

## 🚀 Hızlı Başlangıç (Nasıl Çalıştırılır?)

Sunum tamamen istemci taraflı (HTML5 / CSS3 / ES6 JS) olarak tasarlanmıştır. Herhangi bir derleme işlemine gerek yoktur.

### Yöntem 1: Doğrudan Tarayıcıda Açma (Önerilen)
`presentation/index.html` dosyasına çift tıklayarak veya tarayıcınıza sürükleyerek anında tam özellikleriyle çalıştırabilirsiniz:
```text
file:///c:/Users/hp/Desktop/random forest/presentation/index.html
```

### Yöntem 2: Yerel Python Sunucusu ile Açma
PowerShell terminalinde sunum klasöründen yerel sunucu başlatabilirsiniz:
```powershell
python -m http.server 3000 --directory presentation
```
Tarayıcınızda `http://localhost:3000` adresine gidiniz.

---

## ⌨️ Klavye Kısayolları ve Kontroller

Sunum sırasında sahnede veya jüri karşısında akıcı bir deneyim için gelişmiş klavye kısayolları eklenmiştir:

| Tuş | Eylem |
| :--- | :--- |
| **Sağ Ok ($\rightarrow$) / Boşluk (Space) / PageDown** | Sonraki Slayta Geç |
| **Sol Ok ($\leftarrow$) / PageUp** | Önceki Slayta Geç |
| **S** | **Konuşmacı Notları Çekmecesini Aç / Kapat** (Speaker Notes) |
| **O** | **Slayt Genel Bakış Izgarasını Aç / Kapat** (Overview Grid) |
| **F** | **Tam Ekran Modunu Aç / Kapat** (Fullscreen Mode) |
| **Home** | İlk Slayta Dön (Slayt 1) |
| **End** | Son Slayta Git (Slayt 14) |
| **Escape (ESC)** | Açık olan pencereleri / modalları kapat |

---

## 📑 Sunum Akışı ve Slayt Planı (14 Slayt)

Sunum **%70 Kuramsal & Metodolojik XAI**, **%30 Gerçek Uygulama Örneği** dengesinde hazırlanmıştır:

### BÖLÜM 1: Açıklanabilir Yapay Zekâ Kuramı (~%70)
1. **Slayt 1: Başlık & Giriş:** Açıklanabilir Yapay Zekâ: Kara Kutu Modellerden Şeffaf Karar Destek Sistemlerine.
2. **Slayt 2: Kara Kutu (Black Box) Problemi:** Doğruluk vs. Yorumlanabilirlik ikilemi (*Accuracy vs. Interpretability Trade-off*), gizli yanlılık ve güven kaybı.
3. **Slayt 3: XAI Neden Zorunludur?:** GDPR Madde 22 ("Açıklama Hakkı"), AB Yapay Zekâ Yasası (EU AI Act) ve yüksek riskli kritik karar alanları.
4. **Slayt 4: Geleneksel YZ vs. Açıklanabilir YZ:** Paradigma değişimi, sadece $\hat{y}$ çıktısından $\langle \hat{y}, \Phi \rangle$ gerekçeli karara geçiş.
5. **Slayt 5: XAI Taksonomisi:** Intrinsic vs. Post-hoc, Global vs. Local, Model-Agnostic vs. Model-Specific sınıflandırması.
6. **Slayt 6: Özellik Önemi (Feature Importance):** Hiyerarşik ağırlıklar (Taban sırası %78, kontenjan %12, kontenjan değişimi %6, trend ivmesi %4).
7. **Slayt 7: TreeSHAP & Shapley Değerleri:** Lloyd Shapley (1953) işbirlikçi oyun teorisi, formülasyon, aksiyomlar ve matematiksel kesin toplamsallık (*Local Accuracy / Additivity*).
8. **Slayt 8: Karşı-Olgusal Açıklamalar (Counterfactual Explanations):** *"Girdi ne olsaydı sonuç değişirdi?"* prensibi ve canlı Kontenjan Duyarlılık Simülatörü.
9. **Slayt 9: Karşılaştırmalı Yöntem Analizi:** TreeSHAP vs. LIME vs. PDP vs. Grad-CAM teknik matrisi ve TreeSHAP'ın seçim gerekçesi.

### BÖLÜM 2: Gerçek Uygulama Örneği — YKS Tercih Asistanı (~%30)
10. **Slayt 10: Uygulama Örneği & Problem Tanımı:** 13.581 lisans programı, dinamik kontenjan dalgalanmaları, merkezi tercih hataları ve XAI çözümü.
11. **Slayt 11: Sistem Mimarisi & XAI Hattı:** Veri Katmanı $\rightarrow$ LightGBM Regresyonu $\rightarrow$ TreeSHAP & What-If Motoru $\rightarrow$ React UI & Doğal Dil Danışmanı.
12. **Slayt 12: Arayüz Entegrasyonu & Ekran Çıktıları:** Öğrenci dostu karar kartı, %80 güvenli tercih koridoru, gerekçe analizi çekmecesi ve doğal danışman botu.
13. **Slayt 13: Ampirik Model Doğrulaması:** 7.811 aktif program üzerinde yapılan kör test bulguları (Genel %15,36; EA %21,25; SÖZ %21,82; DİL %13,00 hata azalması).
14. **Slayt 14: Sonuç, Tartışma, Sınırlılıklar & Bilimsel Kaynakça:** Akademik literatür referansları (Lundberg & Lee 2017, Molnar 2022, Wachter et al. 2017, Ke et al. 2017, Ribeiro et al. 2016).

---

## 🔬 Doğrulanmış Akademik Kaynakça

- **Lundberg, S. M., & Lee, S.-I. (2017).** A Unified Approach to Interpreting Model Predictions. *Advances in Neural Information Processing Systems (NeurIPS 30)*.
- **Lundberg, S. M. et al. (2020).** From local explanations to global understanding with explainable AI for trees. *Nature Machine Intelligence, 2(1), 56-67*.
- **Molnar, C. (2022).** Interpretable Machine Learning: A Guide for Making Black Box Models Explainable. *2nd Edition*.
- **Wachter, S., Mittelstadt, B., & Russell, C. (2017).** Counterfactual Explanations Without Opening the Black Box: Automated Decisions and the GDPR. *Harvard Journal of Law & Technology*.
- **Ke, G. et al. (2017).** LightGBM: A Highly Efficient Gradient Boosting Decision Tree. *Advances in Neural Information Processing Systems (NeurIPS 30)*.
- **Ribeiro, M. T., Singh, S., & Guestrin, C. (2016).** "Why Should I Trust You?": Explaining the Predictions of Any Classifier. *ACM SIGKDD*.
