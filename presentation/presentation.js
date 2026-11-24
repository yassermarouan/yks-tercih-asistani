/**
 * Açıklanabilir Yapay Zekâ (XAI) Akademik Sunum Kontrolcüsü
 * Tam Ekran, Klavye Geçişleri, Konuşmacı Notları, İnteraktif Simülatör ve KaTeX Desteği
 */

document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;
  let currentSlideIndex = 0;

  // DOM Elemanları
  const currentSlideNum = document.getElementById("currentSlideNum");
  const totalSlidesNum = document.getElementById("totalSlidesNum");
  const progressBar = document.getElementById("progressBar");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnNotes = document.getElementById("btnNotes");
  const btnOverview = document.getElementById("btnOverview");
  const notesDrawer = document.getElementById("notesDrawer");
  const notesBody = document.getElementById("notesBody");
  const notesSlideNumber = document.getElementById("notesSlideNumber");
  const btnCloseNotes = document.getElementById("btnCloseNotes");
  const overviewOverlay = document.getElementById("overviewOverlay");
  const overviewGrid = document.getElementById("overviewGrid");
  const btnCloseOverview = document.getElementById("btnCloseOverview");
  const timerText = document.getElementById("timerText");

  totalSlidesNum.textContent = String(totalSlides).padStart(2, "0");

  // ==========================================
  // Slayt Değiştirme Fonksiyonu
  // ==========================================
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    slides.forEach((s, idx) => {
      s.classList.remove("active", "prev-slide");
      if (idx < index) {
        s.classList.add("prev-slide");
      }
    });

    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add("active");

    // Göstergeleri ve butonları güncelle
    currentSlideNum.textContent = String(currentSlideIndex + 1).padStart(2, "0");
    const progressPct = ((currentSlideIndex + 1) / totalSlides) * 100;
    progressBar.style.width = `${progressPct}%`;

    btnPrev.disabled = currentSlideIndex === 0;
    btnNext.disabled = currentSlideIndex === totalSlides - 1;

    updateSpeakerNotes();
    updateOverviewActiveState();
    triggerSlideSpecificWidgets();
  }

  function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  // ==========================================
  // Konuşmacı Notları (Speaker Notes)
  // ==========================================
  function updateSpeakerNotes() {
    const activeSlide = slides[currentSlideIndex];
    const notesElem = activeSlide.querySelector(".speaker-notes");
    notesSlideNumber.textContent = currentSlideIndex + 1;

    if (notesElem) {
      notesBody.innerHTML = notesElem.innerHTML;
    } else {
      notesBody.innerHTML = "<p><em>Bu slayt için özel konuşmacı notu tanımlanmamıştır.</em></p>";
    }
  }

  function toggleNotes() {
    notesDrawer.classList.toggle("open");
    btnNotes.classList.toggle("active", notesDrawer.classList.contains("open"));
  }

  function closeNotes() {
    notesDrawer.classList.remove("open");
    btnNotes.classList.remove("active");
  }

  // ==========================================
  // Slayt Genel Bakış (Overview Grid)
  // ==========================================
  function buildOverviewGrid() {
    overviewGrid.innerHTML = "";
    slides.forEach((s, idx) => {
      const headerTitle = s.querySelector(".slide-header h2")?.textContent || 
                          s.querySelector(".main-title")?.textContent.replace(/\s+/g, ' ').trim() || 
                          `Slayt ${idx + 1}`;

      const thumb = document.createElement("div");
      thumb.className = `overview-thumb ${idx === currentSlideIndex ? 'active' : ''}`;
      thumb.innerHTML = `
        <div class="thumb-num">SLAYT ${String(idx + 1).padStart(2, '0')}</div>
        <div class="thumb-title">${headerTitle}</div>
      `;
      thumb.addEventListener("click", () => {
        goToSlide(idx);
        closeOverview();
      });
      overviewGrid.appendChild(thumb);
    });
  }

  function updateOverviewActiveState() {
    const thumbs = overviewGrid.querySelectorAll(".overview-thumb");
    thumbs.forEach((th, idx) => {
      th.classList.toggle("active", idx === currentSlideIndex);
    });
  }

  function toggleOverview() {
    overviewOverlay.classList.toggle("open");
    btnOverview.classList.toggle("active", overviewOverlay.classList.contains("open"));
  }

  function closeOverview() {
    overviewOverlay.classList.remove("open");
    btnOverview.classList.remove("active");
  }

  // ==========================================
  // Tam Ekran (Fullscreen)
  // ==========================================
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
      btnFullscreen.classList.add("active");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      btnFullscreen.classList.remove("active");
    }
  }

  document.addEventListener("fullscreenchange", () => {
    btnFullscreen.classList.toggle("active", !!document.fullscreenElement);
  });

  // ==========================================
  // Sunum Zamanlayıcısı (Presentation Timer)
  // ==========================================
  let secondsElapsed = 0;
  setInterval(() => {
    secondsElapsed++;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, "0");
    const secs = String(secondsElapsed % 60).padStart(2, "0");
    timerText.textContent = `${mins}:${secs}`;
  }, 1000);

  // ==========================================
  // Klavye Kontrolleri
  // ==========================================
  document.addEventListener("keydown", (e) => {
    // Eğer metin alanında değilse
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ": // Space
        e.preventDefault();
        nextSlide();
        break;

      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        prevSlide();
        break;

      case "Home":
        e.preventDefault();
        goToSlide(0);
        break;

      case "End":
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;

      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;

      case "s":
      case "S":
        e.preventDefault();
        toggleNotes();
        break;

      case "o":
      case "O":
        e.preventDefault();
        toggleOverview();
        break;

      case "Escape":
        closeNotes();
        closeOverview();
        break;
    }
  });

  // Buton Dinleyicileri
  btnNext.addEventListener("click", nextSlide);
  btnPrev.addEventListener("click", prevSlide);
  btnFullscreen.addEventListener("click", toggleFullscreen);
  btnNotes.addEventListener("click", toggleNotes);
  btnCloseNotes.addEventListener("click", closeNotes);
  btnOverview.addEventListener("click", toggleOverview);
  btnCloseOverview.addEventListener("click", closeOverview);

  // ==========================================
  // İnteraktif Slayt 8 Simülatör Mantığı
  // ==========================================
  const slideQuotaRange = document.getElementById("slideQuotaRange");
  const slideQuotaVal = document.getElementById("slideQuotaVal");
  const slideSimRank = document.getElementById("slideSimRank");
  const slideRankDelta = document.getElementById("slideRankDelta");
  const slideCategoryLabel = document.getElementById("slideCategoryLabel");
  const slideSimExplanation = document.getElementById("slideSimExplanation");

  const BASE_RANK = 38951;
  const BASE_QUOTA = 60;
  const STUDENT_TARGET_RANK = 42000;

  function updateSimulator(simQuota) {
    if (!slideQuotaRange) return;
    slideQuotaVal.textContent = `${simQuota} Kişi`;

    const deltaQuota = simQuota - BASE_QUOTA;
    // Kontenjan 1 kişi arttığında taban sıralama ortalama ~275 sıra geriye gevşer
    const deltaRank = Math.round(deltaQuota * 275);
    const simulatedRank = BASE_RANK + deltaRank;

    slideSimRank.textContent = simulatedRank.toLocaleString("tr-TR");
    
    if (deltaRank > 0) {
      slideRankDelta.textContent = `+${deltaRank.toLocaleString("tr-TR")} (Esnetici / Rahatlama)`;
      slideRankDelta.style.color = "var(--accent-emerald)";
    } else if (deltaRank < 0) {
      slideRankDelta.textContent = `${deltaRank.toLocaleString("tr-TR")} (Rekabeti Artırıcı)`;
      slideRankDelta.style.color = "var(--accent-rose)";
    } else {
      slideRankDelta.textContent = "0 sıra (Sabit)";
      slideRankDelta.style.color = "var(--text-dim)";
    }

    // Aday kategorizasyonu (Öğrenci Sırası: 42.000)
    let category = "İdeal Hedef (Sıralamana Yakın)";
    let catClass = "var(--accent-cyan)";
    let explanationText = "";

    if (simulatedRank > STUDENT_TARGET_RANK * 1.15) {
      category = "Güvenli Liman (Daha Ulaşılabilir)";
      catClass = "var(--accent-emerald)";
      explanationText = `Kontenjandaki ${deltaQuota} kişilik artış sıralamayı ${simulatedRank.toLocaleString("tr-TR")} seviyesine gevşeterek bu programı 42.000 sıralamalı aday için kesin kazanılabilir 'Güvenli Liman' dilimine taşımaktadır.`;
    } else if (simulatedRank < STUDENT_TARGET_RANK * 0.90) {
      category = "Daha Rekabetçi (Üst Hedef / Riskli)";
      catClass = "var(--accent-rose)";
      explanationText = `Kontenjandaki ${Math.abs(deltaQuota)} kişilik daralma taban sırasını ${simulatedRank.toLocaleString("tr-TR")} seviyesine çekerek rekabeti keskinleştirmiştir; adayın risk koridorunu zorlaştırmaktadır.`;
    } else {
      category = "İdeal Hedef (Sıralamana Çok Yakın)";
      catClass = "var(--accent-cyan)";
      explanationText = `Programın öngörülen sıralaması adayın 42.000 başarı sırası ile dengeli bir koridorda buluşmaktadır. Tercih listesinin merkezinde konumlandırılmalıdır.`;
    }

    slideCategoryLabel.textContent = category;
    slideCategoryLabel.style.color = catClass;
    slideSimExplanation.textContent = explanationText;
  }

  if (slideQuotaRange) {
    slideQuotaRange.addEventListener("input", (e) => {
      updateSimulator(parseInt(e.target.value, 10));
    });
  }

  function triggerSlideSpecificWidgets() {
    // KaTeX formül render
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }
  }

  // İlk Kurulum
  buildOverviewGrid();
  goToSlide(0);
});
