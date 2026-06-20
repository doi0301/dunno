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

const DEFAULT_ROOMS = ["거실", "침실", "주방", "욕실", "베란다", "현관", "서재", "기타"];

const STORAGE_KEY = "dunno.items.v1";
const CATEGORY_STORAGE_KEY = "dunno.categories.v1";
const ROOM_STORAGE_KEY = "dunno.rooms.v1";
const ONBOARDING_KEY = "dunno.onboarding.dismissed.v1";
const CATEGORY_FALLBACK_EMOJIS = ["📦", "🧺", "🗂️", "🪄", "🧰", "🧷", "🧩", "🛍️"];
const CATEGORY_FALLBACK_COLORS = ["#e5e7eb", "#dbeafe", "#fee2e2", "#dcfce7", "#fef3c7", "#e0e7ff", "#fce7f3", "#cffafe"];

const state = {
  items: [],
  searchQuery: "",
  activeCategory: "all",
  activeFurnitureFilter: "all",
  categories: { ...DEFAULT_CATEGORIES },
  rooms: [...DEFAULT_ROOMS],
  viewMode: "category",
  onboardingDismissed: false,
  formImageMode: "url",
  editingItemId: null,
  highlightedNewItemId: null,
  formSelectedImageUrl: "",
  pendingDelete: null,
};

const $ = {
  searchInput: document.querySelector("#searchInput"),
  viewToggle: document.querySelector("#viewToggle"),
  locationSettingsBtn: document.querySelector("#locationSettingsBtn"),
  categorySettingsBtn: document.querySelector("#categorySettingsBtn"),
  categoryChips: document.querySelector("#categoryChips"),
  locationSubFilters: document.querySelector("#locationSubFilters"),
  locationFurnitureFilter: document.querySelector("#locationFurnitureFilter"),
  listSection: document.querySelector(".list-section"),
  itemList: document.querySelector("#itemList"),
  mainScrollbar: document.querySelector("#mainScrollbar"),
  mainScrollbarTrack: document.querySelector("#mainScrollbarTrack"),
  mainScrollbarThumb: document.querySelector("#mainScrollbarThumb"),
  fabAdd: document.querySelector("#fabAdd"),
  itemDialog: document.querySelector("#itemDialog"),
  locationSettingsDialog: document.querySelector("#locationSettingsDialog"),
  categorySettingsDialog: document.querySelector("#categorySettingsDialog"),
  itemForm: document.querySelector("#itemForm"),
  closeLocationSettingsBtn: document.querySelector("#closeLocationSettingsBtn"),
  closeCategorySettingsBtn: document.querySelector("#closeCategorySettingsBtn"),
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
  categoryManageSelect: document.querySelector("#categoryManageSelect"),
  categoryInput: document.querySelector("#categoryInput"),
  nameInput: document.querySelector("#nameInput"),
  locationRoomInput: document.querySelector("#locationRoomInput"),
  addRoomInput: document.querySelector("#addRoomInput"),
  addRoomBtn: document.querySelector("#addRoomBtn"),
  roomManageSelect: document.querySelector("#roomManageSelect"),
  renameRoomInput: document.querySelector("#renameRoomInput"),
  renameRoomBtn: document.querySelector("#renameRoomBtn"),
  deleteRoomBtn: document.querySelector("#deleteRoomBtn"),
  locationFurnitureInput: document.querySelector("#locationFurnitureInput"),
  locationDetailInput: document.querySelector("#locationDetailInput"),
  quantityInput: document.querySelector("#quantityInput"),
  memoInput: document.querySelector("#memoInput"),
  imageUrlInput: document.querySelector("#imageUrlInput"),
  imageUploadInput: document.querySelector("#imageUploadInput"),
  imageCaptureInput: document.querySelector("#imageCaptureInput"),
  pickUploadBtn: document.querySelector("#pickUploadBtn"),
  pickCaptureBtn: document.querySelector("#pickCaptureBtn"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePreviewHint: document.querySelector("#imagePreviewHint"),
  clearImageBtn: document.querySelector("#clearImageBtn"),
  undoToast: document.querySelector("#undoToast"),
  undoDeleteBtn: document.querySelector("#undoDeleteBtn"),
};

const DEFAULT_IMAGE_PREVIEW_HINT = "파일에서 선택 또는 카메라 촬영을 하면 미리보기가 표시돼요.";

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

const scrollbarDragState = {
  dragging: false,
  startY: 0,
  startThumbTop: 0,
};

function getCurrentThumbTop() {
  return Number.parseFloat($.mainScrollbarThumb?.dataset.top || "0") || 0;
}

function setCurrentThumbTop(value) {
  if (!$.mainScrollbarThumb) {
    return;
  }

  const safeValue = Number.isFinite(value) ? value : 0;
  $.mainScrollbarThumb.dataset.top = String(safeValue);
  $.mainScrollbarThumb.style.transform = `translateY(${safeValue}px)`;
}

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

function loadRooms() {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_ROOMS];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_ROOMS];
    }

    const normalized = Array.from(
      new Set(parsed.map((room) => String(room || "").trim()).filter(Boolean)),
    );

    if (!normalized.length) {
      return [...DEFAULT_ROOMS];
    }

    if (!normalized.includes("기타")) {
      normalized.push("기타");
    }

    return normalized;
  } catch {
    return [...DEFAULT_ROOMS];
  }
}

function saveRooms() {
  localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(state.rooms));
}

function renderRoomOptions() {
  const currentValue = String($.locationRoomInput.value || "").trim();
  $.locationRoomInput.innerHTML = state.rooms
    .map((room) => `<option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`)
    .join("");

  $.roomManageSelect.innerHTML = state.rooms
    .map((room) => `<option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`)
    .join("");

  if (state.rooms.includes(currentValue)) {
    $.locationRoomInput.value = currentValue;
  } else {
    $.locationRoomInput.value = state.rooms[0] || "기타";
  }
}

function syncRoomManageInputs(selectedRoom = null) {
  const room = selectedRoom && state.rooms.includes(selectedRoom)
    ? selectedRoom
    : ($.roomManageSelect.value && state.rooms.includes($.roomManageSelect.value)
      ? $.roomManageSelect.value
      : (state.rooms[0] || "기타"));

  if ($.roomManageSelect.value !== room) {
    $.roomManageSelect.value = room;
  }

  $.renameRoomInput.value = room;
}

function createRoom(name) {
  const room = String(name || "").trim();
  if (!room) {
    $.formError.textContent = "방 이름을 입력해 주세요.";
    return false;
  }

  if (state.rooms.includes(room)) {
    $.roomManageSelect.value = room;
    syncRoomManageInputs(room);
    $.formError.textContent = "";
    return true;
  }

  state.rooms.push(room);
  saveRooms();
  renderRoomOptions();
  $.roomManageSelect.value = room;
  $.locationRoomInput.value = room;
  syncRoomManageInputs(room);
  $.formError.textContent = "";
  return true;
}

function renameRoom(targetRoom, nextRoomName) {
  const fromRoom = String(targetRoom || "").trim();
  const toRoom = String(nextRoomName || "").trim();

  if (!fromRoom || !state.rooms.includes(fromRoom)) {
    $.formError.textContent = "변경할 방을 선택해 주세요.";
    return false;
  }

  if (!toRoom) {
    $.formError.textContent = "변경할 방 이름을 입력해 주세요.";
    return false;
  }

  if (state.rooms.includes(toRoom) && toRoom !== fromRoom) {
    $.formError.textContent = "이미 존재하는 방 이름입니다.";
    return false;
  }

  state.rooms = state.rooms.map((room) => (room === fromRoom ? toRoom : room));
  state.items = state.items.map((item) => {
    if (item.locationRoom !== fromRoom) {
      return item;
    }
    return normalizeItem({ ...item, locationRoom: toRoom }, item);
  });

  if (state.viewMode === "location" && state.activeCategory === fromRoom) {
    state.activeCategory = toRoom;
  }

  saveRooms();
  saveItems(state.items);
  renderRoomOptions();
  syncRoomManageInputs(toRoom);
  renderCategoryChips();
  renderItems();
  $.formError.textContent = "";
  return true;
}

function deleteRoom(targetRoom) {
  const room = String(targetRoom || "").trim();
  if (!room || !state.rooms.includes(room)) {
    $.formError.textContent = "삭제할 방을 선택해 주세요.";
    return false;
  }

  if (room === "기타") {
    $.formError.textContent = "기타 방은 삭제할 수 없어요.";
    return false;
  }

  state.rooms = state.rooms.filter((name) => name !== room);
  state.items = state.items.map((item) => {
    if (item.locationRoom !== room) {
      return item;
    }
    return normalizeItem({ ...item, locationRoom: "기타" }, item);
  });

  if (state.viewMode === "location" && state.activeCategory === room) {
    state.activeCategory = "all";
  }

  saveRooms();
  saveItems(state.items);
  renderRoomOptions();
  syncRoomManageInputs("기타");
  renderCategoryChips();
  renderItems();
  $.formError.textContent = "";
  return true;
}

function mergeRoomsFromItems() {
  const itemRooms = Array.from(
    new Set(
      state.items
        .map((item) => String(item.locationRoom || "").trim())
        .filter(Boolean),
    ),
  );

  let changed = false;
  itemRooms.forEach((room) => {
    if (!state.rooms.includes(room)) {
      state.rooms.push(room);
      changed = true;
    }
  });

  if (!state.rooms.includes("기타")) {
    state.rooms.push("기타");
    changed = true;
  }

  if (changed) {
    saveRooms();
  }
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
  if (!$.categoryManageSelect) {
    return;
  }

  $.categoryManageSelect.innerHTML = Object.entries(state.categories)
    .map(([key, value]) => `<option value="${key}">${escapeHtml(value.label)}</option>`)
    .join("");

  const key = selectedKey && state.categories[selectedKey]
    ? selectedKey
    : ($.categoryManageSelect.value && state.categories[$.categoryManageSelect.value]
      ? $.categoryManageSelect.value
      : (Object.keys(state.categories)[0] || "etc"));

  if ($.categoryManageSelect.value !== key) {
    $.categoryManageSelect.value = key;
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
    $.imagePreviewHint.textContent = DEFAULT_IMAGE_PREVIEW_HINT;
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
    $.imagePreviewHint.textContent = `${file.name || "이미지"} 선택됨`;
    $.formError.textContent = "";
  } catch {
    $.formError.textContent = "이미지 처리 중 오류가 발생했어요.";
  }
}

function parseLocationParts(rawLocation) {
  const safe = String(rawLocation || "").trim();
  if (!safe) {
    return { room: "", furniture: "", detail: "" };
  }

  const segmented = safe
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segmented.length >= 3) {
    return {
      room: segmented[0],
      furniture: segmented[1],
      detail: segmented.slice(2).join(" > "),
    };
  }

  if (segmented.length === 2) {
    return { room: segmented[0], furniture: segmented[1], detail: "" };
  }

  const tokens = safe.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    return {
      room: tokens[0],
      furniture: tokens[1],
      detail: tokens.slice(2).join(" "),
    };
  }

  if (tokens.length === 2) {
    return { room: tokens[0], furniture: tokens[1], detail: "" };
  }

  return { room: tokens[0] || "", furniture: "", detail: "" };
}

function buildLocationText(room, furniture, detail) {
  return [room, furniture, detail].filter(Boolean).join(" > ");
}

function normalizeItem(input, previous = null) {
  const safeName = String(input?.name ?? "").trim();
  const legacyLocation = parseLocationParts(input?.location);
  const safeLocationRoom = String(input?.locationRoom ?? legacyLocation.room).trim();
  const safeLocationFurniture = String(input?.locationFurniture ?? legacyLocation.furniture).trim();
  const safeLocationDetail = String(input?.locationDetail ?? legacyLocation.detail).trim();
  const safeLocation = buildLocationText(
    safeLocationRoom,
    safeLocationFurniture,
    safeLocationDetail,
  );
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
    locationRoom: safeLocationRoom,
    locationFurniture: safeLocationFurniture,
    locationDetail: safeLocationDetail,
    category: safeCategory,
    quantity: safeQuantity,
    memo: safeMemo,
    imageUrl: safeImageUrl,
    createdAt: previous?.createdAt || Number(input?.createdAt) || Date.now(),
  };
}

function isValidItemForSave(item) {
  return Boolean(
    item.name &&
    item.locationRoom &&
    item.locationFurniture &&
    state.categories[item.category],
  );
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
      .filter((item) => item.name && item.locationRoom && item.locationFurniture);
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
      .map((item) => String(item.locationRoom || "").trim())
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

function getLocationFurnitureFilterOptions() {
  const filteredByRoom = state.items.filter((item) =>
    state.activeCategory === "all" || item.locationRoom === state.activeCategory,
  );

  const options = Array.from(
    new Set(
      filteredByRoom
        .map((item) => String(item.locationFurniture || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  return [{ key: "all", label: "전체" }, ...options.map((value) => ({ key: value, label: value }))];
}

function renderLocationSubFilters() {
  const enabled = state.viewMode === "location";
  $.locationSubFilters.hidden = !enabled;
  if (!enabled) {
    return;
  }

  const furnitureOptions = getLocationFurnitureFilterOptions();
  const furnitureKeys = new Set(furnitureOptions.map((option) => option.key));
  if (!furnitureKeys.has(state.activeFurnitureFilter)) {
    state.activeFurnitureFilter = "all";
  }
  $.locationFurnitureFilter.innerHTML = furnitureOptions
    .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
    .join("");
  $.locationFurnitureFilter.value = state.activeFurnitureFilter;
}

function getFilteredItems() {
  const query = state.searchQuery.toLowerCase();
  return state.items.filter((item) => {
    const optionMatched = state.viewMode === "location"
      ? (state.activeCategory === "all" || item.locationRoom === state.activeCategory)
      : (state.activeCategory === "all" || item.category === state.activeCategory);
    const furnitureMatched = state.viewMode !== "location"
      || state.activeFurnitureFilter === "all"
      || item.locationFurniture === state.activeFurnitureFilter;
    const queryMatched =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.locationRoom.toLowerCase().includes(query) ||
      item.locationFurniture.toLowerCase().includes(query) ||
      item.locationDetail.toLowerCase().includes(query);

    return optionMatched && furnitureMatched && queryMatched;
  });
}

function updateMainScrollbar() {
  const section = $.listSection;
  const track = $.mainScrollbarTrack;
  const thumb = $.mainScrollbarThumb;
  const wrapper = $.mainScrollbar;

  if (!section || !track || !thumb || !wrapper) {
    return;
  }

  const maxScroll = section.scrollHeight - section.clientHeight;
  if (maxScroll <= 0) {
    wrapper.classList.add("is-hidden");
    setCurrentThumbTop(0);
    return;
  }

  wrapper.classList.remove("is-hidden");
  const trackHeight = track.clientHeight;
  const thumbHeight = Math.max(42, Math.round((section.clientHeight / section.scrollHeight) * trackHeight));
  const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  const scrollRatio = section.scrollTop / maxScroll;
  const thumbTop = maxThumbTop * scrollRatio;

  thumb.style.height = `${thumbHeight}px`;
  setCurrentThumbTop(thumbTop);
}

function syncScrollFromThumbTop(thumbTop) {
  const section = $.listSection;
  const track = $.mainScrollbarTrack;
  const thumb = $.mainScrollbarThumb;
  if (!section || !track || !thumb) {
    return;
  }

  const maxScroll = section.scrollHeight - section.clientHeight;
  const maxThumbTop = Math.max(0, track.clientHeight - thumb.clientHeight);
  const nextThumbTop = Math.min(Math.max(0, thumbTop), maxThumbTop);
  const ratio = maxThumbTop === 0 ? 0 : nextThumbTop / maxThumbTop;
  section.scrollTop = ratio * maxScroll;
}

function renderItems() {
  const filtered = getFilteredItems();
  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const grouped = filtered.reduce((acc, item) => {
    const groupKey = state.viewMode === "location" ? item.locationRoom : item.category;
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
                  <span class="detail-label">위치</span>
                  <span class="detail-value">${escapeHtml(item.location)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">카테고리</span>
                  <span class="detail-value">${getCategoryMeta(item.category).label}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">수량</span>
                  <span class="detail-value">${item.quantity}개</span>
                </div>
                ${item.memo ? `<div class="detail-row memo"><span class="detail-label">메모</span><span class="detail-value">${escapeHtml(item.memo)}</span></div>` : ""}
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
  updateMainScrollbar();

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
    locationRoom: $.locationRoomInput.value,
    locationFurniture: $.locationFurnitureInput.value,
    locationDetail: $.locationDetailInput.value,
    category: $.categoryInput.value,
    quantity: $.quantityInput.value,
    memo: $.memoInput.value,
    imageUrl: imageInputValue,
  }, current);

  if (!isValidItemForSave(candidate)) {
    $.formError.textContent = "이름, 방, 가구, 카테고리는 필수입니다.";
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
  $.locationRoomInput.value = item.locationRoom || "거실";
  $.locationFurnitureInput.value = item.locationFurniture || "";
  $.locationDetailInput.value = item.locationDetail || "";
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
  renderRoomOptions();
  syncRoomManageInputs();
  updateNameList();
  updateLocationLists();
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

function hideUndoToast() {
  $.undoToast.hidden = true;
}

function showUndoToast(message) {
  const textEl = document.querySelector("#undoToastText");
  if (textEl) {
    textEl.textContent = message;
  }
  $.undoToast.hidden = false;
}

function finalizePendingDelete() {
  if (!state.pendingDelete) {
    return;
  }

  if (state.pendingDelete.timerId) {
    clearTimeout(state.pendingDelete.timerId);
  }

  state.pendingDelete = null;
  saveItems(state.items);
  hideUndoToast();
}

function queueDeleteItem(itemId) {
  const targetIndex = state.items.findIndex((item) => item.id === itemId);
  if (targetIndex < 0) {
    return;
  }

  finalizePendingDelete();

  const [removed] = state.items.splice(targetIndex, 1);
  renderItems();
  showUndoToast("물건이 삭제됐어요.");

  const timerId = setTimeout(() => {
    finalizePendingDelete();
  }, 5000);

  state.pendingDelete = {
    item: removed,
    index: targetIndex,
    timerId,
  };
}

function undoPendingDelete() {
  if (!state.pendingDelete) {
    return;
  }

  const { item, index, timerId } = state.pendingDelete;
  clearTimeout(timerId);
  const insertIndex = Math.min(Math.max(0, index), state.items.length);
  state.items.splice(insertIndex, 0, item);
  state.pendingDelete = null;
  saveItems(state.items);
  renderItems();
  hideUndoToast();
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
  updateMainScrollbar();
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

  $.locationFurnitureFilter.addEventListener("change", (event) => {
    state.activeFurnitureFilter = event.target.value;
    renderLocationSubFilters();
    renderItems();
  });

  $.listSection.addEventListener("scroll", updateMainScrollbar);
  window.addEventListener("resize", updateMainScrollbar);

  $.mainScrollbar.addEventListener("wheel", (event) => {
    event.preventDefault();
    $.listSection.scrollTop += event.deltaY;
    updateMainScrollbar();
  }, { passive: false });

  $.mainScrollbarTrack.addEventListener("click", (event) => {
    if (event.target === $.mainScrollbarThumb) {
      return;
    }

    const rect = $.mainScrollbarTrack.getBoundingClientRect();
    const currentThumbTop = getCurrentThumbTop();
    const nextThumbTop = event.clientY - rect.top - ($.mainScrollbarThumb.clientHeight / 2);
    if (Math.abs(nextThumbTop - currentThumbTop) > 1) {
      syncScrollFromThumbTop(nextThumbTop);
      updateMainScrollbar();
    }
  });

  $.mainScrollbarThumb.addEventListener("pointerdown", (event) => {
    scrollbarDragState.dragging = true;
    scrollbarDragState.startY = event.clientY;
    scrollbarDragState.startThumbTop = getCurrentThumbTop();
    if ($.mainScrollbarThumb.setPointerCapture) {
      $.mainScrollbarThumb.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  });

  document.addEventListener("pointermove", (event) => {
    if (!scrollbarDragState.dragging) {
      return;
    }

    const deltaY = event.clientY - scrollbarDragState.startY;
    syncScrollFromThumbTop(scrollbarDragState.startThumbTop + deltaY);
    updateMainScrollbar();
  });

  document.addEventListener("pointerup", () => {
    scrollbarDragState.dragging = false;
  });

  $.categoryChips.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.category;
    state.activeFurnitureFilter = "all";
    renderCategoryChips();
    renderLocationSubFilters();
    renderItems();
  });

  $.viewToggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-view]");
    if (!button) {
      return;
    }

    state.viewMode = button.dataset.view === "location" ? "location" : "category";
    state.activeCategory = "all";
    state.activeFurnitureFilter = "all";
    renderViewToggle();
    renderCategoryChips();
    renderLocationSubFilters();
    renderItems();
  });

  $.fabAdd.addEventListener("click", () => {
    openCreateDialog();
  });

  $.locationSettingsBtn.addEventListener("click", () => {
    renderRoomOptions();
    syncRoomManageInputs();
    $.formError.textContent = "";
    $.locationSettingsDialog.showModal();
  });

  $.closeLocationSettingsBtn.addEventListener("click", () => {
    $.locationSettingsDialog.close();
  });

  $.categorySettingsBtn.addEventListener("click", () => {
    syncCategoryManageInputs();
    $.formError.textContent = "";
    $.categorySettingsDialog.showModal();
  });

  $.closeCategorySettingsBtn.addEventListener("click", () => {
    $.categorySettingsDialog.close();
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

  $.pickUploadBtn.addEventListener("click", () => {
    $.imageUploadInput.click();
  });

  $.pickCaptureBtn.addEventListener("click", () => {
    $.imageCaptureInput.click();
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
    $.categoryManageSelect.value = key;
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

  $.categoryManageSelect.addEventListener("change", () => {
    syncCategoryManageInputs($.categoryManageSelect.value);
  });

  $.addRoomBtn.addEventListener("click", () => {
    const created = createRoom($.addRoomInput.value);
    if (!created) {
      return;
    }

    $.addRoomInput.value = "";
  });

  $.addRoomInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    $.addRoomBtn.click();
  });

  $.roomManageSelect.addEventListener("change", () => {
    syncRoomManageInputs($.roomManageSelect.value);
  });

  $.renameRoomBtn.addEventListener("click", () => {
    renameRoom($.roomManageSelect.value, $.renameRoomInput.value);
  });

  $.deleteRoomBtn.addEventListener("click", () => {
    deleteRoom($.roomManageSelect.value);
  });

  $.nameInput.addEventListener("input", updateNameList);
  $.nameInput.addEventListener("change", autoSuggestCategory);
  $.locationFurnitureInput.addEventListener("input", updateLocationLists);
  $.locationDetailInput.addEventListener("input", updateLocationLists);

  $.renameCategoryBtn.addEventListener("click", () => {
    renameCategory($.categoryManageSelect.value, $.renameCategoryInput.value);
  });

  $.deleteCategoryBtn.addEventListener("click", () => {
    deleteCategory($.categoryManageSelect.value);
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
        queueDeleteItem(itemId);
        return;
      }

      card.classList.add("is-removing");
      card.addEventListener(
        "animationend",
        () => {
          queueDeleteItem(itemId);
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

  $.undoDeleteBtn.addEventListener("click", () => {
    undoPendingDelete();
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

function getLocationSuggestions(input, field) {
  if (!input.trim()) return [];
  const query = input.toLowerCase();
  const locations = new Set(
    state.items
      .map((item) => String(item[field] || "").toLowerCase())
      .filter(Boolean),
  );
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

function updateLocationLists() {
  const furnitureSuggestions = getLocationSuggestions(
    $.locationFurnitureInput.value,
    "locationFurniture",
  );
  const detailSuggestions = getLocationSuggestions(
    $.locationDetailInput.value,
    "locationDetail",
  );

  const furnitureList = document.querySelector("#locationFurnitureList");
  const detailList = document.querySelector("#locationDetailList");
  furnitureList.innerHTML = furnitureSuggestions
    .map((value) => `<option value="${value}"></option>`)
    .join("");
  detailList.innerHTML = detailSuggestions
    .map((value) => `<option value="${value}"></option>`)
    .join("");
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
  state.rooms = loadRooms();
  state.items = loadItems();
  mergeRoomsFromItems();
  state.onboardingDismissed = loadOnboardingDismissed();
  renderCategoryChips();
  renderViewToggle();
  renderLocationSubFilters();
  renderImageMode();
  renderRoomOptions();
  syncRoomManageInputs();
  renderCategoryOptions();
  syncCategoryManageInputs();
  renderItems();
  bindEvents();
  updateMainScrollbar();
}

bootstrap();
