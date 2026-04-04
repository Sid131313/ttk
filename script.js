const TARIFFS_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNzNeA4XUb7D4f2O5w8lnL2kzYbROl8K99z1odk97CTVQce2oUASaZcbFXh83zS4h8aL18RdlvfsBQ/pub?output=tsv";

/* -------------------- accordion -------------------- */
const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    accordionItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.open = false;
      }
    });
  });
});

/* -------------------- tabs -------------------- */
const tariffTabs = document.querySelectorAll(".tariffs-tab");
const tariffPanels = document.querySelectorAll(".tariffs-panel");

if (tariffTabs.length && tariffPanels.length) {
  const activateTariffTab = (nextTab) => {
    tariffTabs.forEach((tab) => {
      const isActive = tab === nextTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    tariffPanels.forEach((panel) => {
      const isActive = panel.id === nextTab.dataset.tabTarget;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  tariffTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTariffTab(tab));

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

      event.preventDefault();

      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + tariffTabs.length) % tariffTabs.length;
      const nextTab = tariffTabs[nextIndex];

      activateTariffTab(nextTab);
      nextTab.focus();
    });
  });
}

/* -------------------- mobile nav -------------------- */
const burgerButton = document.querySelector(".header-burger");
const mobileNav = document.querySelector("#mobile-nav");

if (burgerButton && mobileNav) {
  const closeMobileNav = () => {
    burgerButton.classList.remove("is-open");
    burgerButton.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  };

  burgerButton.addEventListener("click", () => {
    const isOpen = burgerButton.getAttribute("aria-expanded") === "true";
    burgerButton.classList.toggle("is-open", !isOpen);
    burgerButton.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.hidden = isOpen;
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileNav);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) {
      closeMobileNav();
    }
  });
}

/* -------------------- modals -------------------- */
const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const visibleModalSelector = ".city-modal:not([hidden]), .callback-modal:not([hidden]), .connection-modal:not([hidden])";

let activeModal = null;
let activeModalTrigger = null;

const closeActiveModal = () => {
  if (!(activeModal instanceof HTMLElement)) return;

  activeModal.hidden = true;

  if (!document.querySelector(visibleModalSelector)) {
    document.body.classList.remove("modal-open");
  }

  if (activeModalTrigger instanceof HTMLElement) {
    activeModalTrigger.setAttribute("aria-expanded", "false");
    activeModalTrigger.focus();
  }

  activeModal = null;
  activeModalTrigger = null;
};

const openModal = (modal, trigger) => {
  if (!(modal instanceof HTMLElement)) return;

  if (activeModal && activeModal !== modal) {
    closeActiveModal();
  }

  activeModal = modal;
  activeModalTrigger = trigger instanceof HTMLElement ? trigger : null;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  if (activeModalTrigger) {
    activeModalTrigger.setAttribute("aria-expanded", "true");
  }

  const focusTarget = modal.querySelector("input, button, [href], select, textarea");

  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
};

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modal = document.getElementById(trigger.dataset.modalTrigger || "");
    openModal(modal, trigger);
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeActiveModal);
});

/* -------------------- tariffs data -------------------- */
const tariffsSection = document.querySelector("#tariffs");
const comboGrid = document.querySelector("#tariff-panel-combo .tariffs-grid");
const internetGrid = document.querySelector("#tariff-panel-internet .tariffs-grid");
const tvGrid = document.querySelector("#tariff-panel-tv .tariffs-grid");

const cityStorageKey = "selectedCity";
let allTariffs = [];
let tariffsLoaded = false;

const tariffImages = {
  combo: ["img/TVI.jpg", "img/TVI.png", "img/TVI1.png"],
  internet: ["img/internet1.png", "img/internet2.png", "img/internet3.png"],
  tv: ["img/TV.png"]
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function parseTSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "\t" && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((item) => item.trim());
}

function parseTSV(tsv) {
  const lines = String(tsv || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (!lines.length) return [];

  const headers = parseTSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseTSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

function getField(row, aliases) {
  if (!row || !aliases || !aliases.length) return "";

  const normalizedAliases = aliases.map(normalizeText);

  for (const key of Object.keys(row)) {
    const normalizedKey = normalizeText(key);

    if (normalizedAliases.includes(normalizedKey)) {
      return String(row[key] || "").trim();
    }
  }

  return "";
}

function getCurrentCity() {
  return localStorage.getItem(cityStorageKey) || "";
}

function detectTariffCategory(serviceType) {
  const value = normalizeText(serviceType);

  if (!value) return null;
  if (value.includes("+")) return "combo";

  if (
    value === "шпд" ||
    (value.includes("шпд") && !value.includes("итв") && !value.includes("ктв"))
  ) {
    return "internet";
  }

  if (value.includes("итв") || value.includes("ктв")) {
    return "tv";
  }

  return null;
}

function getTariffImage(category, index) {
  const images = tariffImages[category] || [];
  if (!images.length) return "";
  return images[index % images.length];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMoney(value, suffix = "") {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return suffix ? `${clean} ${suffix}` : clean;
}

function getCategoryLabel(category) {
  if (category === "combo") return "Интернет + ТВ";
  if (category === "internet") return "Интернет";
  if (category === "tv") return "Телевидение";
  return "";
}

function getFeatureItems(row) {
  const items = [];

  const speed = getField(row, [
    "Скорость до, Мбит/с",
    "Скорость до, мбит/с",
    "Скорость, Мбит/с",
    "Скорость"
  ]);

  const channels = getField(row, [
    "Количество каналов",
    "Кол-во каналов",
    "Каналы",
    "Количество ТВ каналов"
  ]);

  if (speed) {
    items.push({
      type: "internet",
      text: `${speed} Мбит/с`
    });
  }

  if (channels) {
    items.push({
      type: "tv",
      text: `${channels} каналов`
    });
  }

  return items;
}

function renderFeatures(row) {
  const items = getFeatureItems(row);

  if (!items.length) return "";

  return `
    <ul class="promo-tariff-features">
      ${items.map((item) => `
        <li>
          <span class="promo-feature-icon" aria-hidden="true">
            ${
              item.type === "internet"
                ? `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`
                : `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"></rect><path d="M9 20h6M12 17v3M7.5 9.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>`
            }
          </span>
          <span>${escapeHtml(item.text)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function buildEquipmentGroup({ title, rentPrice, buyPrice, inputBase }) {
  const options = [];

  if (rentPrice) {
    options.push(`
      <label class="promo-equipment-option">
        <span class="promo-equipment-choice">
          <input type="checkbox" name="${escapeHtml(inputBase)}-rent">
          <span>Аренда / рассрочка</span>
        </span>
        <span class="promo-equipment-price">${escapeHtml(formatMoney(rentPrice, "руб/мес"))}</span>
      </label>
    `);
  }

  if (buyPrice) {
    options.push(`
      <label class="promo-equipment-option">
        <span class="promo-equipment-choice">
          <input type="checkbox" name="${escapeHtml(inputBase)}-buy">
          <span>Покупка</span>
        </span>
        <span class="promo-equipment-price">${escapeHtml(formatMoney(buyPrice, "руб"))}</span>
      </label>
    `);
  }

  if (!options.length) return "";

  return `
    <div class="promo-equipment-group">
      <p class="promo-equipment-title">${escapeHtml(title)}</p>
      ${options.join("")}
    </div>
  `;
}

function renderEquipment(row, slug) {
  const routerRent = getField(row, [
    "Роутер аренда",
    "Роутер, аренда",
    "Аренда роутера",
    "Аренда роутера, руб./мес.",
    "Стоимость аренды роутера",
    "Ежемесячный платеж за роутер",
    "Роутер рассрочка",
    "Роутер, рассрочка"
  ]);

  const routerBuy = getField(row, [
    "Роутер покупка",
    "Роутер, покупка",
    "Покупка роутера",
    "Покупка роутера, руб.",
    "Стоимость роутера",
    "Роутер выкуп"
  ]);

  const tvRent = getField(row, [
    "ТВ приставка аренда",
    "ТВ приставка, аренда",
    "Аренда ТВ приставки",
    "Аренда ТВ-приставки",
    "Аренда приставки",
    "Стоимость аренды ТВ приставки",
    "ТВ приставка рассрочка",
    "ТВ приставка, рассрочка"
  ]);

  const tvBuy = getField(row, [
    "ТВ приставка покупка",
    "ТВ приставка, покупка",
    "Покупка ТВ приставки",
    "Покупка ТВ-приставки",
    "Покупка приставки",
    "Стоимость ТВ приставки",
    "Стоимость приставки",
    "ТВ приставка выкуп"
  ]);

  const groups = [
    buildEquipmentGroup({
      title: "Wi-Fi роутер",
      rentPrice: routerRent,
      buyPrice: routerBuy,
      inputBase: `${slug}-router`
    }),
    buildEquipmentGroup({
      title: "ТВ приставка",
      rentPrice: tvRent,
      buyPrice: tvBuy,
      inputBase: `${slug}-tv`
    })
  ].filter(Boolean);

  if (!groups.length) return "";

  return `
    <div class="promo-tariff-equipment">
      ${groups.join("")}
    </div>
  `;
}

function renderTariffCard(row, category, index) {
  const tariffName = getField(row, [
    "Название тарифа",
    "Тариф",
    "Наименование тарифа"
  ]) || "Без названия";

  const monthPrice = getField(row, [
    "Абонентская плата месяц, руб./мес.",
    "Абонентская плата месяц, руб./мес. ",
    "Абонентская плата",
    "Ежемесячная плата"
  ]);

  const connectionPrice = getField(row, [
    "Стоимость подключения (руб.)",
    "Стоимость подключения",
    "Подключение (руб.)",
    "Подключение"
  ]);

  const note = getField(row, [
    "Примечание (кратко)",
    "Примечание (кратко) ",
    "Примечание",
    "Комментарий"
  ]);

  const categoryLabel = getCategoryLabel(category);
  const imageSrc = getTariffImage(category, index);
  const slug = slugify(tariffName || `${category}-${index}`);

  return `
    <article class="promo-tariff-card">
      <div class="promo-tariff-media">
        ${
          imageSrc
            ? `<img class="promo-tariff-image" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(tariffName)}">`
            : `<div class="promo-media-placeholder"><span>${escapeHtml(tariffName)}</span></div>`
        }
      </div>

      <div class="promo-tariff-body">
        <h3 class="promo-tariff-title">${escapeHtml(tariffName)}</h3>
        <div class="promo-tariff-category">${escapeHtml(categoryLabel)}</div>

        ${renderFeatures(row)}

        <div class="promo-tariff-price">
          <p class="price">
            ${escapeHtml(monthPrice || "—")}
            <span>руб./мес.</span>
          </p>
        </div>

        <p class="promo-tariff-connection">
          Стоимость подключения:
          ${connectionPrice ? `${escapeHtml(connectionPrice)} руб.` : "уточняйте при заявке"}
        </p>

        <details class="promo-tariff-note">
          <summary>Примечание</summary>
          <p>${escapeHtml(note || "Условия подключения уточняются по адресу.")}</p>
        </details>

        ${renderEquipment(row, slug)}

        <button
          class="button button-primary promo-tariff-button"
          type="button"
          data-connect-trigger
          data-tariff-name="${escapeHtml(tariffName)}"
          data-tariff-category="${escapeHtml(category)}"
          aria-haspopup="dialog"
          aria-controls="connection-modal"
          aria-expanded="false"
        >Подключить</button>
      </div>
    </article>
  `;
}

function renderEmptyMessage(text) {
  return `<p class="city-empty">${escapeHtml(text)}</p>`;
}

function splitTariffsByCategory(tariffs) {
  const groups = {
    combo: [],
    internet: [],
    tv: []
  };

  tariffs.forEach((row) => {
    const serviceType = getField(row, [
      "Тип услуги (ШПД/ШПД/ИТВ/КТВ/ШПД+ИТВ)",
      "Тип услуги",
      "Тип"
    ]);

    const category = detectTariffCategory(serviceType);
    if (!category) return;

    groups[category].push(row);
  });

  return groups;
}

function moveGponToEnd(items) {
  return [...items].sort((a, b) => {
    const nameA = getField(a, [
      "Название тарифа",
      "Тариф",
      "Наименование тарифа"
    ]);

    const nameB = getField(b, [
      "Название тарифа",
      "Тариф",
      "Наименование тарифа"
    ]);

    const aHasGpon = normalizeText(nameA).includes("gpon");
    const bHasGpon = normalizeText(nameB).includes("gpon");

    if (aHasGpon === bHasGpon) return 0;
    return aHasGpon ? 1 : -1;
  });
}

function filterTariffsByCity(city) {
  const normalizedCity = normalizeText(city);

  return allTariffs.filter((row) => {
    const rowCity = getField(row, [
      "Город",
      "город",
      "Населенный пункт",
      "Населённый пункт"
    ]);

    return normalizeText(rowCity) === normalizedCity;
  });
}

function renderTariffsByCity(city) {
  if (!comboGrid || !internetGrid || !tvGrid) return;

  if (!city) {
    const message = renderEmptyMessage("Выберите город, чтобы увидеть доступные тарифы.");
    comboGrid.innerHTML = message;
    internetGrid.innerHTML = message;
    tvGrid.innerHTML = message;
    return;
  }

  const cityTariffs = filterTariffsByCity(city);
  const grouped = splitTariffsByCategory(cityTariffs);

const comboTariffs = moveGponToEnd(grouped.combo);
const internetTariffs = moveGponToEnd(grouped.internet);
const tvTariffs = moveGponToEnd(grouped.tv);

comboGrid.innerHTML = comboTariffs.length
  ? comboTariffs.map((row, index) => renderTariffCard(row, "combo", index)).join("")
  : renderEmptyMessage("Для выбранного города пакетные тарифы не найдены.");

internetGrid.innerHTML = internetTariffs.length
  ? internetTariffs.map((row, index) => renderTariffCard(row, "internet", index)).join("")
  : renderEmptyMessage("Для выбранного города тарифы на интернет не найдены.");

tvGrid.innerHTML = tvTariffs.length
  ? tvTariffs.map((row, index) => renderTariffCard(row, "tv", index)).join("")
  : renderEmptyMessage("Для выбранного города тарифы на ТВ не найдены.");
}

async function loadTariffs() {
  if (!comboGrid || !internetGrid || !tvGrid) return;

  try {
    const response = await fetch(TARIFFS_TSV_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const tsv = await response.text();
    allTariffs = parseTSV(tsv);
    tariffsLoaded = true;

    renderTariffsByCity(getCurrentCity());
  } catch (error) {
    console.error("Ошибка загрузки тарифов:", error);

    const message = renderEmptyMessage("Не удалось загрузить тарифы. Попробуйте обновить страницу позже.");
    comboGrid.innerHTML = message;
    internetGrid.innerHTML = message;
    tvGrid.innerHTML = message;
  }
}

/* делегирование для чекбоксов оборудования */
if (tariffsSection) {
  tariffsSection.addEventListener("change", (event) => {
    const checkbox = event.target.closest('.promo-equipment-group input[type="checkbox"]');

    if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) {
      return;
    }

    const group = checkbox.closest(".promo-equipment-group");
    if (!group) return;

    group.querySelectorAll('input[type="checkbox"]').forEach((otherCheckbox) => {
      if (otherCheckbox !== checkbox) {
        otherCheckbox.checked = false;
      }
    });
  });
}

/* -------------------- connection modal -------------------- */
const connectionModal = document.querySelector("#connection-modal");
const connectionForm = document.querySelector("#connection-form");
const connectionCityInput = connectionForm?.querySelector('input[name="connection-city"]');
const connectionTariffInput = connectionForm?.querySelector('input[name="connection-tariff"]');
const connectionEquipment = document.querySelector("#connection-equipment");
const connectionEquipmentOptions = {
  routerRent: connectionEquipment?.querySelector(".connection-option-router-rent"),
  routerBuy: connectionEquipment?.querySelector(".connection-option-router-buy"),
  tvRent: connectionEquipment?.querySelector(".connection-option-tv-rent"),
  tvBuy: connectionEquipment?.querySelector(".connection-option-tv-buy")
};

function resetConnectionEquipment() {
  if (!connectionEquipment) return;

  Object.values(connectionEquipmentOptions).forEach((option) => {
    if (!(option instanceof HTMLElement)) return;

    option.hidden = true;

    const input = option.querySelector('input[type="checkbox"]');
    if (input instanceof HTMLInputElement) {
      input.checked = false;
    }
  });

  connectionEquipment.hidden = true;
}

function syncConnectionCity() {
  if (connectionCityInput instanceof HTMLInputElement) {
    connectionCityInput.value = getCurrentCity();
  }
}

function configureConnectionEquipment(category) {
  if (!connectionEquipment) return;

  resetConnectionEquipment();

  const showRouter = category === "internet" || category === "combo";
  const showTv = category === "tv" || category === "combo";

  if (showRouter) {
    if (connectionEquipmentOptions.routerRent instanceof HTMLElement) {
      connectionEquipmentOptions.routerRent.hidden = false;
    }
    if (connectionEquipmentOptions.routerBuy instanceof HTMLElement) {
      connectionEquipmentOptions.routerBuy.hidden = false;
    }
  }

  if (showTv) {
    if (connectionEquipmentOptions.tvRent instanceof HTMLElement) {
      connectionEquipmentOptions.tvRent.hidden = false;
    }
    if (connectionEquipmentOptions.tvBuy instanceof HTMLElement) {
      connectionEquipmentOptions.tvBuy.hidden = false;
    }
  }

  connectionEquipment.hidden = !showRouter && !showTv;
}

if (tariffsSection && connectionModal && connectionForm && connectionTariffInput) {
  tariffsSection.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-connect-trigger]");

    if (!(trigger instanceof HTMLButtonElement)) return;

    syncConnectionCity();
    connectionTariffInput.value = trigger.dataset.tariffName || "";
    configureConnectionEquipment(trigger.dataset.tariffCategory || "");
    openModal(connectionModal, trigger);
  });

  connectionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    closeActiveModal();
    connectionForm.reset();
    syncConnectionCity();
    resetConnectionEquipment();
  });

  connectionEquipment?.addEventListener("change", (event) => {
    const checkbox = event.target.closest('.connection-option input[type="checkbox"]');

    if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) return;

    const currentName = checkbox.name || "";
    const groupPrefix = currentName.includes("-")
      ? `${currentName.split("-").slice(0, -1).join("-")}-`
      : currentName;

    connectionEquipment.querySelectorAll('.connection-option input[type="checkbox"]').forEach((otherCheckbox) => {
      if (
        otherCheckbox instanceof HTMLInputElement &&
        otherCheckbox !== checkbox &&
        otherCheckbox.name.startsWith(groupPrefix)
      ) {
        otherCheckbox.checked = false;
      }
    });
  });
}

/* -------------------- city modal -------------------- */
const cityTrigger = document.querySelector(".header-city");
const cityLabel = document.querySelector(".header-city-label");
const cityModal = document.querySelector("#city-modal");
const cityModalList = document.querySelector("#city-modal-list");
const citySearchInput = document.querySelector("#city-search-input");
const cityCloseButtons = document.querySelectorAll("[data-city-close]");

const cities = [
  "Абакан", "Азов", "Алейск", "Ангарск", "Анжеро-Судженск", "Апатиты", "Арзамас", "Артемовский",
  "Астрахань", "Атамановка", "Ахтубинск", "Ачинск", "Бакал", "Балахна", "Балтийск", "Барабинск",
  "Барнаул", "Батайск", "Бачатский", "Белово", "Белогорск", "Белорецк", "Бердск", "Березники",
  "Березовский", "Биробиджан", "Благовещенск", "Бодайбо", "Большегривское", "Бор", "Борзя", "Бородино",
  "Ванино", "Вихоревка", "Владимир", "Волгодонск", "Волнино", "Вольск", "Воронеж", "Выборг",
  "Выкса", "Вычегодский", "Вятские поляны", "Глебычево", "Голубево", "Горный", "Городец", "Грамотеино",
  "Гурьевск", "Гусиноозерск", "Демьянка", "Десногорск", "Дивногорск", "Долинск", "Домна", "Донской",
  "Екатеринбург", "Елец", "Емва", "Ерофей Павлович", "Ершов", "Жасминный", "Железногорск-Илимский", "Железнодорожный",
  "Жирекен", "Забайкальск", "Заволжье", "Заозерный", "Заринск", "Зверево", "Зеленогорск", "Зима",
  "Златоуст", "Знаменск", "Зональная станция", "Иваново", "Ивняки", "Ижевск", "Инской", "Инта",
  "Иркутск", "Искитим", "Ишим", "Кадамовский", "Калининград", "Калуга", "Каменники", "Каменногорск",
  "Каменск-Шахтинский", "Камень-на-Оби", "Камышин", "Камышлов", "Карабаш", "Карасук", "Карачиха", "Карымское",
  "Касимов", "Касли", "Каучук", "Кемерово", "Кемь", "Керамкомбинат", "Кизема", "Киселевск",
  "Клены", "Ковров", "Ковылкино", "Колосовка", "Кольцово", "Комсомольск-на-Амуре", "Кондопога", "Корсаков",
  "Коряжма", "Котлас", "Кохма", "Красная Горка", "Красноармейский", "Краснодар", "Краснозатонский", "Краснокаменск",
  "Красноярск", "Красный Бор", "Красный Сулин", "Кропоткин", "Кузнечиха", "Куйбышев", "Кулунда", "Кыштым",
  "Ленинск-Кузнецкий", "Лесогорский", "Лесосибирск", "Линево", "Липецк", "Липовицы", "Лиски", "Лоскутово",
  "Луга", "Луговое", "Лузино", "Люблино", "Людиново", "Магдагачи", "Магнитогорск", "Мамоново",
  "Маркс", "Медвежьегорск", "Междуреченск", "Минусинск", "Мичуринск", "Могоча", "Мончегорск", "Мундыбаш",
  "Муром", "Мыски", "Назарово", "Нерюнгри", "Нижневартовск", "Нижний Новгород", "Нижний Тагил", "Новая Игирма",
  "Новая Усмань", "Ново-Талицы", "Новоалтайск", "Новогорный", "Новокузнецк", "Новомосковск", "Новороссийск", "Новосибирск",
  "Новочеркасск", "Новый Городок", "Обнинск", "Обь", "Озерки", "Озерск", "Октябрьский", "Оловянная",
  "Омск", "Оренбург", "Осинники", "Петров Вал", "Петрозаводск", "Печора", "Платово", "Полесье",
  "Полысаево", "Полярные Зори", "Поронайск", "Пробуждение", "Прокопьевск", "Пыть-Ях", "Реж", "Родионово-Несветайская",
  "Россошь", "Ростов-на-Дону", "Рубцовск", "Рузаевка", "Рыбинск", "Рыбное", "Рябиновка", "Рязань",
  "Салаир", "Сальск", "Самара", "Санкт-Петербург", "Саранск", "Саратов", "Саров", "Сасово",
  "Сатка", "Сафоново", "Светлый", "Светогорск", "Свободный", "Северобайкальск", "Северск", "Сегежа",
  "Сенной", "Серов", "Сковородино", "Славгород", "Смоленск", "Советская Гавань", "Советский", "Соколовый",
  "Соликамск", "Сортавала", "Сосногорск", "Средний Егорлык", "Ставрополь", "Степное", "Стерлитамак", "Сторожевка",
  "Судоверфь", "Сургут", "Сыктывкар", "Табунщиково", "Таганрог", "Тайга", "Тамбов", "Татарск",
  "Татищево", "Теплая гора", "Терентьевская", "Тинаки 2", "Тобольск", "Толмачево", "Томари", "Томск",
  "Топки", "Трусово", "Тырма", "Тюмень", "Узловая", "Улан-Удэ", "Ульяновск", "Урюпинск",
  "Усинск", "Усолье-Сибирское", "Уфа", "Ухта", "Фролово", "Хабаровск", "Хилок", "Холмск",
  "Циолковский", "Чайковский", "Чапаевск", "Чебаркуль", "Челябинск", "Черемхово", "Черногорск", "Чернушка",
  "Чернышевск", "Чита", "Чишмы", "Чудово", "Чусовой", "Шахты", "Шелехов", "Шерловая гора",
  "Шилка", "Шимановск", "Шиханы", "Шиханы-2", "Шиханы-4", "Шуя", "Щедрино", "Энгельс",
  "Юбилейный", "Югорск", "Южно-Сахалинск", "Якутск", "Яново-Грушевский", "Яровое", "Ярославль", "Ясногорск",
  "Яшкино", "п. Магистральный", "п. Механизаторов", "п. Муромский"
];

if (cityTrigger && cityLabel && cityModal && cityModalList && citySearchInput) {
  let selectedCity = localStorage.getItem(cityStorageKey) || "";
  let lastFocusedElement = null;
  let cityQuery = "";

  const normalizeValue = (value) =>
    String(value || "")
      .toLocaleLowerCase("ru-RU")
      .replace(/ё/g, "е");

  const groupCities = (items) => {
    const groups = new Map();

    items.forEach((city) => {
      const firstLetter = city[0].toLocaleUpperCase("ru-RU");

      if (!groups.has(firstLetter)) {
        groups.set(firstLetter, []);
      }

      groups.get(firstLetter).push(city);
    });

    return Array.from(groups.entries());
  };

  const renderCityList = () => {
    const filteredCities = cities.filter((city) =>
      normalizeValue(city).includes(normalizeValue(cityQuery))
    );

    if (!filteredCities.length) {
      cityModalList.innerHTML = '<p class="city-empty">Ничего не найдено. Попробуйте изменить запрос.</p>';
      return;
    }

    cityModalList.innerHTML = groupCities(filteredCities)
      .map(([letter, letterCities]) => `
        <section class="city-letter-group" aria-labelledby="city-letter-${letter}">
          <h3 class="city-letter-heading" id="city-letter-${letter}">${letter}</h3>
          <div class="city-letter-items">
            ${letterCities.map((city) => `
              <button class="city-option${city === selectedCity ? " is-selected" : ""}" type="button" data-city="${city}">
                ${city}
              </button>
            `).join("")}
          </div>
        </section>
      `)
      .join("");
  };

  const syncSelectedCity = () => {
    cityLabel.textContent = selectedCity || "Выбрать город";
    syncConnectionCity();
    renderCityList();
  };

  const closeCityModal = () => {
    cityModal.hidden = true;

    if (!document.querySelector(visibleModalSelector)) {
      document.body.classList.remove("modal-open");
    }

    cityTrigger.setAttribute("aria-expanded", "false");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  const openCityModal = () => {
    lastFocusedElement = document.activeElement;
    cityModal.hidden = false;
    document.body.classList.add("modal-open");
    cityTrigger.setAttribute("aria-expanded", "true");
    citySearchInput.focus();
    citySearchInput.setSelectionRange(
      citySearchInput.value.length,
      citySearchInput.value.length
    );
  };

  cityTrigger.addEventListener("click", openCityModal);

  cityCloseButtons.forEach((button) => {
    button.addEventListener("click", closeCityModal);
  });

  cityModalList.addEventListener("click", (event) => {
    const button = event.target.closest(".city-option");

    if (!(button instanceof HTMLButtonElement)) return;

    selectedCity = button.dataset.city || "";
    localStorage.setItem(cityStorageKey, selectedCity);
    syncSelectedCity();
    closeCityModal();

    if (tariffsLoaded) {
      renderTariffsByCity(selectedCity);
    }
  });

  citySearchInput.addEventListener("input", (event) => {
    cityQuery = event.target.value.trim();
    renderCityList();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cityModal.hidden) {
      closeCityModal();
    }
  });

  syncSelectedCity();
}

/* -------------------- global esc -------------------- */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && burgerButton && mobileNav && !mobileNav.hidden) {
    burgerButton.classList.remove("is-open");
    burgerButton.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
    burgerButton.focus();
    return;
  }

  if (event.key === "Escape" && activeModal) {
    closeActiveModal();
  }
});

/* -------------------- init tariffs -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadTariffs();
});
