import { switchTypingMode, switchModeOptions } from "./main.js";

let activeMode = 0;

const menuModes = document.querySelectorAll("[menu] [menu-mode]");
const menuOptions = document.querySelectorAll("[menu-options-wrapper]");
const menuOptionsItems = document.querySelectorAll("[menu-options-item]");

menuModes.forEach((mode) =>
  mode.addEventListener("click", () => {
    document.querySelector("[menu-mode][active]").removeAttribute("active");
    mode.setAttribute("active", "");

    const option = Number(mode.getAttribute("value"));

    menuOptions.item(activeMode).removeAttribute("active");
    menuOptions.item(option).setAttribute("active", "");
    switchTypingMode(option);
    activeMode = option;
  })
);

menuOptionsItems.forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelector(`[menu-options-item][mode='${activeMode}'][active]`)
      .removeAttribute("active");
    item.setAttribute("active", "");

    const mode = Number(item.getAttribute("mode"));
    const option = Number(item.getAttribute("value"));
    switchModeOptions(mode, option);
  });
});
