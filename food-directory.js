(() => {
  const daySelect = document.getElementById('food-directory-day');
  const stopSelect = document.getElementById('food-directory-stop');
  const typeSelect = document.getElementById('food-directory-type');
  const sortSelect = document.getElementById('food-directory-sort');
  const status = document.getElementById('food-directory-status');
  const results = document.getElementById('food-directory-results');
  const restaurantCard = window.NAMBA_RESTAURANT_CARD;
  if (!daySelect || !stopSelect || !typeSelect || !status || !results) return;

  const storage = window.NAMBA_TRIP_STORAGE;
  const preferencesKey = 'food-directory-preferences';
  const areas = window.NAMBA_STOP_FOOD ?? {};
  const panels = Array.from(document.querySelectorAll('#itinerary [data-trip-day]'));
  const days = panels.map((panel) => panel.dataset.tripDay);
  const stops = panels.flatMap((panel) => {
    const day = panel.dataset.tripDay;
    return Array.from(panel.querySelectorAll(':scope > .itinerary-stops > li'), (stop, index) => {
      const heading = stop.querySelector(':scope > .stop-content > h3')?.cloneNode(true);
      heading?.querySelectorAll('.ja').forEach((translation) => translation.remove());
      const number = index + 1;
      const title = heading?.textContent.replace(/\s+/g, ' ').trim();
      return {
        day,
        id: `${day}-${number}`,
        label: title ? `第 ${number} 站 · ${title}` : `第 ${number} 站`,
        places: areas[stop.dataset.foodArea]?.places ?? [],
      };
    });
  });

  let restaurants = [];
  let filtersChanged = false;
  let choice;
  const placeKey = (place) => place.id ?? `${place.name}\n${place.address ?? ''}`;
  const choiceInfo = document.createElement('div');
  choiceInfo.className = 'food-directory-choice';
  results.before(choiceInfo);

  const fillOptions = (select, allLabel, options, selected = select.value) => {
    select.replaceChildren(new Option(allLabel, ''), ...options.map(([value, label]) => new Option(label, value)));
    if (options.some(([value]) => value === selected)) select.value = selected;
  };

  const renderResults = () => {
    choice?.dispose();
    choice = window.NAMBA_MEAL_CHOICE_VIEW?.(stopSelect.value);
    choiceInfo.replaceChildren();
    if (choice) choiceInfo.append(choice.indicator);
    const type = typeSelect.value;
    const matches = restaurants.filter((restaurant) => !type || restaurant.types.has(type));
    const ratingField = sortSelect?.value;
    if (ratingField) {
      const ratingOf = ({ place }) => {
        const rating = place[ratingField];
        return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0;
      };
      matches.sort((a, b) => ratingOf(b) - ratingOf(a));
    }
    const cards = matches.map(({ place, types, nearby, pick }) => {
      const card = restaurantCard(place, 'h2', pick);
      if (types.size) {
        const category = document.createElement('p');
        category.className = 'food-directory-category';
        category.textContent = Array.from(types).join(' · ');
        card.firstElementChild.after(category);
      }

      const stations = document.createElement('div');
      stations.className = 'food-directory-stations';
      nearby.forEach((dayStops, day) => {
        const line = document.createElement('p');
        const dayLabel = document.createElement('strong');
        dayLabel.textContent = `Day ${day}`;
        line.append(dayLabel, ` ${Array.from(dayStops, (stop) => stop.label).join(' ／ ')}`);
        stations.append(line);
      });
      card.lastElementChild.before(stations);
      choice?.addButton(card, place);
      return card;
    });
    results.replaceChildren(...cards);
    choice?.refresh();
    status.textContent = cards.length ? `顯示 ${cards.length} 間食店` : '目前篩選條件下未有食店資料。';
  };

  const updateTypes = (selectedType) => {
    const matches = new Map();
    const availableTypes = new Set();
    const meal = window.NAMBA_MEAL_PICKS?.[stopSelect.value];
    const picks = new Map((meal?.picks ?? []).map((pick, index) => [placeKey(pick.place), { ...pick, rank: index + 1 }]));
    stops.forEach((stop) => {
      if (daySelect.value && stop.day !== daySelect.value) return;
      if (stopSelect.value && stop.id !== stopSelect.value) return;
      stop.places.forEach((place) => {
        if (!place?.name) return;
        const key = placeKey(place);
        if (!matches.has(key)) matches.set(key, { place, types: new Set(), nearby: new Map(), pick: picks.get(key) });
        const restaurant = matches.get(key);
        for (const type of place.types ?? []) {
          restaurant.types.add(type);
          availableTypes.add(type);
        }
        if (!restaurant.nearby.has(stop.day)) restaurant.nearby.set(stop.day, new Set());
        restaurant.nearby.get(stop.day).add(stop);
      });
    });
    restaurants = Array.from(matches.values());
    if (picks.size) {
      const afterPicks = meal.picks.length + 1;
      restaurants.sort((a, b) => (a.pick?.rank ?? afterPicks) - (b.pick?.rank ?? afterPicks));
    }
    const options = Array.from(availableTypes).sort((a, b) => a.localeCompare(b, 'zh-HK'));
    fillOptions(typeSelect, '全部類型', options.map((type) => [type, type]), selectedType);
    renderResults();
  };

  const updateStops = (selectedStop, selectedType) => {
    const day = daySelect.value;
    const options = stops.filter((stop) => !day || stop.day === day).map((stop) => [
      stop.id,
      day ? stop.label : `Day ${stop.day} · ${stop.label}`,
    ]);
    fillOptions(stopSelect, day ? '該日全部站點' : '全部站點', options, selectedStop);
    updateTypes(selectedType);
  };

  const savePreferences = () => {
    const snapshot = {};
    if (sortSelect) snapshot.sort = sortSelect.value;
    if (filtersChanged) {
      snapshot.day = daySelect.value;
      snapshot.stop = stopSelect.value;
      snapshot.type = typeSelect.value;
    }
    storage?.update(preferencesKey, {}, () => snapshot);
  };

  fillOptions(daySelect, '全部日子', days.map((day) => [day, `Day ${day}`]));
  if (!restaurantCard) {
    daySelect.disabled = stopSelect.disabled = typeSelect.disabled = true;
    if (sortSelect) sortSelect.disabled = true;
    status.textContent = '目前未有食店資料。';
    return;
  }

  const { day, stop, type, sort } = storage?.read(preferencesKey, {}) ?? {};
  filtersChanged = day === '' || days.includes(day);
  daySelect.value = filtersChanged ? day : (days[0] ?? '');
  if (sortSelect) {
    const validSort = Array.from(sortSelect.options).some(({ value }) => value === sort);
    sortSelect.value = validSort ? sort : '';
  }
  updateStops(filtersChanged ? stop : '', filtersChanged ? type : '');

  [[daySelect, updateStops], [stopSelect, updateTypes], [typeSelect, renderResults]].forEach(([select, update]) => {
    select.addEventListener('change', () => {
      filtersChanged = true;
      update();
      savePreferences();
    });
  });
  sortSelect?.addEventListener('change', () => {
    renderResults();
    savePreferences();
  });

  document.addEventListener('namba:destinationchange', ({ detail: { day } }) => {
    if (filtersChanged || daySelect.value === day || !days.includes(day)) return;
    daySelect.value = day;
    updateStops();
  });
})();
