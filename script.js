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
