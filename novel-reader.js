(() => {
  "use strict";

  const novels = () =>
    Array.isArray(window.novelLibrary)
      ? window.novelLibrary
      : [];

  const list = document.getElementById("novelList");
  const search = document.getElementById("searchInput");
  const categories = document.getElementById("categories");

  if (!list) {
    console.error("ไม่พบพื้นที่แสดงนิยาย: #novelList");
    return;
  }
let activeCategory = "all";
let selectedNovel = null;
let showPinyin = true;
let showThai = true;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getTitle(novel) {
    return novel.titleThai || novel.title || "นิยายไม่มีชื่อ";
  }

  function renderNovels() {
    const keyword = (search?.value || "").trim().toLowerCase();

    const filtered = novels().filter(novel => {
      const matchesCategory =
        activeCategory === "all" ||
        novel.category === activeCategory ||
        (activeCategory === "chinese" && novel.sourceLanguage === "zh") ||
        (activeCategory === "thai" && novel.sourceLanguage === "th");

      const searchable = [
        novel.title,
        novel.titleThai,
        novel.titleChinese,
        novel.descriptionThai
      ].join(" ").toLowerCase();

      return matchesCategory && searchable.includes(keyword);
    });

    if (!filtered.length) {
      list.className = "empty";
      list.innerHTML = `
        <h3>ยังไม่พบนิยาย</h3>
        <p>ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่ทั้งหมด</p>
      `;
      return;
    }

    list.className = "novel-grid";
    list.innerHTML = filtered.map((novel, index) => `
      <article class="novel-card">
        <div class="novel-cover">
          <span>${novel.sourceLanguage === "zh" ? "中文 → ไทย" : "ไทย → 中文"}</span>
        </div>
        <div class="novel-card-body">
          <h3>${escapeHTML(getTitle(novel))}</h3>
          <p>${escapeHTML(
            novel.sourceLanguage === "zh"
              ? novel.title
              : novel.titleChinese || ""
          )}</p>
          <p>${escapeHTML(novel.descriptionThai || "")}</p>
          <p>วางแผนไว้ ${Number(novel.totalChapters) || novel.chapters?.length || 0} บท</p>
          <button type="button" data-open-novel="${index}">
            ดูสารบัญ
          </button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-open-novel]").forEach(button => {
      button.addEventListener("click", () => {
        selectedNovel = filtered[Number(button.dataset.openNovel)];
        renderChapters();
      });
    });
  }

  function renderChapters() {
    if (!selectedNovel) return;

    list.className = "chapter-list";
    list.innerHTML = `
      <button type="button" id="backToNovels">← กลับไปหน้ารวมนิยาย</button>
      <h2>${escapeHTML(getTitle(selectedNovel))}</h2>
      <p>${escapeHTML(selectedNovel.descriptionThai || "")}</p>
      <h3>สารบัญ</h3>
      ${(selectedNovel.chapters || []).map((chapter, index) => `
        <button class="chapter-button" type="button"
          data-chapter="${index}">
          บทที่ ${chapter.number}: ${escapeHTML(
            chapter.titleTh || chapter.titleZh || `บทที่ ${chapter.number}`
          )}
        </button>
      `).join("")}
    `;

    document.getElementById("backToNovels")
      .addEventListener("click", () => {
        selectedNovel = null;
        renderNovels();
      });

    list.querySelectorAll("[data-chapter]").forEach(button => {
      button.addEventListener("click", () => {
        const chapter = selectedNovel.chapters[Number(button.dataset.chapter)];
        renderChapter(chapter);
      });
    });
  }

  function renderChapter(chapter) {
    const chinese = chapter.textZh || "";
    const thai = chapter.textTh || "";
    const pinyin = chapter.pinyin || "";
    const chapters = selectedNovel?.chapters || [];
    const currentIndex = chapters.indexOf(chapter);
    list.innerHTML = `
      <button type="button" id="backToChapters">← กลับไปสารบัญ</button>

      <h2>บทที่ ${chapter.number}: ${escapeHTML(
        chapter.titleTh || chapter.titleZh || ""
      )}</h2>
${
        chapter.image
          ? `<img src="${escapeHTML(chapter.image)}"
                 alt="${escapeHTML(chapter.titleTh || chapter.titleZh || "ภาพประกอบ")}"
                 style="display:block;max-width:100%;height:auto;margin:16px auto;border-radius:8px;">`
          : ""
      }
      <div class="reading-controls">
        <button type="button" id="togglePinyin">
          ${showPinyin ? "ซ่อนพินอิน" : "แสดงพินอิน"}
        </button>
        <button type="button" id="toggleThai">
          ${showThai ? "ซ่อนคำแปลไทย" : "แสดงคำแปลไทย"}
        </button>
      </div>

      ${
        chinese
          ? `<h3>ภาษาจีน</h3><p class="story-text">${escapeHTML(chinese).replace(/\n/g, "<br>")}</p>`
          : `<p>เนื้อหาภาษาจีนของบทนี้ยังไม่ได้เพิ่ม</p>`
      }

      ${
        pinyin
          ? `<div ${showPinyin ? "" : "hidden"}>
               <h3>พินอิน</h3>
               <p class="story-text">${escapeHTML(pinyin).replace(/\n/g, "<br>")}</p>
             </div>`
          : ""
      }

      ${
        thai
          ? `<div ${showThai ? "" : "hidden"}>
               <h3>คำแปลภาษาไทย</h3>
               <p class="story-text">${escapeHTML(thai).replace(/\n/g, "<br>")}</p>
             </div>`
          : `<p>คำแปลภาษาไทยของบทนี้ยังไม่ได้เพิ่ม</p>`
      }

      <h3>คำศัพท์สำคัญ</h3>
      ${
        chapter.vocabulary?.length
          ? `<ul>${chapter.vocabulary.map(word =>
              `<li>${escapeHTML(word.word || word.zh || "")} (${escapeHTML(word.pinyin || "")}) — ${escapeHTML(word.meaningTh || word.th || "")}</li>`
            ).join("")}</ul>`
          : "<p>ยังไม่ได้เพิ่มคำศัพท์</p>"
      }

      <h3>คำคมท้ายบท</h3>
      <p>${escapeHTML(chapter.quoteZh || chapter.quoteTh || "ยังไม่ได้เพิ่มคำคม")}</p>

      ${
        chapter.quotePinyin
          ? `<p>${escapeHTML(chapter.quotePinyin)}</p>`
          : ""
      }

      ${
        chapter.quoteTh
          ? `<p>${escapeHTML(chapter.quoteTh)}</p>`
          : ""
      }

      <div class="chapter-navigation">
        <button type="button" id="prevChapter"
          ${currentIndex <= 0 ? "disabled" : ""}>
          ← บทก่อนหน้า
        </button>
        <button type="button" id="nextChapter"
          ${currentIndex < 0 || currentIndex >= chapters.length - 1 ? "disabled" : ""}>
          บทถัดไป →
        </button>
      </div>
    `;
    document.getElementById("backToChapters")
      .addEventListener("click", renderChapters);

    document.getElementById("togglePinyin")
      .addEventListener("click", () => {
        showPinyin = !showPinyin;
        renderChapter(chapter);
      });

    document.getElementById("toggleThai")
      .addEventListener("click", () => {
        showThai = !showThai;
        renderChapter(chapter);
      });
    document.getElementById("prevChapter")
      .addEventListener("click", () => {
        if (currentIndex > 0) {
          renderChapter(chapters[currentIndex - 1]);
        }
      });

    document.getElementById("nextChapter")
      .addEventListener("click", () => {
        if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
          renderChapter(chapters[currentIndex + 1]);
        }
      });
  }

  categories?.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      categories.querySelectorAll("[data-category]").forEach(item => {
        item.classList.toggle("active", item === button);
      });
      selectedNovel = null;
      renderNovels();
    });
  });

  if (!novels().length) {
    list.className = "empty";
    list.innerHTML = `
      <h3>ยังโหลดข้อมูลนิยายไม่ได้</h3>
      <p>ตรวจสอบว่าโหลด novel-data.js ก่อน novel-reader.js</p>
    `;
  } else {
    renderNovels();
  }
})();
