"use strict";

const menuCents = price => Math.round(price * 100);
const drinkProduct = product => product.section === "drinks" || freshDrinks.has(product.id);
const optionsGroup = product => drinkProduct(product) ? "drinks" : product.section;
const shotExtra = 60;
const oatExtra = 50;

function menuAlternatives(catalog, source, mode) {
  const [family, fresh, rich] = tasteProfiles[source.id];
  const sourcePrice = menuCents(source.price);
  return catalog.filter(product => product !== source && optionsGroup(product) === optionsGroup(source))
    .map(product => {
      const [match, candidateFresh, candidateRich] = tasteProfiles[product.id];
      const priceChange = menuCents(product.price) - sourcePrice;
      const difference = { fresh: candidateFresh - fresh, rich: candidateRich - rich, price: -priceChange }[mode];
      const related = Number(match === family);
      const score = mode === "price" ? -Math.abs(priceChange) : difference;
      return { product, priceChange, difference, related, score };
    })
    .filter(result => result.difference > 0)
    .sort((a, b) => b.related - a.related || b.score - a.score || Math.abs(a.priceChange) - Math.abs(b.priceChange))
    .slice(0, 3);
}

function parseBudget(value) {
  const match = /^(\d{1,4})(?:[,.](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
}

function budgetMenus(catalog, courses, amount) {
  const drinkList = catalog.filter(drinkProduct);
  const mains = catalog.filter(product => product.section === "mains");
  const desserts = catalog.filter(product => product.section === "desserts");
  const pools = { meal: [mains, drinkList], sweet: [desserts, drinkList], full: [mains, drinkList, desserts] }[courses];
  const all = pools.reduce((partial, pool) => partial.flatMap(combo => pool.map(product => ({
    products: [...combo.products, product],
    total: combo.total + menuCents(product.price),
  }))), [{ products: [], total: 0 }]);
  all.sort((a, b) => a.total - b.total);
  const affordable = all.filter(combo => combo.total <= amount);
  const first = affordable.at(-1);
  const bestDistinct = (list, combo) => list.find(entry => entry.products.every(product => !combo.products.includes(product)));
  const varied = first && (bestDistinct(affordable.slice().reverse(), first) || affordable.at(-2));
  const picks = [first, varied, affordable[0]].filter(Boolean);
  return { minimum: all[0].total, picks: [...new Set(picks)] };
}

function createMenuTools({ catalog, byId, foodPath, priceText, openProduct }) {
  const copy = {
    tr: {
      similar: "Buna benzer ama…", fresher: "Daha ferah", richer: "Daha yoğun", cheaper: "Daha uygun fiyatlı", close: "Kapat",
      similarTo: name => name + " için seçenekler", noSimilar: "Bu yönde başka bir ürün yok. Diğer seçeneklere bakabilirsin.",
      lower: price => price + " daha uygun", higher: price => price + " daha yüksek", same: "Aynı fiyat",
      budgetTitle: "Bütçene göre sofra kur", amount: "Bütçe (€)", courses: "Seçki", meal: "Ana yemek ve içecek",
      sweet: "Tatlı ve içecek", full: "Ana yemek, içecek ve tatlı", findMenu: "Sofra öner", total: "Toplam", left: "Kalan bütçe",
      invalidBudget: "Euro cinsinden bir tutar gir. Örneğin 12,50.", minimum: price => "Bu seçki için en az " + price + " gerekir.",
      customize: "İçeceğini ayarla", ice: "Buz", iceRegular: "Normal buz", iceLight: "Az buz", iceNone: "Buzsuz",
      shots: "Espresso shot", milk: "Süt seçimi", regularMilk: "Süt", oat: "Yulaf içeceği", shotCount: count => count + " shot espresso",
      showWaiter: "Garsona göster", editDrink: "Seçimi düzenle",
    },
    en: {
      similar: "Something like this, but…", fresher: "More refreshing", richer: "Richer", cheaper: "Lower price", close: "Close",
      similarTo: name => "Options similar to " + name, noSimilar: "There are no matches for this choice. Try a different option.",
      lower: price => price + " less", higher: price => price + " more", same: "Same price",
      budgetTitle: "Build a table on a budget", amount: "Budget (€)", courses: "Courses", meal: "Main and drink",
      sweet: "Dessert and drink", full: "Main, drink and dessert", findMenu: "Find a combination", total: "Total", left: "Budget left",
      invalidBudget: "Enter an amount in euros, such as 12.50.", minimum: price => "These courses start at " + price + ".",
      customize: "Customize your drink", ice: "Ice", iceRegular: "Regular ice", iceLight: "Light ice", iceNone: "No ice",
      shots: "Espresso shots", milk: "Milk choice", regularMilk: "Dairy milk", oat: "Oat drink",
      shotCount: count => count + (count === 1 ? " espresso shot" : " espresso shots"),
      showWaiter: "Show the waiter", editDrink: "Edit selections",
    },
  };
  let language = "tr";
  let source;
  let mode = "fresh";
  let budgetSubmitted = false;
  let customProduct;
  const altDialog = byId("alternatives");
  const budgetDialog = byId("budget");
  const drinkDialog = byId("drink-builder");
  const budgetInput = byId("budget-amount");
  const coursesInput = byId("budget-courses");
  const ice = byId("builder-ice");
  const shots = byId("builder-shots");
  const milk = byId("builder-milk");
  const cup = byId("drink-stage");
  const form = byId("drink-controls");
  const slip = byId("builder-slip");
  const tool = key => copy[language][key];
  const price = cents => priceText(cents / 100);

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }

  function productButton(product) {
    const button = node("button", "tool-product-name", product.name[language]);
    button.type = "button";
    button.dataset.toolProduct = product.id;
    return button;
  }

  function photo(product) {
    const image = node("img", "tool-thumb");
    image.src = foodPath(product.id);
    image.alt = "";
    image.width = 64;
    image.height = 64;
    return image;
  }

  function renderAlternatives() {
    byId("alt-source").textContent = tool("similarTo")(source.name[language]);
    const cards = menuAlternatives(catalog, source, mode).map(({ product, priceChange }) => {
      const article = node("article", "alt-card");
      const copy = node("div", "alt-copy");
      const caption = node("div", "alt-name");
      caption.append(productButton(product), node("strong", "", priceText(product.price)));
      const change = priceChange ? tool(priceChange < 0 ? "lower" : "higher")(price(Math.abs(priceChange))) : tool("same");
      copy.append(caption, node("p", "", product.detail[language]), node("span", "alt-difference", change));
      article.append(photo(product), copy);
      return article;
    });
    byId("alt-results").replaceChildren(...(cards.length ? cards : [node("p", "tool-message", tool("noSimilar"))]));
    altDialog.querySelectorAll("[data-alt-mode]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.altMode === mode));
    });
  }

  function renderBudget() {
    const amount = parseBudget(budgetInput.value);
    const message = byId("budget-message");
    const results = byId("budget-results");
    const invalid = amount === null || amount < 1;
    budgetInput.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      results.replaceChildren();
      message.textContent = tool("invalidBudget");
      message.hidden = false;
      return;
    }
    const { minimum, picks } = budgetMenus(catalog, coursesInput.value, amount);
    message.hidden = picks.length > 0;
    message.textContent = picks.length ? "" : tool("minimum")(price(minimum));
    results.replaceChildren(...picks.map(({ products, total }) => {
      const combo = node("article", "budget-card");
      const list = node("ul", "budget-items");
      products.forEach(product => {
        const item = node("li", "budget-item");
        item.append(photo(product), productButton(product), node("span", "", priceText(product.price)));
        list.append(item);
      });
      const summary = node("div", "budget-totals");
      const totalLine = node("strong", "", tool("total") + " " + price(total));
      summary.append(totalLine, node("span", "", tool("left") + " " + price(amount - total)));
      combo.append(list, summary);
      return combo;
    }));
  }

  function renderDrink() {
    const recipe = drinkRecipes[customProduct.id];
    const shotCount = recipe.shots ? Number(shots.value) : 0;
    const oat = recipe.milk && milk.value === "oat";
    const extra = recipe.shots ? shotCount - recipe.shots : 0;
    const formatted = price(menuCents(customProduct.price) + extra * shotExtra + (oat ? oatExtra : 0));
    cup.dataset.glass = recipe.glass;
    cup.dataset.ice = recipe.iced ? ice.value : "none";
    cup.dataset.milk = oat ? "oat" : "regular";
    cup.style.setProperty("--coffee-depth", (27 + extra * 11) + "%");
    byId("builder-total").textContent = formatted;
    const name = customProduct.name[language];
    byId("builder-name").textContent = name;
    byId("slip-name").textContent = name;
    byId("slip-total").textContent = formatted;
    const choices = [recipe.iced && ice.selectedOptions[0].textContent,
      recipe.shots && tool("shotCount")(shotCount), recipe.milk && tool(oat ? "oat" : "regularMilk")].filter(Boolean);
    byId("slip-options").replaceChildren(...choices.map(value => node("li", "", value)));
  }

  function drinkOptions(reset) {
    const recipe = drinkRecipes[customProduct.id];
    byId("builder-ice-row").hidden = !recipe.iced;
    byId("builder-shots-row").hidden = !recipe.shots;
    byId("builder-milk-row").hidden = !recipe.milk;
    if (recipe.shots) {
      const selected = reset ? recipe.shots : Number(shots.value);
      shots.replaceChildren(...[0, 1, 2].map(extra => {
        const count = recipe.shots + extra;
        const label = tool("shotCount")(count) + (extra ? " · +" + price(extra * shotExtra) : "");
        return new Option(label, count, false, count === selected);
      }));
    }
    const chosenMilk = reset ? "regular" : milk.value;
    milk.replaceChildren(new Option(tool("regularMilk"), "regular"), new Option(tool("oat") + " · +" + price(oatExtra), "oat"));
    milk.value = chosenMilk || "regular";
    if (reset) ice.value = "regular";
    renderDrink();
  }

  function showWaiter(show) {
    form.hidden = show;
    slip.hidden = !show;
    if (drinkDialog.open) byId(show ? "builder-edit" : "builder-show").focus();
  }

  for (const dialog of [altDialog, budgetDialog, drinkDialog]) {
    dialog.querySelector("[data-tool-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const productButton = event.target.closest("[data-tool-product]");
      if (productButton) {
        dialog.close();
        openProduct(productButton.dataset.toolProduct);
      }
    });
  }
  altDialog.querySelectorAll("[data-alt-mode]").forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.altMode;
    renderAlternatives();
  }));
  byId("open-budget").addEventListener("click", () => {
    budgetSubmitted = true;
    renderBudget();
    budgetDialog.showModal();
  });
  byId("budget-form").addEventListener("submit", event => {
    event.preventDefault();
    renderBudget();
  });
  for (const control of [ice, shots, milk]) control.addEventListener("change", renderDrink);
  byId("builder-show").addEventListener("click", () => showWaiter(true));
  byId("builder-edit").addEventListener("click", () => showWaiter(false));

  return {
    hasRecipe: id => Object.hasOwn(drinkRecipes, id),
    showAlternatives(product) {
      source = product;
      mode = ["fresh", "rich", "price"].find(option => menuAlternatives(catalog, source, option).length) || "fresh";
      renderAlternatives();
      altDialog.showModal();
    },
    buildDrink(product) {
      customProduct = product;
      showWaiter(false);
      drinkOptions(true);
      drinkDialog.showModal();
    },
    setLanguage(lang) {
      language = lang;
      document.querySelectorAll("[data-tool-copy]").forEach(element => {
        element.textContent = tool(element.dataset.toolCopy);
      });
      if (source) renderAlternatives();
      if (budgetSubmitted) renderBudget();
      if (customProduct) drinkOptions(false);
    },
  };
}
