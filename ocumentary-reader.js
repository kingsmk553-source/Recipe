
(() => {
  "use strict";

  const articles = () =>
    Array.isArray(window.documentaryLibrary)
      ? window.documentaryLibrary
      : [];

  const list = document.getElementById("documentaryList");
  const search = document.getElementById("searchInput");
  const categories = document.getElementById("categories");

  if (!list) return;

  let activeCategory = "all";
  let selectedArticle = null;
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

  function renderArticles() {
    const keyword = (search?.value || "").trim().toLowerCase();

    const filtered = articles().filter(article => {
      const matchesCategory =
        activeCategory === "all" ||
        article.category === activeCategory;

      const searchable = [
        article.titleZh,
        article.titleTh,
        article.descriptionTh
      ].join(" ").toLowerCase();

      return matchesCategory && searchable.includes(keyword);
    });

    if (!filtered.length) {
      list.className = "empty";
      list.innerHTML = `
        <h3>ยังไม่พบบทอ่าน</h3>
        <p>ลองค้นหาด้วยคำอื่น หรือเลือกหมวดทั้งหมด</p>
      `;
      return;
    }

    list.className = "documentary-grid";

    list.innerHTML = filtered.map((article, index) => `
      <article class="documentary-card">
        <div class="documentary-card-body">
          <h3>${escapeHTML(article.titleTh)}</h3>
          <p>${escapeHTML(article.titleZh)}</p>
          <p>${escapeHTML(article.descriptionTh)}</p>
          <p>มี ${article.chapters?.length || 0} บท</p>
          <button type="button" data-open-article="${index}">
            ดูสารบัญ
          </button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-open-article]").forEach(button => {
      button.addEventListener("click", () => {
        selectedArticle = filtered[Number(button.dataset.openArticle)];
        renderChapters();
      });
    });
  }

  function renderChapters() {
    if (!selectedArticle) return;

    list.className = "chapter-list";

    list.innerHTML = `
      <button type="button" id="backToArticles">
        ← กลับไปรายการสารคดี
      </button>

      <h2>${escapeHTML(selectedArticle.titleTh)}</h2>
      <p>${escapeHTML(selectedArticle.titleZh)}</p>
      <p>${escapeHTML(selectedArticle.descriptionTh)}</p>
      <h3>สารบัญ</h3>

      ${(selectedArticle.chapters || []).map((chapter, index) => `
        <button class="chapter-button" type="button"
          data-chapter="${index}">
          บทที่ ${chapter.number}: ${escapeHTML(
            chapter.titleTh || chapter.titleZh || ""
          )}
        </button>
      `).join("")}
    `;

    document.getElementById("backToArticles")
      .addEventListener("click", () => {
        selectedArticle = null;
        renderArticles();
      });

    list.querySelectorAll("[data-chapter]").forEach(button => {
      button.addEventListener("click", () => {
        const chapter =
          selectedArticle.chapters[Number(button.dataset.chapter)];
        renderChapter(chapter);
      });
    });
  }

  function renderChapter(chapter) {
    const chapters = selectedArticle?.chapters || [];
    const currentIndex = chapters.indexOf(chapter);

    list.className = "reading-page";

    list.innerHTML = `
      <button type="button" id="backToChapters">
        ← กลับไปสารบัญ
      </button>

      <h2>${escapeHTML(chapter.titleTh || "")}</h2>
      <h3>${escapeHTML(chapter.titleZh || "")}</h3>

      <div class="reading-controls">
        <button type="button" id="togglePinyin">
          ${showPinyin ? "ซ่อนพินอิน" : "แสดงพินอิน"}
        </button>
        <button type="button" id="toggleThai">
          ${showThai ? "ซ่อนภาษาไทย" : "แสดงภาษาไทย"}
        </button>
      </div>

      <h3>ภาษาจีน</h3>
      <p class="story-text">${escapeHTML(chapter.textZh || "").replace(/\n/g, "<br>")}</p>

      <div ${showPinyin ? "" : "hidden"}>
        <h3>拼音 / พินอิน</h3>
        <p class="story-text">${escapeHTML(chapter.pinyin || "")}</p>
      </div>

      <div ${showThai ? "" : "hidden"}>
        <h3>คำแปลภาษาไทย</h3>
        <p class="story-text">${escapeHTML(chapter.textTh || "").replace(/\n/g, "<br>")}</p>
      </div>

      <h3>📚 คำศัพท์สำคัญ</h3>
      ${
        chapter.vocabulary?.length
          ? `<ul class="vocabulary-list">
              ${chapter.vocabulary.map(word => `
                <li>
                  <strong>${escapeHTML(word.word || "")}</strong>
                  (${escapeHTML(word.pinyin || "")})
                  — ${escapeHTML(word.meaningTh || "")}
                </li>
              `).join("")}
            </ul>`
          : "<p>ยังไม่ได้เพิ่มคำศัพท์</p>"
      }

      <h3>คำคมท้ายบท</h3>
      <p>${escapeHTML(chapter.quoteZh || "")}</p>
      <p>${escapeHTML(chapter.quotePinyin || "")}</p>
      <p>${escapeHTML(chapter.quoteTh || "")}</p>

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

      categories.querySelectorAll("[data-category]")
        .forEach(item => {
          item.classList.toggle("active", item === button);
        });

      selectedArticle = null;
      renderArticles();
    });
  });

  search?.addEventListener("input", renderArticles);

  const style = document.createElement("style");
  style.textContent = `
    .documentary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }

    .documentary-card, .reading-page, .chapter-list {
      background: white;
      padding: 18px;
      border-radius: 14px;
      margin-bottom: 14px;
      box-shadow: 0 3px 14px #0000000a;
    }

    .documentary-card button, .chapter-list button,
    .reading-page button {
      padding: 10px 14px;
      border: 0;
      border-radius: 9px;
      background: #593c65;
      color: white;
      cursor: pointer;
      margin: 5px 4px 5px 0;
    }

    .chapter-list .chapter-button {
      display: block;
      width: 100%;
      text-align: left;
      margin: 8px 0;
    }

    .reading-page .story-text {
      line-height: 2;
      white-space: normal;
    }

    .vocabulary-list li {
      margin-bottom: 12px;
      line-height: 1.8;
    }

    .chapter-navigation {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 24px;
    }

    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  if (articles().length) {
    renderArticles();
  } else {
    list.className = "empty";
    list.innerHTML = `
      <h3>ยังโหลดข้อมูลสารคดีไม่ได้</h3>
      <p>ตรวจสอบไฟล์ documentary-data.js</p>
    `;
  }
})();
