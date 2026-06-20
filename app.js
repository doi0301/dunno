const DEFAULT_CATEGORIES = {
  electronics: { label: "전자기기", emoji: "🔌", color: "#9dc7ff" },
  kitchen: { label: "주방", emoji: "🍳", color: "#ffdba1" },
  documents: { label: "서류", emoji: "📄", color: "#c7f0d8" },
  clothing: { label: "의류", emoji: "👕", color: "#fecaca" },
  toiletries: { label: "욕실", emoji: "🧴", color: "#e9d5ff" },
  food: { label: "식료품", emoji: "🥫", color: "#fde68a" },
  tools: { label: "공구", emoji: "🔧", color: "#dbeafe" },
  etc: { label: "기타", emoji: "📦", color: "#e5e7eb" },
};

const STORAGE_KEY = "dunno.items.v1";
const CATEGORY_STORAGE_KEY = "dunno.categories.v1";
const ONBOARDING_KEY = "dunno.onboarding.dismissed.v1";
const CATEGORY_FALLBACK_EMOJIS = ["📦", "🧺", "🗂️", "🪄", "🧰", "🧷", "🧩", "🛍️"];
const CATEGORY_FALLBACK_COLORS = ["#e5e7eb", "#dbeafe", "#fee2e2", "#dcfce7", "#fef3c7", "#e0e7ff", "#fce7f3", "#cffafe"];

const state = {
  items: [],
  searchQuery: "",
  activeCategory: "all",
  categories: { ...DEFAULT_CATEGORIES },
  viewMode: "category",
  onboardingDismissed: false,
  formImageMode: "url",
  editingItemId: null,
  highlightedNewItemId: null,
  formSelectedImageUrl: "",
};

const $ = {
  searchInput: document.querySelector("#searchInput"),
  viewToggle: document.querySelector("#viewToggle"),
  categoryChips: document.querySelector("#categoryChips"),
  itemList: document.querySelector("#itemList"),
  fabAdd: document.querySelector("#fabAdd"),
  itemDialog: document.querySelector("#itemDialog"),
  itemForm: document.querySelector("#itemForm"),
  cancelBtn: document.querySelector("#cancelBtn"),
  dialogTitle: document.querySelector("#dialogTitle"),
  formError: document.querySelector("#formError"),
  submitBtn: document.querySelector("#submitBtn"),
  imageModeToggle: document.querySelector("#imageModeToggle"),
  imageUrlGroup: document.querySelector("#imageUrlGroup"),
  imageUploadGroup: document.querySelector("#imageUploadGroup"),
  customCategoryInput: document.querySelector("#customCategoryInput"),
  addCategoryBtn: document.querySelector("#addCategoryBtn"),
  renameCategoryInput: document.querySelector("#renameCategoryInput"),
  renameCategoryBtn: document.querySelector("#renameCategoryBtn"),
  deleteCategoryBtn: document.querySelector("#deleteCategoryBtn"),
  categoryInput: document.querySelector("#categoryInput"),
  nameInput: document.querySelector("#nameInput"),
  locationInput: document.querySelector("#locationInput"),
  quantityInput: document.querySelector("#quantityInput"),
  memoInput: document.querySelector("#memoInput"),
  imageUrlInput: document.querySelector("#imageUrlInput"),
  imageUploadInput: document.querySelector("#imageUploadInput"),
  imageCaptureInput: document.querySelector("#imageCaptureInput"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePreviewHint: document.querySelector("#imagePreviewHint"),
  clearImageBtn: document.querySelector("#clearImageBtn"),
};

const SAMPLE_ITEMS = [
  {
    name: "여권",
    location: "침실 서랍 2번칸",
    category: "documents",
    quantity: 1,
    memo: "만료일 확인",
  },
  {
    name: "보조배터리",
    location: "책상 서랍",
    category: "electronics",
    quantity: 2,
    memo: "충전 80%",
  },
  {
    name: "세제",
    location: "욕실 하부장",
    category: "toiletries",
    quantity: 1,
    memo: "리필 필요",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCategoryMeta(categoryKey) {
  return state.categories[categoryKey] || state.categories.etc || DEFAULT_CATEGORIES.etc;
}

function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_CATEGORIES };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_CATEGORIES };
    }

    const merged = { ...DEFAULT_CATEGORIES };
    Object.entries(parsed).forEach(([key, value]) => {
      if (!key || typeof value !== "object" || !value) {
        return;
      }
      const label = String(value.label || "").trim();
      if (!label) {
        return;
      }
      merged[key] = {
        label,
        emoji: String(value.emoji || "📦").trim() || "📦",
        color: String(value.color || "#e5e7eb").trim() || "#e5e7eb",
      };
    });

    return merged;
  } catch {
    return { ...DEFAULT_CATEGORIES };
  }
}

function saveCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.categories));
}

function slugifyCategoryName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function findCategoryKeyByLabel(label) {
  const normalized = label.trim();
  const found = Object.entries(state.categories).find(
    ([, meta]) => meta.label === normalized,
  );
  return found ? found[0] : null;
}

function createCustomCategory(name) {
  const label = String(name || "").trim();
  if (!label) {
    return null;
  }

  const existingKey = findCategoryKeyByLabel(label);
  if (existingKey) {
    return existingKey;
  }

  const base = slugifyCategoryName(label) || `custom-${Date.now()}`;
  let key = base;
  let suffix = 2;
  while (state.categories[key]) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }

  const index = Object.keys(state.categories).length;
  state.categories[key] = {
    label,
    emoji: CATEGORY_FALLBACK_EMOJIS[index % CATEGORY_FALLBACK_EMOJIS.length],
    color: CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length],
  };

  saveCategories();
  renderCategoryChips();
  renderCategoryOptions();
  syncCategoryManageInputs(key);
  return key;
}

function syncCategoryManageInputs(selectedKey = null) {
  const key = selectedKey && state.categories[selectedKey]
    ? selectedKey
    : ($.categoryInput.value && state.categories[$.categoryInput.value]
      ? $.categoryInput.value
      : (Object.keys(state.categories)[0] || "etc"));

  if ($.categoryInput.value !== key) {
    $.categoryInput.value = key;
  }

  $.renameCategoryInput.value = getCategoryMeta(key).label;
}

function renameCategory(targetKey, nextLabel) {
  const key = String(targetKey || "").trim();
  const label = String(nextLabel || "").trim();

  if (!key || !state.categories[key]) {
    $.formError.textContent = "변경할 카테고리를 선택해 주세요.";
    return false;
  }

  if (!label) {
    $.formError.textContent = "변경할 이름을 입력해 주세요.";
    return false;
  }

  const duplicate = findCategoryKeyByLabel(label);
  if (duplicate && duplicate !== key) {
    $.formError.textContent = "이미 존재하는 카테고리 이름입니다.";
    return false;
  }

  state.categories[key] = {
    ...state.categories[key],
    label,
  };

  saveCategories();
  renderCategoryChips();
  renderCategoryOptions();
  syncCategoryManageInputs(key);
  renderItems();
  $.formError.textContent = "";
  return true;
}

function deleteCategory(targetKey) {
  const key = String(targetKey || "").trim();
  if (!key || !state.categories[key]) {
    $.formError.textContent = "삭제할 카테고리를 선택해 주세요.";
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(DEFAULT_CATEGORIES, key)) {
    $.formError.textContent = "기본 카테고리는 삭제할 수 없어요.";
    return false;
  }

  delete state.categories[key];
  state.items = state.items.map((item) =>
    item.category === key ? { ...item, category: "etc" } : item,
  );

  if (state.activeCategory === key) {
    state.activeCategory = "all";
  }

  if ($.categoryInput.value === key) {
    $.categoryInput.value = "etc";
  }

  saveCategories();
  saveItems(state.items);
  renderCategoryChips();
  renderCategoryOptions();
  syncCategoryManageInputs("etc");
  renderItems();
  $.formError.textContent = "";
  return true;
}

function buildImageUrl(name) {
  return `https://source.unsplash.com/featured/240x240/?${encodeURIComponent(name)}`;
}

function looksLikeHttpUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

function looksLikeDataImageUrl(value) {
  return /^data:image\//i.test(String(value).trim());
}

function resolveImageUrl(rawInput, fallbackKeyword, previousImageUrl) {
  const trimmed = String(rawInput ?? "").trim();
  if (!trimmed) {
    return String(previousImageUrl ?? "").trim() || buildImageUrl(fallbackKeyword || "item");
  }

  if (looksLikeHttpUrl(trimmed)) {
    return trimmed;
  }

  if (looksLikeDataImageUrl(trimmed)) {
    return trimmed;
  }

  return buildImageUrl(trimmed);
}

function setImagePreview(src) {
  const safeSrc = String(src || "").trim();
  if (!safeSrc) {
    $.imagePreview.hidden = true;
    $.imagePreview.removeAttribute("src");
    $.imagePreviewHint.hidden = false;
    $.clearImageBtn.hidden = true;
    return;
  }

  $.imagePreview.src = safeSrc;
  $.imagePreview.hidden = false;
  $.imagePreviewHint.hidden = true;
  $.clearImageBtn.hidden = false;
}

function renderImageMode() {
  const isUpload = state.formImageMode === "upload";
  $.imageUrlGroup.hidden = isUpload;
  $.imageUploadGroup.hidden = !isUpload;

  const tabs = $.imageModeToggle.querySelectorAll("button[data-image-mode]");
  tabs.forEach((tab) => {
    const active = tab.dataset.imageMode === state.formImageMode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function setImageMode(mode) {
  state.formImageMode = mode === "upload" ? "upload" : "url";
  renderImageMode();
}

function clearSelectedImage() {
  state.formSelectedImageUrl = "";
  $.imageUploadInput.value = "";
  $.imageCaptureInput.value = "";
  const uploadRadio = document.querySelector('input[name="imageInputMethod"][value="upload"]');
  if (uploadRadio) {
    uploadRadio.checked = true;
  }
  setImagePreview("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("파일 읽기에 실패했습니다."));
    reader.readAsDataURL(file);
  });
}

async function handleImageFileInput(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    $.formError.textContent = "이미지 파일만 선택할 수 있어요.";
    return;
  }

  const maxBytes = 4 * 1024 * 1024;
  if (file.size > maxBytes) {
    $.formError.textContent = "이미지 크기는 4MB 이하로 선택해 주세요.";
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.formSelectedImageUrl = dataUrl;
    setImagePreview(dataUrl);
    $.formError.textContent = "";
  } catch {
    $.formError.textContent = "이미지 처리 중 오류가 발생했어요.";
  }
}

function normalizeItem(input, previous = null) {
  const safeName = String(input?.name ?? "").trim();
  const safeLocation = String(input?.location ?? "").trim();
  const safeCategory = state.categories[input?.category] ? input.category : "etc";
  const parsedQty = Number.parseInt(input?.quantity, 10);
  const safeQuantity = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
  const safeMemo = String(input?.memo ?? "").trim();
  const safeImageUrl = resolveImageUrl(
    input?.imageUrl,
    safeName,
    previous?.imageUrl,
  );

  return {
    id: previous?.id || String(input?.id || createId()),
    name: safeName,
    location: safeLocation,
    category: safeCategory,
    quantity: safeQuantity,
    memo: safeMemo,
    imageUrl: safeImageUrl,
    createdAt: previous?.createdAt || Number(input?.createdAt) || Date.now(),
  };
}

function isValidItemForSave(item) {
  return Boolean(item.name && item.location && state.categories[item.category]);
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeItem(item))
      .filter((item) => item.name && item.location);
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadOnboardingDismissed() {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

function setOnboardingDismissed(value) {
  localStorage.setItem(ONBOARDING_KEY, value ? "1" : "0");
  state.onboardingDismissed = value;
}

function createSampleItems() {
  return SAMPLE_ITEMS.map((item) => normalizeItem(item));
}

function getLocationFilterOptions() {
  const locationSet = new Set(
    state.items
      .map((item) => String(item.location || "").trim())
      .filter(Boolean),
  );

  return Array.from(locationSet)
    .sort((a, b) => a.localeCompare(b, "ko"))
    .map((location) => ({
      key: location,
      label: location,
    }));
}

function getCategoryFilterOptions() {
  return Object.entries(state.categories).map(([key, value]) => ({
    key,
    label: value.label,
  }));
}

function getFilteredItems() {
  const query = state.searchQuery.toLowerCase();
  return state.items.filter((item) => {
    const optionMatched = state.viewMode === "location"
      ? (state.activeCategory === "all" || item.location === state.activeCategory)
      : (state.activeCategory === "all" || item.category === state.activeCategory);
    const queryMatched =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query);

    return optionMatched && queryMatched;
  });
}

function renderItems() {
  const filtered = getFilteredItems();
  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const grouped = filtered.reduce((acc, item) => {
    const groupKey = state.viewMode === "location" ? item.location : item.category;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});

  const orderedGroupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "ko"));

  const sections = orderedGroupKeys
    .map((groupKey) => {
      const items = grouped[groupKey];
      const categoryForHeader = state.viewMode === "category" ? getCategoryMeta(groupKey) : null;
      const groupTitle = state.viewMode === "location"
        ? `${escapeHtml(groupKey)}`
        : `${categoryForHeader?.label || "기타"}`;

      const cards = items
        .map(
          (item) => `
          <article class="item-card ${state.highlightedNewItemId === item.id ? "is-new" : ""}" data-item-id="${item.id}" style="--category-color:${getCategoryMeta(item.category).color}">
            <div class="thumb-wrap">
              <img
                class="thumb"
                src="${item.imageUrl}"
                alt="${escapeHtml(item.name)}"
                loading="lazy"
                onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('div'), {className:'thumb-fallback', textContent:'${getCategoryMeta(item.category).emoji}'}));"
              />
            </div>
            <div class="item-meta">
              <h3>${escapeHtml(item.name)}</h3>
              <div class="item-details">
                <div class="detail-row">
                  <span class="detail-label">📍 위치</span>
                  <span class="detail-value">${escapeHtml(item.location)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏷️ 카테고리</span>
                  <span class="detail-value">${getCategoryMeta(item.category).label}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📦 수량</span>
                  <span class="detail-value">${item.quantity}개</span>
                </div>
                ${item.memo ? `<div class="detail-row memo"><span class="detail-label">📝 메모</span><span class="detail-value">${escapeHtml(item.memo)}</span></div>` : ""}
              </div>
              <div class="card-actions">
                <div class="qty-controls" aria-label="수량 빠른 조절">
                  <button type="button" class="tiny-btn qty-btn" data-action="qty-minus" data-item-id="${item.id}">-</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button type="button" class="tiny-btn qty-btn" data-action="qty-plus" data-item-id="${item.id}">+</button>
                </div>
                <button type="button" class="tiny-btn" data-action="edit" data-item-id="${item.id}">수정</button>
                <button type="button" class="tiny-btn danger" data-action="delete" data-item-id="${item.id}">삭제</button>
              </div>
            </div>
          </article>
        `,
        )
        .join("");

      return `
        <section class="group-block">
          <h2 class="group-title">${groupTitle}</h2>
          <div class="group-list">${cards}</div>
        </section>
      `;
    })
    .join("");

  $.itemList.innerHTML = sections;

  if (state.highlightedNewItemId) {
    setTimeout(() => {
      state.highlightedNewItemId = null;
    }, 420);
  }
}

function renderViewToggle() {
  const tabs = $.viewToggle.querySelectorAll("button[data-view]");
  tabs.forEach((tab) => {
    const active = tab.dataset.view === state.viewMode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function addItemFromForm() {
  const current = state.editingItemId
    ? state.items.find((item) => item.id === state.editingItemId)
    : null;

  const imageInputValue = state.formImageMode === "upload"
    ? state.formSelectedImageUrl
    : $.imageUrlInput.value;

  const candidate = normalizeItem({
    name: $.nameInput.value,
    location: $.locationInput.value,
    category: $.categoryInput.value,
    quantity: $.quantityInput.value,
    memo: $.memoInput.value,
    imageUrl: imageInputValue,
  }, current);

  if (!isValidItemForSave(candidate)) {
    $.formError.textContent = "이름, 위치, 카테고리는 필수입니다.";
    return false;
  }

  $.formError.textContent = "";

  if (state.editingItemId) {
    state.items = state.items.map((item) =>
      item.id === state.editingItemId ? candidate : item,
    );
  } else {
    state.items.unshift(candidate);
    state.highlightedNewItemId = candidate.id;
  }

  state.editingItemId = null;
  saveItems(state.items);
  renderItems();
  return true;
}

function fillForm(item) {
  $.nameInput.value = item.name;
  $.locationInput.value = item.location;
  $.categoryInput.value = item.category;
  $.quantityInput.value = String(item.quantity);
  $.memoInput.value = item.memo;
  const existingImage = String(item.imageUrl || "").trim();
  const uploadedImage = looksLikeDataImageUrl(existingImage);

  if (uploadedImage) {
    setImageMode("upload");
    state.formSelectedImageUrl = existingImage;
    $.imageUrlInput.value = "";
    setImagePreview(existingImage);
  } else {
    setImageMode("url");
    state.formSelectedImageUrl = "";
    $.imageUrlInput.value = existingImage;
    setImagePreview("");
  }

  $.imageUploadInput.value = "";
  $.imageCaptureInput.value = "";
}

function openCreateDialog() {
  state.editingItemId = null;
  $.itemForm.reset();
  $.categoryInput.value = Object.keys(state.categories)[0] || "etc";
  $.quantityInput.value = "1";
  setImageMode("url");
  clearSelectedImage();
  syncCategoryManageInputs();
  updateNameList();
  updateLocationList();
  $.dialogTitle.textContent = "물건 추가";
  $.submitBtn.textContent = "저장";
  $.formError.textContent = "";
  $.itemDialog.showModal();
}

function openEditDialog(itemId) {
  const target = state.items.find((item) => item.id === itemId);
  if (!target) {
    return;
  }

  state.editingItemId = target.id;
  fillForm(target);
  syncCategoryManageInputs(target.category);
  $.dialogTitle.textContent = "물건 수정";
  $.submitBtn.textContent = "수정 저장";
  $.formError.textContent = "";
  $.itemDialog.showModal();
}

function deleteItem(itemId) {
  state.items = state.items.filter((item) => item.id !== itemId);
  saveItems(state.items);
  renderItems();
}

function renderCategoryChips() {
  const dynamicOptions = state.viewMode === "location"
    ? getLocationFilterOptions()
    : getCategoryFilterOptions();

  const categories = [
    { key: "all", label: "전체", emoji: "✨" },
    ...dynamicOptions,
  ];

  const validKeys = new Set(categories.map((category) => category.key));
  if (!validKeys.has(state.activeCategory)) {
    state.activeCategory = "all";
  }

  $.categoryChips.innerHTML = categories
    .map(
      (category) =>
        `<button class="chip ${state.activeCategory === category.key ? "active" : ""}" data-category="${category.key}">${category.emoji ? `${category.emoji} ` : ""}${category.label}</button>`,
    )
    .join("");
}

function renderCategoryOptions() {
  $.categoryInput.innerHTML = Object.entries(state.categories)
    .map(
      ([key, value]) =>
        `<option value="${key}">${value.label}</option>`,
    )
    .join("");
}

function renderEmptyState() {
  const onboardingBlock = state.onboardingDismissed
    ? ""
    : `
      <div class="onboarding-box">
        <p>처음이라면 샘플 데이터를 넣고 바로 써보세요.</p>
        <div class="onboarding-actions">
          <button type="button" class="tiny-btn" data-action="seed-sample">샘플 데이터 넣기</button>
          <button type="button" class="tiny-btn" data-action="dismiss-onboarding">건너뛰기</button>
        </div>
      </div>
    `;

  $.itemList.innerHTML = `
    <article class="empty-state">
      <div class="emoji">🪄</div>
      <h3>아직 등록된 물건이 없어요</h3>
      <p>아래 + 버튼으로 첫 물건을 추가해보세요.</p>
      ${onboardingBlock}
    </article>
  `;
}

function updateItemQuantity(itemId, diff) {
  let changed = false;
  state.items = state.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    changed = true;
    const nextQuantity = Math.max(1, item.quantity + diff);
    return normalizeItem({ ...item, quantity: nextQuantity }, item);
  });

  if (!changed) {
    return;
  }

  saveItems(state.items);
  renderItems();
}

function bindEvents() {
  $.searchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim();
    renderItems();
  });

  $.categoryChips.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.category;
    renderCategoryChips();
    renderItems();
  });

  $.viewToggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-view]");
    if (!button) {
      return;
    }

    state.viewMode = button.dataset.view === "location" ? "location" : "category";
    state.activeCategory = "all";
    renderViewToggle();
    renderCategoryChips();
    renderItems();
  });

  $.fabAdd.addEventListener("click", () => {
    openCreateDialog();
  });

  $.cancelBtn.addEventListener("click", () => {
    state.editingItemId = null;
    $.formError.textContent = "";
    clearSelectedImage();
    $.itemDialog.close();
  });

  $.imageUploadInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    await handleImageFileInput(file);
  });

  $.imageCaptureInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    await handleImageFileInput(file);
  });

  const imageInputRadios = document.querySelectorAll('input[name="imageInputMethod"]');
  imageInputRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.value === "upload") {
        $.imageUploadInput.click();
      } else if (event.target.value === "capture") {
        $.imageCaptureInput.click();
      }
    });
  });

  $.clearImageBtn.addEventListener("click", () => {
    clearSelectedImage();
  });

  $.imageModeToggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-image-mode]");
    if (!button) {
      return;
    }

    setImageMode(button.dataset.imageMode);
  });

  $.addCategoryBtn.addEventListener("click", () => {
    const key = createCustomCategory($.customCategoryInput.value);
    if (!key) {
      $.formError.textContent = "카테고리 이름을 입력해 주세요.";
      return;
    }

    $.formError.textContent = "";
    $.categoryInput.value = key;
    $.customCategoryInput.value = "";
    syncCategoryManageInputs(key);
  });

  $.customCategoryInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    $.addCategoryBtn.click();
  });

  $.categoryInput.addEventListener("change", () => {
    syncCategoryManageInputs($.categoryInput.value);
  });

  $.nameInput.addEventListener("input", updateNameList);
  $.nameInput.addEventListener("change", autoSuggestCategory);
  $.locationInput.addEventListener("input", updateLocationList);

  $.renameCategoryBtn.addEventListener("click", () => {
    renameCategory($.categoryInput.value, $.renameCategoryInput.value);
  });

  $.deleteCategoryBtn.addEventListener("click", () => {
    deleteCategory($.categoryInput.value);
  });

  $.itemList.addEventListener("click", (event) => {
    const onboardingButton = event.target.closest("button[data-action='seed-sample'], button[data-action='dismiss-onboarding']");
    if (onboardingButton) {
      const action = onboardingButton.dataset.action;
      if (action === "seed-sample") {
        state.items = createSampleItems();
        saveItems(state.items);
        setOnboardingDismissed(true);
        renderItems();
      }

      if (action === "dismiss-onboarding") {
        setOnboardingDismissed(true);
        renderItems();
      }
      return;
    }

    const button = event.target.closest("button[data-action][data-item-id]");
    if (!button) {
      return;
    }

    const { action, itemId } = button.dataset;
    if (action === "edit") {
      openEditDialog(itemId);
      return;
    }

    if (action === "delete") {
      const card = button.closest(".item-card");
      if (!card) {
        deleteItem(itemId);
        return;
      }

      card.classList.add("is-removing");
      card.addEventListener(
        "animationend",
        () => {
          deleteItem(itemId);
        },
        { once: true },
      );
      return;
    }

    if (action === "qty-plus") {
      updateItemQuantity(itemId, 1);
      return;
    }

    if (action === "qty-minus") {
      updateItemQuantity(itemId, -1);
    }
  });

  $.itemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const added = addItemFromForm();
    if (!added) {
      return;
    }
    state.editingItemId = null;
    $.itemForm.reset();
    $.quantityInput.value = "1";
    clearSelectedImage();
    $.formError.textContent = "";
    $.dialogTitle.textContent = "물건 추가";
    $.submitBtn.textContent = "저장";
    $.itemDialog.close();
  });
}

function getNameSuggestions(input) {
  if (!input.trim()) return [];
  const query = input.toLowerCase();
  const names = new Set(state.items.map(item => item.name.toLowerCase()));
  return Array.from(names)
    .filter(name => name.includes(query))
    .slice(0, 5);
}

function getLocationSuggestions(input) {
  if (!input.trim()) return [];
  const query = input.toLowerCase();
  const locations = new Set(state.items.map(item => item.location.toLowerCase()));
  return Array.from(locations)
    .filter(loc => loc.includes(query))
    .slice(0, 5);
}

function updateNameList() {
  const input = $.nameInput.value;
  const suggestions = getNameSuggestions(input);
  const nameList = document.querySelector("#nameList");
  nameList.innerHTML = suggestions.map(name => `<option value="${name}"></option>`).join("");
}

function updateLocationList() {
  const input = $.locationInput.value;
  const suggestions = getLocationSuggestions(input);
  const locationList = document.querySelector("#locationList");
  locationList.innerHTML = suggestions.map(loc => `<option value="${loc}"></option>`).join("");
}

function suggestCategoryByName(name) {
  const categoryKeywords = {
    electronics: ["폰", "충전", "케이블", "컴퓨터", "노트북", "마우스", "키보드", "모니터", "헤드폰", "스피커"],
    kitchen: ["냄비", "팬", "칼", "식기", "그릇", "숟가락", "젓가락", "식탁", "냉장고", "전자레인지"],
    documents: ["서류", "서식", "계약서", "영수증", "청구서", "보험", "증명서", "카드"],
    clothing: ["옷", "셔츠", "바지", "치마", "신발", "양말", "모자", "장갑", "스카프"],
    toiletries: ["샴푸", "린스", "비누", "치약", "칫솔", "휴지", "넙치", "세제", "수건"],
    food: ["라면", "기름", "쌀", "밀가루", "소금", "설탕", "스낵", "음료", "우유"],
    tools: ["망치", "드라이버", "못", "나사", "접착제", "테이프", "펜치"],
  };

  const nameLower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => nameLower.includes(kw))) {
      return category;
    }
  }
  return "etc";
}

function autoSuggestCategory() {
  const name = $.nameInput.value.trim();
  if (name) {
    const suggestedCategory = suggestCategoryByName(name);
    $.categoryInput.value = suggestedCategory;
    syncCategoryManageInputs(suggestedCategory);
  }
}

function bootstrap() {
  state.categories = loadCategories();
  state.items = loadItems();
  state.onboardingDismissed = loadOnboardingDismissed();
  renderCategoryChips();
  renderViewToggle();
  renderImageMode();
  renderCategoryOptions();
  syncCategoryManageInputs();
  renderItems();
  bindEvents();
}

bootstrap();
