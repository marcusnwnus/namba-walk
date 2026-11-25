(() => {
  const areas = window.NAMBA_STOP_FOOD;
  if (!areas) return;

  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  const externalLink = (text, url) => {
    const link = element('a', text);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  };

  const tabelogListing = (url) => url?.match(
    /^(https:\/\/tabelog\.com\/(?:osaka|kyoto)\/A\d+\/A\d+\/\d+)(?=[/?#]|$)/,
  )?.[1];

  const validRating = (rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5;

  const restaurantCard = ({ name, address, note, source, specialty, tabelog, googleMaps, googleRating, tabelogRating, tabelogShared, ratingChecked, porkMenu }, headingTag = 'h4', pick) => {
    const card = element('li');
    const heading = element(headingTag, name);
    const street = element('p', address, 'meal-address');
    heading.lang = street.lang = 'ja';
    if (pick) {
      card.classList.add('food-pick');
      const rank = element('span', pick.rank === 1 ? '首選' : `推介 ${pick.rank}`, 'food-pick-rank');
      rank.lang = 'zh-Hant-HK';
      heading.append(' ', rank);
    }
    const map = new URL('https://www.google.com/maps/search/?api=1');
    map.searchParams.set('query', `${name} ${address}`);

    const listing = tabelogListing(tabelog) ?? tabelogListing(source);
    const prefecture = address?.startsWith('京都') ? 'kyoto' : 'osaka';
    const search = new URL(`https://tabelog.com/${prefecture}/rstLst/`);
    search.searchParams.set('sk', name);
    const hasGoogleRating = validRating(googleRating);
    const hasTabelogRating = Boolean(listing) && validRating(tabelogRating);
    const tabelogLabel = hasTabelogRating
      ? `食べログ ${tabelogRating.toFixed(2)}${tabelogShared ? '（共用頁）' : ''}`
      : (ratingChecked ? '食べログ 暫未有分' : '食べログ評分');
    const links = element('div', '', 'stop-food-links');
    links.append(
      externalLink(hasGoogleRating ? `Google ${googleRating.toFixed(1)}` : 'Google 地圖', googleMaps || map.href),
      listing ? externalLink(tabelogLabel, `${listing}/`) : externalLink('查食べログ', search.href),
    );
    if (source && source.split(/[?#]/, 1)[0].replace(/\/$/, '') !== listing) {
      links.append(externalLink('店舖資料', source));
    }
    if (porkMenu?.items?.length && /^https:\/\//i.test(porkMenu.source ?? '')) {
      links.append(externalLink(porkMenu.sourceLabel || '餐牌來源', porkMenu.source));
    }
    const review = pick?.review;
    if (/^https:\/\//i.test(review ?? '') && review !== source && review.replace(/\/$/, '') !== listing) {
      links.append(externalLink('食評來源', review));
    }
    if ((hasGoogleRating || hasTabelogRating) && /^\d{4}-\d{2}-\d{2}$/.test(ratingChecked ?? '')) {
      const checked = element('time', `評分查核於 ${ratingChecked}`, 'restaurant-rating-date');
      checked.dateTime = ratingChecked;
      links.append(checked);
    }

    card.append(heading, street);
    if (pick?.reason) card.append(element('p', pick.reason, 'food-pick-reason'));
    if (specialty) {
      const featured = element('p', '', 'food-specialty');
      featured.append(element('strong', '主打'), ` ${specialty}`);
      card.append(featured);
    }
    card.append(element('p', note));
    if (porkMenu?.items?.length) {
      const menu = element('section', '', 'pork-menu');
      menu.append(element('strong', '豬肉選擇', 'pork-menu-heading'));
      porkMenu.items.forEach(({ name: itemName, details }) => {
        const item = element('div', '', 'pork-menu-item');
        const name = element('span', itemName, 'pork-menu-name');
        name.lang = 'ja';
        item.append(name, element('span', details, 'pork-menu-details'));
        menu.append(item);
      });
      if (porkMenu.note) menu.append(element('p', porkMenu.note, 'pork-menu-note'));
      card.append(menu);
    }
    card.append(links);
    return card;
  };

  window.NAMBA_RESTAURANT_CARD = restaurantCard;

  const storage = window.NAMBA_TRIP_STORAGE;
  const choiceKey = 'meal-choices';
  const placeId = (place) => place.id ?? `${place.name}\n${place.address ?? ''}`;

  const mealChoiceView = (stopId, onLayoutChange) => {
    if (!storage || !window.NAMBA_MEAL_PICKS?.[stopId]) return;

    const indicator = element('span', '', 'meal-choice-indicator');
    const selectedName = element('span');
    selectedName.lang = 'ja';
    indicator.append('已選：', selectedName);
    indicator.hidden = true;
    const buttons = [];
    let selectedId;

    const refresh = () => {
      const selected = storage.read(choiceKey, {})[stopId];
      const name = selected?.name ?? '';
      const selectionChanged = selectedId !== selected?.id || selectedName.textContent !== name;
      selectedId = selected?.id;
      if (selectionChanged) {
        selectedName.textContent = name;
        indicator.hidden = !name;
      }
      buttons.forEach(({ card, button, feedback, id, place }) => {
        const active = selectedId === id;
        const label = active ? '取消選擇' : '選呢間';
        card.classList.toggle('is-meal-choice', active);
        if (button.textContent !== label) {
          button.textContent = label;
          button.setAttribute('aria-label', `${label} ${place.name}`);
        }
        if (selectionChanged) {
          feedback.textContent = '';
          feedback.classList.remove('is-session-only');
        }
      });
      if (selectionChanged) onLayoutChange?.();
    };

    const addButton = (card, place) => {
      const id = placeId(place);
      const button = element('button', '', 'meal-choice-button');
      button.type = 'button';
      const feedback = element('p', '', 'meal-choice-status');
      feedback.setAttribute('role', 'status');
      button.addEventListener('click', () => {
        const { value, persistent } = storage.update(choiceKey, {}, (choices) => {
          const next = { ...choices };
          if (next[stopId]?.id === id) delete next[stopId];
          else next[stopId] = { id, name: place.name, address: place.address ?? '' };
          return next;
        });
        feedback.classList.toggle('is-session-only', !persistent);
        const message = value[stopId] ? '已儲存用餐選擇。' : '已取消用餐選擇。';
        feedback.textContent = persistent ? message : `${message}只限今次使用。`;
        onLayoutChange?.();
      });
      buttons.push({ card, button, feedback, id, place });
      card.append(button, feedback);
    };

    return { indicator, addButton, refresh, dispose: storage.subscribe(choiceKey, refresh) };
  };

  window.NAMBA_MEAL_CHOICE_VIEW = mealChoiceView;

  document.querySelectorAll('#itinerary [data-trip-day]').forEach((day) => {
    day.querySelectorAll(':scope > .itinerary-stops > li').forEach((stop, index) => {
      const area = areas[stop.dataset.foodArea];
      const content = stop.querySelector(':scope > .stop-content');
      if (!area?.places?.length || !content) return;

      const number = index + 1;
      const stopId = `${day.dataset.tripDay}-${number}`;
      const meal = window.NAMBA_MEAL_PICKS?.[stopId];
      const picks = new Map((meal?.picks ?? [])
        .map((pick, index) => [pick.place, { ...pick, rank: index + 1 }])
        .filter(([place]) => area.places.includes(place)));
      const places = [...picks.keys(), ...area.places.filter((place) => !picks.has(place))];
      const details = element('details', '', 'stop-food-guide');
      details.id = `day-${day.dataset.tripDay}-stop-${number}-food`;
      const summary = element('summary');
      summary.append(
        element('span', picks.size ? `${meal.meal}推介（${picks.size} 間）` : `附近食店（${area.places.length} 間）`),
        element('span', area.label, 'stop-food-area'),
      );
      const updateHeight = () => {
        if (!window.ResizeObserver) details.dispatchEvent(new Event('namba:mealsopen', { bubbles: true }));
      };
      const choice = mealChoiceView(stopId, updateHeight);
      if (choice) summary.append(choice.indicator);
      const body = element('div', '', 'stop-food-body');
      const list = element('ul', '', 'meal-options');
      list.id = `${details.id}-results`;
      list.setAttribute('role', 'list');
      const cards = places.map((place) => {
        const card = restaurantCard(place, 'h4', picks.get(place));
        choice?.addButton(card, place);
        return card;
      });
      list.append(...cards);

      const filters = element('div', '', 'stop-food-filters');
      filters.setAttribute('role', 'group');
      filters.setAttribute('aria-label', '食店類型');
      const status = element('p', `顯示 ${cards.length} 間食店`, 'stop-food-status');
      status.setAttribute('role', 'status');
      const types = new Set(area.places.flatMap((place) => place.types ?? []));
      const buttons = [null, ...types].map((type) => {
        const button = element('button', type ?? '全部', 'food-pill');
        button.type = 'button';
        button.setAttribute('aria-controls', list.id);
        button.setAttribute('aria-pressed', String(type === null));
        button.addEventListener('click', () => {
          if (button.getAttribute('aria-pressed') === 'true') return;
          buttons.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
          let visibleCount = 0;
          cards.forEach((card, placeIndex) => {
            card.hidden = type !== null && !places[placeIndex].types?.includes(type);
            if (!card.hidden) visibleCount += 1;
          });
          status.textContent = `顯示 ${visibleCount} 間食店`;
          updateHeight();
        });
        return button;
      });
      filters.append(...buttons);
      if (area.note) body.append(element('p', area.note, 'stop-food-note'));
      body.append(filters, status, list);
      details.append(summary, body);
      content.append(details);
      choice?.refresh();
    });
  });
})();
