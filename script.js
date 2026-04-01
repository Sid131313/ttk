const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    accordionItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.open = false;
      }
    });
  });
});

const tariffTabs = document.querySelectorAll(".tariffs-tab");
const tariffPanels = document.querySelectorAll(".tariffs-panel");
const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const burgerButton = document.querySelector(".header-burger");
const mobileNav = document.querySelector("#mobile-nav");
let activeModal = null;
let activeModalTrigger = null;

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
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();

      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + tariffTabs.length) % tariffTabs.length;
      const nextTab = tariffTabs[nextIndex];

      activateTariffTab(nextTab);
      nextTab.focus();
    });
  });
}

const closeActiveModal = () => {
  if (!(activeModal instanceof HTMLElement)) {
    return;
  }

  activeModal.hidden = true;

  if (!document.querySelector(".city-modal:not([hidden]), .callback-modal:not([hidden])")) {
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
  if (!(modal instanceof HTMLElement)) {
    return;
  }

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

const cityTrigger = document.querySelector(".header-city");
const cityLabel = document.querySelector(".header-city-label");
const cityModal = document.querySelector("#city-modal");
const cityModalList = document.querySelector("#city-modal-list");
const citySearchInput = document.querySelector("#city-search-input");
const cityCloseButtons = document.querySelectorAll("[data-city-close]");
const cityStorageKey = "selectedCity";
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

  const normalizeValue = (value) => value
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
    const filteredCities = cities.filter((city) => normalizeValue(city).includes(normalizeValue(cityQuery)));

    if (!filteredCities.length) {
      cityModalList.innerHTML = '<p class="city-empty">Ничего не найдено. Попробуйте изменить запрос.</p>';
      return;
    }

    cityModalList.innerHTML = groupCities(filteredCities).map(([letter, letterCities]) => `
      <section class="city-letter-group" aria-labelledby="city-letter-${letter}">
        <h3 class="city-letter-heading" id="city-letter-${letter}">${letter}</h3>
        <div class="city-letter-items">
          ${letterCities.map((city) => `
            <button class="city-option${city === selectedCity ? " is-selected" : ""}" type="button" data-city="${city}">${city}</button>
          `).join("")}
        </div>
      </section>
    `).join("");
  };

  const syncSelectedCity = () => {
    cityLabel.textContent = selectedCity || "Выбрать город";
    renderCityList();
  };

  const closeCityModal = () => {
    cityModal.hidden = true;
    if (!document.querySelector(".callback-modal:not([hidden])")) {
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
    citySearchInput.setSelectionRange(citySearchInput.value.length, citySearchInput.value.length);
  };

  cityTrigger.addEventListener("click", openCityModal);

  cityCloseButtons.forEach((button) => {
    button.addEventListener("click", closeCityModal);
  });

  cityModalList.addEventListener("click", (event) => {
    const button = event.target.closest(".city-option");

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    selectedCity = button.dataset.city || "";
    localStorage.setItem(cityStorageKey, selectedCity);
    syncSelectedCity();
    closeCityModal();
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
