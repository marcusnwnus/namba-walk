(() => {
  const daySelect = document.getElementById('shopping-day');
  const categorySelect = document.getElementById('shopping-category');
  const status = document.getElementById('shopping-status');
  const results = document.getElementById('shopping-results');
  if (!daySelect || !categorySelect || !status || !results) return;

  const recommendationLevel = (stars) => Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : 0;
  const items = [...(window.NAMBA_SHOPPING_ITEMS ?? [])];
  items.sort((a, b) => a.day - b.day || a.stop - b.stop || recommendationLevel(b.stars) - recommendationLevel(a.stars));

  const element = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
  };

  const ratingGuide = element('p', '5 星首選、4 星值得試、3 星順路備選。星級按商品特色、位置同即食或送禮便利度編排。', 'shopping-rating-guide');
  status.after(ratingGuide);

  const setupChecklist = () => {
    const section = document.getElementById('shopping-checklist');
    const storage = window.NAMBA_TRIP_STORAGE;
    if (!section || !storage) return;

    const key = 'shopping-checklist';
    const rows = new Map();
    const recommendationNames = new Map(items.map(({ id, name }) => [`recommendation:${id}`, name]));
    let entryIds = new Set();
    const viewChecklist = document.querySelector('.shopping-view-checklist');

    const heading = element('h2', '購物清單');
    heading.id = 'shopping-checklist-title';
    heading.tabIndex = -1;
    const summary = element('p', '', 'shopping-checklist-summary');
    summary.setAttribute('role', 'status');
    const form = element('form', '', 'shopping-checklist-form');
    const label = element('label', '自訂商品');
    label.htmlFor = 'shopping-checklist-item';
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.type = 'text';
    input.required = true;
    input.autocomplete = 'off';
    input.enterKeyHint = 'done';
    const submit = element('button', '加入', 'shopping-checklist-submit');
    submit.type = 'submit';
    form.append(label, input, submit);

    const warning = element('p', '', 'shopping-checklist-warning');
    warning.hidden = true;
    warning.setAttribute('role', 'status');
    const empty = element('p', '清單暫時未有商品。', 'shopping-checklist-empty');
    const list = element('ul', '', 'shopping-checklist-items');
    list.setAttribute('role', 'list');
    section.append(heading, summary, form, warning, empty, list);

    if (viewChecklist) {
      document.addEventListener('namba:viewchange', (event) => {
        const isShopping = event.detail.view === 'shopping';
        viewChecklist.hidden = !isShopping;
        document.body.classList.toggle('shopping-active', isShopping);
      });
      viewChecklist.addEventListener('click', () => {
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }

    const entriesFrom = (value) => Array.isArray(value)
      ? value.filter((entry) => typeof entry?.id === 'string' && typeof entry.name === 'string')
      : [];

    const update = (transform) => {
      const { persistent } = storage.update(key, [], (value) => transform(entriesFrom(value)));
      warning.hidden = persistent;
      if (!persistent) warning.textContent = '無法儲存購物清單。重新開啟後，今次改動可能會消失。';
    };

    const makeRow = ({ id, name, shop, area }) => {
      const row = element('li', '', 'shopping-checklist-row');
      const mark = element('label', '', 'shopping-checklist-mark');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      const text = element('span', '', 'shopping-checklist-text');
      text.append(element('span', name, 'shopping-checklist-name'));
      if (shop || area) {
        const context = element('span', area || '', 'shopping-checklist-context');
        if (shop) {
          const shopName = element('span', shop);
          shopName.lang = 'ja';
          if (area) context.append(' · ');
          context.append(shopName);
        }
        text.append(context);
      }
      mark.append(checkbox, text);
      checkbox.addEventListener('change', () => {
        const checked = checkbox.checked;
        update((entries) => entries.map((entry) => entry.id === id ? { ...entry, checked } : entry));
      });

      const remove = element('button', '移除', 'shopping-checklist-remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `移除 ${name}`);
      remove.addEventListener('click', () => {
        const restoreFocus = row.contains(document.activeElement);
        const nextRow = row.nextElementSibling ?? row.previousElementSibling;
        const nextRemove = nextRow?.querySelector('button');
        update((entries) => entries.filter((entry) => entry.id !== id));
        if (restoreFocus) (nextRemove?.isConnected ? nextRemove : input).focus();
      });
      row.append(mark, remove);
      return { row, checkbox };
    };

    const updateRecommendationButton = (button) => {
      const id = button.dataset.checklistId;
      const added = entryIds.has(id);
      const action = added ? '已加入' : '加入清單';
      button.textContent = action;
      button.setAttribute('aria-label', `${action} · ${recommendationNames.get(id)}`);
      button.setAttribute('aria-disabled', String(added));
    };

    const render = () => {
      const entries = entriesFrom(storage.read(key, []));
      entryIds = new Set(entries.map(({ id }) => id));
      for (const [id, { row }] of rows) {
        if (entryIds.has(id)) continue;
        row.remove();
        rows.delete(id);
      }
      entries.forEach((entry, index) => {
        if (!rows.has(entry.id)) rows.set(entry.id, makeRow(entry));
        const { row, checkbox } = rows.get(entry.id);
        checkbox.checked = Boolean(entry.checked);
        row.classList.toggle('is-checked', checkbox.checked);
        if (list.children[index] !== row) list.insertBefore(row, list.children[index] ?? null);
      });

      const checkedCount = entries.filter((entry) => entry.checked).length;
      if (viewChecklist) viewChecklist.textContent = `查看清單 · 待買 ${entries.length - checkedCount}`;
      const counts = `${entries.length} 項商品 · 已勾選 ${checkedCount} 項`;
      if (summary.textContent !== counts) summary.textContent = counts;
      empty.hidden = entries.length > 0;
      list.hidden = !entries.length;
      results.querySelectorAll('[data-checklist-id]').forEach(updateRecommendationButton);
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = input.value.trim();
      input.value = '';
      if (!name) {
        input.reportValidity();
        return;
      }
      const suffix = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const entry = { id: `custom:${suffix}`, name, checked: false };
      update((entries) => [...entries, entry]);
    });

    storage.subscribe(key, render);
    render();

    const makeRecommendationButton = ({ id, name, area, shop }) => {
      const entry = { id: `recommendation:${id}`, name, area, shop, checked: false };
      const button = element('button', '', 'shopping-add-recommendation');
      button.type = 'button';
      button.dataset.checklistId = entry.id;
      updateRecommendationButton(button);
      button.addEventListener('click', () => {
        if (button.getAttribute('aria-disabled') === 'true') return;
        update((entries) => entries.some(({ id }) => id === entry.id) ? entries : [...entries, entry]);
      });
      return button;
    };

    return { makeRecommendationButton };
  };

  const checklist = setupChecklist();

  const addLink = (container, label, url, itemName) => {
    if (!String(url).startsWith('https://')) return;
    const link = element('a', label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${label} · ${itemName}`);
    container.append(link);
  };

  const makeCard = (item) => {
    const { name, category, day, stop, area, shop, address, note, source, productSource, hkSource, stars } = item;
    const card = document.createElement('li');
    const title = element('h2', name);
    const location = element('p', `Day ${day} · 第 ${stop} 站附近 · ${area}`, 'shopping-location');
    const metadata = element('div', '', 'shopping-metadata');
    metadata.append(element('p', category, 'shopping-category'));
    const level = recommendationLevel(stars);
    if (level) {
      const rating = element('p', '', 'shopping-rating');
      rating.setAttribute('role', 'img');
      rating.setAttribute('aria-label', `推薦 ${level} 星，滿分 5 星`);
      rating.append('推薦', element('span', '★'.repeat(level) + '☆'.repeat(5 - level), 'shopping-rating-stars'));
      metadata.append(rating);
    }
    const details = document.createElement('div');
    details.className = 'shopping-store';
    details.lang = 'ja';
    details.append(element('p', shop, 'shopping-store-name'), element('p', address, 'shopping-address'));

    const links = document.createElement('div');
    links.className = 'shopping-links';
    const map = new URL('https://www.google.com/maps/search/?api=1');
    map.searchParams.set('query', `${shop} ${address}`);
    addLink(links, 'Google 地圖', map, name);
    addLink(links, '官方資料', source, name);
    if (productSource && productSource !== source) addLink(links, '產品資料', productSource, name);
    if (hkSource) addLink(links, '香港攻略', hkSource, name);

    card.append(title, location, metadata, details);
    if (note) card.append(element('p', note, 'shopping-note'));
    card.append(links);
    if (checklist) card.append(checklist.makeRecommendationButton(item));
    return card;
  };

  const rowsForDay = () => items.filter(({ day }) => !daySelect.value || String(day) === daySelect.value);

  const renderResults = () => {
    const category = categorySelect.value;
    const matches = rowsForDay().filter((item) => !category || item.category === category);
    results.replaceChildren(...matches.map(makeCard));
    status.textContent = matches.length ? `顯示 ${matches.length} 項購物推薦` : '目前未有購物推薦。';
    ratingGuide.hidden = !matches.some((item) => recommendationLevel(item.stars));
  };

  const updateCategories = () => {
    const previous = categorySelect.value;
    const categories = Array.from(new Set(rowsForDay().map(({ category }) => category)));
    categories.sort((a, b) => a.localeCompare(b, 'zh-HK'));
    categorySelect.replaceChildren(new Option('全部類型', ''), ...categories.map((category) => new Option(category)));
    if (categories.includes(previous)) categorySelect.value = previous;
    categorySelect.disabled = !categories.length;
    renderResults();
  };

  const days = Array.from(new Set(items.map(({ day }) => day)));
  daySelect.replaceChildren(new Option('全部日子', ''), ...days.map((day) => new Option(`Day ${day}`, day)));
  daySelect.disabled = !days.length;
  daySelect.addEventListener('change', updateCategories);
  categorySelect.addEventListener('change', renderResults);
  updateCategories();
})();
