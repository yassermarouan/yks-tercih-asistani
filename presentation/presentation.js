document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;
  let currentIndex = 0;

  const progressFill = document.getElementById("progressFill");
  const currentNum = document.getElementById("currentNum");
  const totalNum = document.getElementById("totalNum");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnOverview = document.getElementById("btnOverview");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnToggleNotes = document.getElementById("btnToggleNotes");
  const overviewOverlay = document.getElementById("overviewOverlay");
  const overviewGrid = document.getElementById("overviewGrid");
  const btnCloseOverview = document.getElementById("btnCloseOverview");

  totalNum.textContent = String(totalSlides).padStart(2, "0");

  function buildOverview() {
    overviewGrid.innerHTML = "";
    slides.forEach((slide, idx) => {
      const titleEl = slide.querySelector("h2, .cover-title");
      const title = titleEl ? titleEl.textContent.trim().replace(/\s+/g, " ") : `Slayt ${idx + 1}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `overview-item ${idx === currentIndex ? "active" : ""}`;
      btn.innerHTML = `<span class="ov-num">${String(idx + 1).padStart(2, "0")}</span><span class="ov-title">${title}</span>`;
      btn.addEventListener("click", () => {
        goToSlide(idx);
        overviewOverlay.classList.remove("open");
      });
      overviewGrid.appendChild(btn);
    });
  }

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    slides[currentIndex].classList.remove("active");
    currentIndex = index;
    slides[currentIndex].classList.add("active");
    slides[currentIndex].scrollTop = 0;

    currentNum.textContent = String(currentIndex + 1).padStart(2, "0");
    progressFill.style.width = `${((currentIndex + 1) / totalSlides) * 100}%`;
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === totalSlides - 1;
    buildOverview();
  }

  btnPrev.addEventListener("click", () => goToSlide(currentIndex - 1));
  btnNext.addEventListener("click", () => goToSlide(currentIndex + 1));

  btnOverview.addEventListener("click", () => {
    buildOverview();
    overviewOverlay.classList.add("open");
  });

  btnCloseOverview.addEventListener("click", () => {
    overviewOverlay.classList.remove("open");
  });

  overviewOverlay.addEventListener("click", (e) => {
    if (e.target === overviewOverlay) {
      overviewOverlay.classList.remove("open");
    }
  });

  btnToggleNotes.addEventListener("click", () => {
    document.body.classList.toggle("hide-notes");
    const hidden = document.body.classList.contains("hide-notes");
    btnToggleNotes.classList.toggle("active", !hidden);
    btnToggleNotes.textContent = hidden ? "Notları Göster (S)" : "Notları Gizle (S)";
  });

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      goToSlide(currentIndex + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goToSlide(currentIndex - 1);
    } else if (e.key.toLowerCase() === "s") {
      btnToggleNotes.click();
    } else if (e.key.toLowerCase() === "o") {
      overviewOverlay.classList.toggle("open");
      if (overviewOverlay.classList.contains("open")) buildOverview();
    } else if (e.key.toLowerCase() === "f") {
      btnFullscreen.click();
    } else if (e.key === "Escape") {
      overviewOverlay.classList.remove("open");
    }
  });

  goToSlide(0);
});
