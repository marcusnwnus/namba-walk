(() => {
  'use strict';

  const data = window.NAMBA_DATA;
  if (!data || !Array.isArray(data.stations) || !Array.isArray(data.places)) return;
  const $ = (selector) => document.querySelector(selector);
  const categories = { restaurant: '餐廳', convenience: '便利店', supermarket: '超市', shopping: '購物' };
  const categoryAliases = { convenience: '便利商店' };
  const categoriesJa = { restaurant: '飲食店', convenience: 'コンビニ', supermarket: 'スーパー', shopping: '買い物' };
  const icons = {
    restaurant: '<path d="M7 3v6M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9v12M16 3c-2 2-2.5 5.5-2 8h3v10M17 3v8"/>',
    convenience: '<path d="M4 9h16l-1 11H5L4 9ZM3 9l2-5h14l2 5M9 20v-6h6v6M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0"/>',
    supermarket: '<path d="M3 5h2l2 10h10l3-7H6M8 19h.01M17 19h.01"/><circle cx="8" cy="19" r="1"/><circle cx="17" cy="19" r="1"/>',
    shopping: '<path d="M5 8h14l1 13H4L5 8ZM9 8V6a3 3 0 0 1 6 0v2"/>',
    hotel: '<path d="M5 21V4h14v17M3 21h18M9 8h1M14 8h1M9 12h1M14 12h1M10 21v-5h4v5"/>',
    station: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M8 7h8M8 11h8M8 20l2-3M16 20l-2-3M8.5 14h.01M15.5 14h.01"/>'
  };
  const svg = (kind) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind] || icons.restaurant}</svg>`;
  const originSelect = $('#origin-select');
  const currentOrigin = $('#current-origin');
  const originSource = $('#origin-source');
  const origins = [...(data.hotel ? [data.hotel] : []), ...data.stations];
  const originKind = (item) => item === data.hotel ? 'hotel' : 'station';
  const search = $('#place-search');
  const clearSearch = $('#clear-search');
  const searchFeedback = $('#search-feedback');
  const searchFeedbackText = $('#search-feedback-text');
  const favoritesFilter = $('#favorites-filter');
  const favoritesCount = favoritesFilter?.querySelector('[data-count]');
  const favoritesKey = 'namba-walk:favorites';
  const favorites = new Set();
  const list = $('#places-list');
  const dialog = $('#place-detail');
  const detailContent = $('#place-detail-content');
  const explore = $('#explore');
  const mapElement = $('#map');
  const mapError = $('#map-error');
  const isMapVisible = () => Boolean(mapElement?.clientWidth && mapElement.clientHeight);
  let origin = origins.find((item) => item.id === (data.defaultOrigin || data.originStation)) || origins[0];
  let category = 'all';
  let foodStyle = 'all';
  let favoritesOnly = false;
  try {
    const savedIds = JSON.parse(window.localStorage.getItem(favoritesKey) || '[]');
    if (Array.isArray(savedIds)) {
      const saved = new Set(savedIds);
      data.places.forEach((place) => { if (saved.has(place.id)) favorites.add(place.id); });
    }
  } catch {
    // Favorites are still available for this visit if storage cannot be read.
  }
  const foodStyleTerms = {
    teppanyaki: 'teppanyaki 鐵板燒 鉄板焼 鉄板焼き',
    izakaya: 'izakaya 居酒屋',
    sushi: 'sushi 壽司 寿司 すし スシ',
    breakfast: 'breakfast 早餐 朝食 モーニング'
  };
  const hasFoodStyle = (place, style) => Array.isArray(place.foodStyle) && place.foodStyle.includes(style);
  let selectedPlace = null;
  let map = null;
  let bounds = null;
  let mapMode = 'detail';
  let lastLocalBasemap = 'detail';
  let switchLocalBasemap = null;
  let localMapAvailable = false;
  let detailTileError = false;
  const markers = new Map();
  let visiblePlaces = [];
  let selectedRoute = 'none';
  let routeLayer = null;
  let routeBounds = null;
  const routeMinZoom = 9;
  let localBounds = null;
  let shopViewport = null;
  let shopBasemap = null;
  let mapLayoutFrame = null;
  let applyRouteLimits = () => {};

  const distance = (a, b) => {
    const radians = (degrees) => degrees * Math.PI / 180;
    const dLat = radians(b[0] - a[0]);
    const dLng = radians(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  };
  const distanceLabels = (place) => {
    const metres = distance(origin.coords, place.coords);
    if (metres < 1000) {
      const rounded = Math.round(metres / 10) * 10;
      return `直線 ${rounded} 米`;
    }
    const kilometres = (metres / 1000).toFixed(1);
    return `直線 ${kilometres} 公里`;
  };
  const element = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  };
  const ja = (text, className) => {
    const node = element('span', className, text);
    node.lang = 'ja';
    return node;
  };
  const updateOrigin = () => {
    if (!origin) return;
    if (originSelect) originSelect.value = origin.id;
    if (currentOrigin) currentOrigin.textContent = origin.name;
    const currentOriginJa = $('#current-origin-ja');
    if (currentOriginJa) { currentOriginJa.textContent = origin.japanese || ''; currentOriginJa.lang = 'ja'; currentOriginJa.hidden = !origin.japanese || origin.japanese === origin.name; }
    const hotelSelected = originKind(origin) === 'hotel';
    const originAddress = $('#current-origin-address');
    if (originAddress) {
      originAddress.textContent = hotelSelected ? (origin.address || '') : '';
      originAddress.hidden = !hotelSelected || !origin.address;
    }
    document.querySelectorAll('#origin-field-icon use, #current-origin-icon use').forEach((icon) => {
      icon.setAttribute('href', hotelSelected ? '#i-hotel' : '#i-train');
    });
    if (originSource) {
      originSource.textContent = hotelSelected ? '地址來源' : '車站資訊';
      if (origin.source) { originSource.href = origin.source; originSource.hidden = false; }
      else { originSource.removeAttribute('href'); originSource.hidden = true; }
    }
    renderList();
    if (selectedPlace && dialog && dialog.open) renderDetail(selectedPlace);
  };
  const updateMarkerSelection = () => {
    markers.forEach((marker, key) => {
      const pin = marker.getElement();
      const focusedPlace = Boolean(selectedPlace && key === `place:${selectedPlace.id}`);
      const selected = key === `${originKind(origin)}:${origin.id}` || focusedPlace;
      if (key.startsWith('place:')) {
        if (focusedPlace && !marker.getTooltip()) {
          const label = element('span', 'focused-place-label-content', selectedPlace.name);
          if (selectedPlace.japanese && selectedPlace.japanese !== selectedPlace.name) label.append(ja(selectedPlace.japanese, 'focused-place-label-ja'));
          marker.bindTooltip(label, { permanent: true, direction: 'bottom', offset: [0, 4], className: 'focused-place-label', opacity: 1 });
        } else if (!focusedPlace && marker.getTooltip()) {
          marker.unbindTooltip();
        }
      }
      if (!pin) return;
      pin.classList.toggle('is-selected', Boolean(selected));
      pin.classList.toggle('is-focused-place', focusedPlace);
      if (key.startsWith('place:')) pin.setAttribute('aria-pressed', String(focusedPlace));
      marker.setZIndexOffset(focusedPlace ? 1100 : selected ? 1000 : 0);
      if (key.startsWith('station:') || key.startsWith('hotel:')) {
        pin.setAttribute('aria-pressed', String(Boolean(selected)));
        if (selected && !marker.getTooltip()) {
          const tooltip = element('span', 'origin-map-label-content', origin.label || origin.name);
          if (origin.labelJa && origin.labelJa !== (origin.label || origin.name)) tooltip.append(ja(origin.labelJa, 'origin-label-ja'));
          marker.bindTooltip(tooltip, { permanent: true, direction: 'top', offset: [0, -37], className: `origin-map-label${originKind(origin) === 'hotel' ? ' origin-map-label--hotel' : ''}`, opacity: 1 });
        } else if (!selected && marker.getTooltip()) {
          marker.unbindTooltip();
        }
      }
    });
    list?.querySelectorAll('[data-place-id]').forEach((row) => {
      if (row.dataset.placeId === selectedPlace?.id) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });
  };
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase();
  const syncMap = () => {
    if (!map) return;
    const visibleIds = new Set(visiblePlaces.map((place) => place.id));
    data.places.forEach((place) => {
      const marker = markers.get(`place:${place.id}`);
      if (!marker) return;
      if (visibleIds.has(place.id)) marker.addTo(map);
      else marker.remove();
    });
  };
  const renderList = () => {
    if (!list || !origin) return;
    const query = normalize((search?.value || '').trim());
    if (clearSearch) clearSearch.hidden = !search?.value;
    if (favoritesCount) favoritesCount.textContent = String(favorites.size);
    favoritesFilter?.setAttribute('aria-pressed', String(favoritesOnly));
    const matchesQuery = (place) => normalize([place.name, place.japanese, place.category, categories[place.category], categoryAliases[place.category], categoriesJa[place.category], place.detail, place.detailJa, place.address, ...(place.aliases || []), ...(Array.isArray(place.foodStyle) ? place.foodStyle.map((style) => foodStyleTerms[style]) : [])].filter(Boolean).join(' ')).includes(query);
    const matching = data.places.filter((place) => (!favoritesOnly || favorites.has(place.id)) && matchesQuery(place));
    document.querySelectorAll('#category-filters [data-category]').forEach((button) => {
      const type = button.dataset.category;
      const count = button.querySelector('[data-count]');
      if (count) count.textContent = String(type === 'all' ? matching.length : matching.filter((place) => place.category === type).length);
      button.classList.toggle('is-active', type === category);
      button.setAttribute('aria-pressed', String(type === category));
    });
    const foodFilters = $('#food-filters');
    if (foodFilters) foodFilters.hidden = category !== 'restaurant';
    const matchingRestaurants = matching.filter((place) => place.category === 'restaurant');
    document.querySelectorAll('#food-filters [data-food-style]').forEach((button) => {
      const style = button.dataset.foodStyle;
      const count = button.querySelector('[data-count]');
      if (count) count.textContent = String(style === 'all' ? matchingRestaurants.length : matchingRestaurants.filter((place) => hasFoodStyle(place, style)).length);
      button.classList.toggle('is-active', style === foodStyle);
      button.setAttribute('aria-pressed', String(style === foodStyle));
    });
    const places = matching.filter((place) => (category === 'all' || place.category === category)
      && (category !== 'restaurant' || foodStyle === 'all' || hasFoodStyle(place, foodStyle)))
      .sort((a, b) => distance(origin.coords, a.coords) - distance(origin.coords, b.coords));
    visiblePlaces = places;
    if (selectedPlace && !places.includes(selectedPlace)) selectedPlace = null;
    const count = $('#results-count');
    if (count) count.textContent = `${places.length} 個地點`;
    if (searchFeedback) searchFeedback.hidden = !query;
    if (searchFeedbackText) searchFeedbackText.textContent = places.length
      ? `找到 ${places.length} 個地點`
      : '找不到符合條件的地點，試試更改搜尋或篩選。';
    list.replaceChildren();
    if (!places.length) {
      const empty = element('li', 'empty-state');
      empty.textContent = '找不到符合條件的地點，試試其他關鍵字或分類。';
      if (favoritesOnly) {
        empty.textContent = favorites.size
          ? '沒有符合搜尋或分類的收藏，試試更改篩選條件。'
          : '暫時未有收藏。關閉收藏篩選，打開店舖詳情即可收藏。';
      }
      list.append(empty);
    }
    places.forEach((place) => {
      const li = element('li', 'place-item');
      const button = element('button', 'place-row');
      button.type = 'button';
      button.dataset.placeId = place.id;
      const icon = element('span', 'place-icon');
      icon.dataset.category = place.category;
      icon.innerHTML = svg(place.category);
      const text = element('span', 'place-text');
      const name = element('strong', '', place.name);
      if (favorites.has(place.id)) {
        const star = element('span', 'place-is-favorite', ' ★');
        star.setAttribute('role', 'img');
        star.setAttribute('aria-label', '已收藏');
        name.append(star);
      }
      text.append(name);
      if (place.japanese && place.japanese !== place.name) text.append(ja(place.japanese, 'place-japanese'));
      const meta = element('span', 'place-meta', place.detail);
      text.append(meta);
      const distanceEl = element('span', 'place-distance');
      distanceEl.textContent = distanceLabels(place);
      button.append(icon, text, distanceEl);
      button.addEventListener('click', () => selectPlace(place, button));
      li.append(button);
      list.append(li);
    });
    syncMap();
    updateMarkerSelection();
  };
  const renderDetail = (place) => {
    if (!detailContent) return;
    detailContent.replaceChildren();
    const categoryEl = element('p', 'detail-category', categories[place.category] || place.category);
    categoryEl.dataset.category = place.category;
    const title = element('h2', 'detail-title', place.name);
    title.id = 'detail-title';
    const japanese = element('p', 'detail-japanese', place.japanese && place.japanese !== place.name ? place.japanese : '');
    japanese.hidden = !japanese.textContent;
    japanese.lang = 'ja';
    const description = element('p', 'detail-description', place.detail || '');
    const visitNote = element('p', 'detail-visit-note');
    visitNote.textContent = place.visitNote || '';
    visitNote.hidden = !place.visitNote;
    const address = element('p', 'detail-address');
    const addressLabel = element('span', 'detail-address-label');
    addressLabel.textContent = '地址';
    address.append(addressLabel, ja(place.address || '', ''));
    const measurement = element('p', 'detail-distance', `由 ${origin.name} 出發 · ${distanceLabels(place)}`);
    const links = element('div', 'detail-links');
    const favorite = element('button', 'detail-favorite');
    favorite.type = 'button';
    favorite.setAttribute('aria-label', '收藏店舖');
    const updateFavoriteButton = () => {
      const saved = favorites.has(place.id);
      favorite.textContent = saved ? '已收藏' : '收藏店舖';
      favorite.setAttribute('aria-pressed', String(saved));
    };
    updateFavoriteButton();
    favorite.addEventListener('click', () => {
      if (favorites.has(place.id)) favorites.delete(place.id);
      else favorites.add(place.id);
      try {
        window.localStorage.setItem(favoritesKey, JSON.stringify([...favorites]));
      } catch {
        // Keep the in-memory change if storage cannot be written.
      }
      updateFavoriteButton();
      renderList();
      locate.disabled = !localMapAvailable || !visiblePlaces.includes(place);
    });
    const directions = element('a', 'detail-directions', '在 Google 地圖查看步行路線');
    const params = new URLSearchParams({ api: '1', origin: origin.directionsOrigin || origin.coords.join(','), destination: [place.japanese || place.name, place.address].filter(Boolean).join(' '), travelmode: 'walking' });
    directions.href = `https://www.google.com/maps/dir/?${params}`;
    directions.target = '_blank'; directions.rel = 'noopener noreferrer';
    const locate = element('button', 'detail-locate', '在地圖上定位');
    locate.type = 'button';
    locate.disabled = !localMapAvailable;
    locate.addEventListener('click', () => {
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
      if (mapMode === 'google') setMapMode(lastLocalBasemap);
      mapPanel?.scrollIntoView({ block: 'nearest' });
      requestAnimationFrame(() => {
        focusPlace(place);
        markers.get(`place:${place.id}`)?.getElement()?.focus({ preventScroll: true });
      });
    });
    links.append(locate, favorite, directions);
    const locateCaption = element('p', 'detail-locate-caption');
    locateCaption.textContent = '定位會切換到站內地圖。';
    locateCaption.hidden = mapMode !== 'google' || !localMapAvailable;
    if (place.source) {
      const source = element('a', 'detail-source', '查看官方資料');
      source.href = place.source; source.target = '_blank'; source.rel = 'noopener noreferrer';
      links.append(source);
    }
    detailContent.append(categoryEl, title, japanese, description, visitNote, address, measurement, links, locateCaption);
    dialog?.setAttribute('aria-labelledby', 'detail-title');
  };
  const centerPlace = (place) => {
    if (!localMapAvailable || mapMode === 'google' || selectedPlace !== place) return;
    // Wait for any zoom the user started before moving the map.
    if (map.getPane('mapPane').classList.contains('leaflet-zoom-anim')) {
      map.once('zoomend', () => centerPlace(place));
      return;
    }
    map.panTo(place.coords, { animate: false });
  };
  const focusPlace = (place) => {
    selectedPlace = place;
    updateMarkerSelection();
    centerPlace(place);
  };
  let detailTrigger = null;
  let detailPlaceId = null;
  const selectPlace = (place, trigger) => {
    focusPlace(place);
    renderDetail(place);
    if (dialog && !dialog.open) {
      detailTrigger = trigger;
      detailPlaceId = place.id;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  };
  const resetMap = () => {
    if (!map || mapMode === 'google' || !isMapVisible()) return;
    if (routeBounds) fitRoute();
    else map.fitBounds(bounds, { paddingTopLeft: [26, 67], paddingBottomRight: [45, 50], maxZoom: 17.5 });
  };
  const rememberShopViewport = () => {
    if (selectedRoute === 'none' && mapMode !== 'google' && mapLayoutFrame === null && isMapVisible()) {
      shopViewport = { center: map.getCenter(), zoom: map.getZoom() };
    }
  };
  const refreshMapLayout = () => {
    if (mapLayoutFrame !== null) cancelAnimationFrame(mapLayoutFrame);
    mapLayoutFrame = requestAnimationFrame(() => {
      const viewport = shopViewport;
      mapLayoutFrame = null;
      if (!localMapAvailable || mapMode === 'google' || !isMapVisible()) return;
      map.invalidateSize({ pan: false });
      applyRouteLimits();
      if (routeBounds) fitRoute();
      else if (viewport) map.setView(viewport.center, viewport.zoom, { animate: false });
      else resetMap();
      rememberShopViewport();
    });
  };
  const fitFoodResults = () => {
    if (!map || mapMode === 'google' || !visiblePlaces.length) return;
    const foodBounds = window.L.latLngBounds([origin.coords, ...visiblePlaces.map((place) => place.coords)]);
    map.fitBounds(foodBounds, { paddingTopLeft: [30, 70], paddingBottomRight: [46, 53], maxZoom: 17.75 });
  };
  if (originSelect) {
    originSelect.replaceChildren(...origins.map((item) => {
      const option = element('option', '', [item.label || item.name, item.labelJa || item.japanese].filter(Boolean).join(' / '));
      option.value = item.id;
      return option;
    }));
    originSelect.addEventListener('change', () => {
      origin = origins.find((item) => item.id === originSelect.value) || origin;
      updateOrigin();
    });
  }
  search?.addEventListener('input', renderList);
  clearSearch?.addEventListener('click', () => { if (search) { search.value = ''; search.focus(); renderList(); } });
  $('#view-search-results')?.addEventListener('click', () => {
    const title = $('#results-title');
    title?.focus({ preventScroll: true });
    title?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  favoritesFilter?.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    renderList();
  });
  document.querySelectorAll('#category-filters [data-category]').forEach((button) => button.addEventListener('click', () => {
    const previousCategory = category;
    category = button.dataset.category;
    renderList();
    if (foodStyle !== 'all' && category !== previousCategory) {
      if (category === 'restaurant') fitFoodResults();
      else if (previousCategory === 'restaurant') resetMap();
    }
  }));
  document.querySelectorAll('#food-filters [data-food-style]').forEach((button) => button.addEventListener('click', () => {
    foodStyle = button.dataset.foodStyle;
    renderList();
    if (foodStyle === 'all') resetMap();
    else fitFoodResults();
  }));
  dialog?.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    if (event.target.closest('[data-close-detail]') || outside) {
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    }
  });
  dialog?.addEventListener('close', () => {
    if (detailTrigger?.isConnected) return;
    const row = [...(list?.querySelectorAll('[data-place-id]') || [])].find((item) => item.dataset.placeId === detailPlaceId);
    (row || favoritesFilter)?.focus({ preventScroll: true });
  });
  updateOrigin();

  try {
    if (!window.L || !mapElement) throw new Error('Map unavailable');
    map = window.L.map('map', { zoomControl: false, scrollWheelZoom: false, minZoom: 13, maxZoom: 19, zoomSnap: 0.25, zoomDelta: 0.75 });
    map.attributionControl.setPrefix(false);
    const landmarks = (window.NAMBA_BASEMAP_LABELS || []).filter((item) => item.kind === 'landmark');
    bounds = window.L.latLngBounds([...origins, ...data.places, ...landmarks].map((item) => item.coords));
    if (isMapVisible()) resetMap();
    else map.setView(origin.coords, 15, { animate: false });
    const tiles = window.L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
      maxNativeZoom: 18, maxZoom: 19,
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer" lang="ja">国土地理院</a>'
    });
    const baseData = window.NAMBA_BASEMAP;
    const hasSimple = baseData?.type === 'FeatureCollection' && Array.isArray(baseData.features) && baseData.features.length > 0;
    let activeBasemap = null;
    let tilesLoaded = 0;
    tiles.on('loading', () => { tilesLoaded = 0; });
    tiles.on('tileload', () => { tilesLoaded += 1; detailTileError = false; if (activeBasemap === 'detail' && mapMode !== 'google' && mapError) mapError.hidden = true; });
    tiles.on('load', () => { detailTileError = !tilesLoaded; if (activeBasemap === 'detail' && mapMode !== 'google' && mapError) mapError.hidden = !detailTileError; });

    // Dedicated panes keep surfaces, road casings, fills and labels below place markers.
    [['simple-surface', 210], ['simple-casing', 220], ['simple-road', 230], ['simple-label', 350]].forEach(([name, zIndex]) => {
      const pane = map.createPane(name);
      pane.style.zIndex = zIndex;
      pane.style.pointerEvents = 'none';
    });
    let simpleLayer = null;
    if (hasSimple) {
      const geometryType = (feature) => feature.geometry?.type || '';
      const isArea = (feature) => /Polygon$/.test(geometryType(feature));
      const kind = (feature) => feature.properties?.kind;
      const baseOptions = { interactive: false };
      const surfaces = window.L.geoJSON(baseData, {
        ...baseOptions, pane: 'simple-surface',
        filter: (feature) => isArea(feature) && ['water', 'park'].includes(kind(feature)),
        style: (feature) => ({ stroke: false, fillColor: kind(feature) === 'water' ? '#c9dfe1' : '#e2e9db', fillOpacity: 1 })
      });
      const waterways = window.L.geoJSON(baseData, {
        ...baseOptions, pane: 'simple-surface',
        filter: (feature) => kind(feature) === 'water' && !isArea(feature),
        style: { color: '#c9dfe1', weight: 5, opacity: 1 }
      });
      const roadFilter = (feature) => ['main', 'street', 'path'].includes(kind(feature));
      const casing = window.L.geoJSON(baseData, {
        ...baseOptions, pane: 'simple-casing', filter: roadFilter,
        style: (feature) => ({ color: '#e2ded5', weight: ({ main: 8, street: 5, path: 3 })[kind(feature)], opacity: 1, lineCap: 'round', lineJoin: 'round' })
      });
      const roads = window.L.geoJSON(baseData, {
        ...baseOptions, pane: 'simple-road', filter: roadFilter,
        style: (feature) => ({ color: kind(feature) === 'main' ? '#fffdf7' : '#f9f7f1', weight: ({ main: 6, street: 3.5, path: 1.6 })[kind(feature)], opacity: 1, lineCap: 'round', lineJoin: 'round' })
      });
      const labels = (Array.isArray(window.NAMBA_BASEMAP_LABELS) ? window.NAMBA_BASEMAP_LABELS : [])
        .filter((label) => label && typeof label.name === 'string' && Array.isArray(label.coords) && label.coords.length === 2 && label.coords.every(Number.isFinite))
        .map((label) => {
          const labelKind = ['water', 'road', 'landmark'].includes(label.kind) ? label.kind : 'landmark';
          const text = element('span', `simple-map-label simple-map-label--${labelKind}`, label.name);
          return window.L.marker(label.coords, {
            pane: 'simple-label', interactive: false, keyboard: false,
            icon: window.L.divIcon({ className: 'simple-map-label-anchor', html: text.outerHTML, iconSize: [0, 0] })
          });
        });
      simpleLayer = window.L.layerGroup([surfaces, waterways, casing, roads, ...labels], {
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>'
      });
    }
    const suppliedBounds = window.NAMBA_BASEMAP_BOUNDS;
    localBounds = Array.isArray(suppliedBounds) && suppliedBounds.length === 2
      ? window.L.latLngBounds(suppliedBounds)
      : window.L.latLngBounds([34.655, 135.484], [34.676, 135.513]);
    const limitSimpleZoom = () => {
      if (selectedRoute !== 'none' && routeBounds) {
        map.setMinZoom(routeMinZoom);
        map.setMaxBounds(null);
        return;
      }
      map.setMinZoom(13);
      if (!isMapVisible()) return;
      const minimum = Math.max(15, map.getBoundsZoom(localBounds, true));
      if (map.getZoom() < minimum) map.setZoom(minimum, { animate: false });
      map.setMinZoom(minimum);
    };
    applyRouteLimits = () => {
      if (activeBasemap === 'simple') {
        if (selectedRoute !== 'none' && routeBounds) {
          map.setMaxBounds(null);
          map.setMinZoom(routeMinZoom);
        } else {
          limitSimpleZoom();
          map.setMaxBounds(localBounds);
        }
      } else {
        map.setMaxBounds(null);
        map.setMinZoom(selectedRoute !== 'none' ? routeMinZoom : 13);
      }
    };
    switchLocalBasemap = (requested) => {
      const next = requested === 'simple' && simpleLayer ? 'simple' : 'detail';
      if (activeBasemap === next) return;
      if (activeBasemap === 'simple') map.removeLayer(simpleLayer);
      if (activeBasemap === 'detail') map.removeLayer(tiles);
      activeBasemap = next;
      mapElement.dataset.basemap = next;
      if (mapError) mapError.hidden = true;
      if (next === 'simple') {
        limitSimpleZoom();
        if (selectedRoute === 'none') map.setMaxBounds(localBounds);
        simpleLayer.addTo(map);
      } else {
        map.setMaxBounds(null);
        map.setMinZoom(selectedRoute !== 'none' ? routeMinZoom : 13);
        tiles.addTo(map);
      }
      document.querySelectorAll('#basemap-switch [data-basemap]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.basemap === next));
        if (button.dataset.basemap === 'simple') button.disabled = !simpleLayer;
      });
    };
    mapMode = hasSimple ? 'simple' : 'detail';
    lastLocalBasemap = mapMode;
    switchLocalBasemap(mapMode);
    map.on('resize', () => { if (activeBasemap === 'simple') limitSimpleZoom(); });
    window.L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 90 }).addTo(map);
    const addMarker = (item, kind) => {
      const isOrigin = kind === 'station' || kind === 'hotel';
      const key = `${isOrigin ? kind : 'place'}:${item.id}`;
      const marker = window.L.marker(item.coords, {
        icon: window.L.divIcon({ className: `map-pin map-pin--${kind}`, html: svg(kind), iconSize: [34, 34], iconAnchor: [17, 33] }),
        title: item.japanese && item.japanese !== item.name ? `${item.name} / ${item.japanese}` : item.name, alt: item.name, keyboard: true, riseOnHover: true
      }).addTo(map);
      marker.on('click', () => {
        if (isOrigin) { origin = item; updateOrigin(); map.panTo(item.coords); }
        else selectPlace(item, marker.getElement());
      });
      const labelMarker = () => {
        marker.getElement()?.setAttribute('aria-label', `${isOrigin ? '設定出發地點' : '查看地點'}：${item.name}`);
      };
      marker.on('add', labelMarker);
      labelMarker();
      markers.set(key, marker);
    };
    origins.forEach((item) => addMarker(item, originKind(item)));
    data.places.forEach((place) => addMarker(place, place.category));
    syncMap();
    updateMarkerSelection();
    $('#zoom-in')?.addEventListener('click', () => map.zoomIn());
    $('#zoom-out')?.addEventListener('click', () => map.zoomOut());
    $('#map-reset')?.addEventListener('click', resetMap);
    localMapAvailable = true;
    rememberShopViewport();
    map.on('moveend', rememberShopViewport);
  } catch (error) {
    if (mapError) mapError.hidden = false;
    document.querySelectorAll('.map-controls button, #basemap-switch [data-basemap]:not([data-basemap="google"])').forEach((button) => { button.disabled = true; });
    console.warn('地圖載入失敗，地點清單仍可使用。', error);
  }

  const mapPanel = $('.map-panel');
  const googleView = $('#google-map-view');
  const googleFrame = $('#google-map-frame');
  const googleButton = $('#basemap-switch [data-basemap="google"]');
  if (googleButton && (!googleView || !googleFrame?.dataset.src)) googleButton.disabled = true;
  const setMapMode = (requested) => {
    const isGoogle = requested === 'google';
    if (isGoogle && (!googleView || !googleFrame?.dataset.src)) return;
    if (!isGoogle && (!localMapAvailable || !['simple', 'detail'].includes(requested))) return;
    if (isGoogle && !googleFrame.getAttribute('src')) googleFrame.src = googleFrame.dataset.src;
    const wasGoogle = mapMode === 'google';
    mapMode = requested;
    if (!isGoogle) lastLocalBasemap = requested;
    if (mapPanel) mapPanel.dataset.mapMode = requested;
    if (mapElement) mapElement.hidden = isGoogle;
    document.querySelectorAll('.map-controls, .map-legend').forEach((element) => { element.hidden = isGoogle; });
    if (googleView) googleView.hidden = !isGoogle;
    if (mapError) mapError.hidden = isGoogle || (localMapAvailable && (requested !== 'detail' || !detailTileError));
    updateRouteUI();
    if (!isGoogle) {
      if (wasGoogle) refreshMapLayout();
      switchLocalBasemap(requested);
    }
    document.querySelectorAll('#basemap-switch [data-basemap]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.basemap === requested));
    });
  };
  document.querySelectorAll('#basemap-switch [data-basemap]').forEach((button) => {
    button.addEventListener('click', () => setMapMode(button.dataset.basemap));
  });
  const routeColors = {
    'day-1': '#225d9a', 'day-2': '#8c315e', 'day-3': '#57549c', 'day-4': '#80501c',
    'day-5': '#a03e2c', 'day-6': '#31666d', airport: '#26705a', 'airport-back': '#795136'
  };
  const railLineNames = {
    'metro-m': '御堂筋線 M', 'metro-c': '中央線 C', 'metro-t': '谷町線 T',
    'keihan-main': '京阪本線', 'keihan-uji': '京阪宇治線',
    'nankai-main': '南海本線', 'nankai-airport': '南海空港線'
  };
  const routeDashPatterns = { rail: '11 8', bus: '5 5', estimated: '3 8' };
  const routeSelect = $('#route-select');
  const routeNote = $('#route-note');
  const routeFitButton = $('#route-fit');
  const railMapKey = $('#rail-map-key');
  let routeStopLayer;
  let routeStopPoints = [];
  let routeStopGrouping = '';
  const updateRouteUI = () => {
    if (mapElement) mapElement.dataset.route = selectedRoute;
    if (explore) explore.dataset.mapContext = selectedRoute === 'none' ? 'shops' : 'route';
    if (routeSelect) routeSelect.value = selectedRoute;
    const routeVisible = Boolean(routeBounds) && mapMode !== 'google';
    const segments = window.NAMBA_ROUTES?.[selectedRoute]?.segments ?? [];
    const legend = $('#route-legend');
    if (legend) {
      legend.hidden = !routeVisible;
      legend.dataset.estimated = String(segments.some((segment) => segment.kind === 'estimated'));
      legend.dataset.walk = String(segments.some((segment) => segment.kind === 'walk'));
      legend.dataset.bus = String(segments.some((segment) => segment.kind === 'bus'));
    }
    if (railMapKey) {
      const railSegments = routeVisible ? segments.filter((segment) => segment.kind === 'rail' && railLineNames[segment.line]) : [];
      const railLines = new Set(railSegments.map((segment) => segment.line));
      railMapKey.replaceChildren();
      railLines.forEach((line) => {
        const swatch = element('span', 'rail-map-line', railLineNames[line]);
        swatch.dataset.line = line;
        swatch.style.setProperty('--rail-line-color', `var(--rail-${line})`);
        railMapKey.append(swatch);
      });
      railMapKey.hidden = railLines.size === 0;
    }
    if (routeFitButton) routeFitButton.hidden = !routeVisible;
    if (routeNote) {
      routeNote.textContent = !routeVisible ? '' : mapMode === 'simple' && !localBounds.contains(routeBounds)
        ? '簡明底圖只覆蓋難波一帶，範圍以外仍可查看路線。'
        : '路線供行程參考，請以實際交通及導航為準。';
    }
  };
  const renderRouteStops = () => {
    if (!routeStopPoints.length) return;
    const groups = [];
    routeStopPoints.forEach(({ coords, visits }) => {
      const point = map.project(coords);
      const badge = visits.map(({ number }) => number).join('/');
      const spacingWidth = Math.max(32, badge.length * 7 + 12);
      const nearby = groups.find((group) => {
        const horizontalSpacing = (group.spacingWidth + spacingWidth) / 2 + 1;
        return Math.hypot((group.point.x - point.x) / horizontalSpacing, (group.point.y - point.y) / 30) < 1;
      });
      if (nearby) {
        nearby.pointCount += 1;
        nearby.visits.push(...visits);
      } else {
        groups.push({ coords, point, pointCount: 1, visits: [...visits], spacingWidth });
      }
    });

    const grouping = groups.map(({ visits }) => visits.map(({ number }) => number).join('/')).join('|');
    if (grouping === routeStopGrouping) return;
    routeStopGrouping = grouping;
    routeStopLayer.clearLayers();
    groups.forEach(({ coords, pointCount, visits }) => {
      const isGroup = pointCount > 1;
      const badge = isGroup ? `${pointCount}站` : visits.map(({ number }) => number).join('/');
      const titles = visits.sort((a, b) => a.number - b.number).map(({ stop, number }) => `${number}. ${stop.name}${stop.japanese && stop.japanese !== stop.name ? ` / ${stop.japanese}` : ''}`);
      const title = titles.join('；');
      const width = Math.max(isGroup ? 32 : 28, badge.length * 7 + 12);
      const icon = element('span', isGroup ? 'route-stop-number route-stop-number--group' : 'route-stop-number', badge);
      icon.style.backgroundColor = routeColors[selectedRoute];
      if (width > 28) icon.style.width = `${width}px`;
      const marker = window.L.marker(coords, {
        pane: 'route-stops', title, keyboard: true,
        icon: window.L.divIcon({ className: 'route-stop', html: icon.outerHTML, iconSize: [width, 28], iconAnchor: [width / 2, 14] })
      });
      const popup = element('div');
      titles.forEach((visit) => popup.append(element('div', '', visit)));
      if (isGroup) popup.append(element('p', 'route-stop-zoom-note', '放大地圖可分開查看各站。'));
      marker.bindPopup(popup);
      marker.on('add', () => marker.getElement()?.setAttribute('aria-label', title));
      routeStopLayer.addLayer(marker);
    });
  };
  const fitRoute = () => {
    if (!map || !routeBounds || mapMode === 'google' || !isMapVisible()) return;
    if (map.getPane('mapPane').classList.contains('leaflet-zoom-anim')) {
      const pendingRoute = routeBounds;
      map.once('zoomend', () => { if (routeBounds === pendingRoute) fitRoute(); });
      return;
    }
    const isDayOne = selectedRoute === 'day-1';
    map.fitBounds(routeBounds, { paddingTopLeft: [35, isDayOne ? 46 : 70], paddingBottomRight: [45, isDayOne ? 32 : 50], maxZoom: 17, animate: false });
    renderRouteStops();
  };
  const showRoute = (id) => {
    if (!localMapAvailable) return;
    const route = window.NAMBA_ROUTES?.[id];
    if (id !== 'none' && (!route || !Array.isArray(route.stops) || !Array.isArray(route.segments))) return;
    const leavingRoute = selectedRoute !== 'none' && id === 'none';
    if (selectedRoute === 'none' && id !== 'none') {
      shopBasemap = { mode: mapMode, lastLocal: lastLocalBasemap };
    }
    refreshMapLayout();
    if (routeLayer) { routeLayer.remove(); routeLayer = null; }
    routeStopLayer.clearLayers();
    routeStopPoints = [];
    routeStopGrouping = '';
    selectedRoute = id;
    routeBounds = null;
    if (id !== 'none') {
      const validCoords = (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);
      const points = [];
      const casings = [];
      const lines = [];
      route.segments.forEach((segment) => {
        const coords = (segment.coords || []).filter(validCoords);
        if (coords.length < 2) return;
        points.push(...coords);
        const dashArray = routeDashPatterns[segment.kind] || null;
        const lineCap = segment.kind === 'bus' ? 'butt' : 'round';
        const color = segment.kind === 'rail' && railLineNames[segment.line] ? `var(--rail-${segment.line})` : routeColors[id];
        const options = { pane: 'route-lines', dashArray, lineCap, interactive: false };
        casings.push(window.L.polyline(coords, { ...options, color: '#fff', weight: 8, opacity: 0.88 }));
        lines.push(window.L.polyline(coords, { ...options, color, weight: 5, opacity: 0.9 }));
      });
      const stopsByPoint = new Map();
      route.stops.forEach((stop, index) => {
        if (!validCoords(stop.coords)) return;
        points.push(stop.coords);
        const key = stop.coords.join(',');
        const visits = stopsByPoint.get(key) || [];
        visits.push({ stop, number: index + 1 });
        stopsByPoint.set(key, visits);
      });
      routeStopPoints = [...stopsByPoint.values()].map((visits) => ({ coords: visits[0].stop.coords, visits }));
      if (points.length) routeBounds = window.L.latLngBounds(points);
      routeLayer = window.L.layerGroup([...casings, ...lines]).addTo(map);
    }
    let nextBasemap = leavingRoute ? (shopBasemap?.mode || mapMode) : mapMode;
    if (id !== 'none' && nextBasemap === 'google') nextBasemap = lastLocalBasemap;
    if (routeBounds && !localBounds.contains(routeBounds) && nextBasemap === 'simple' && navigator.onLine !== false) nextBasemap = 'detail';
    if (leavingRoute && nextBasemap === 'google' && shopBasemap) lastLocalBasemap = shopBasemap.lastLocal;
    if (nextBasemap !== mapMode) setMapMode(nextBasemap);
    else updateRouteUI();
  };
  if (localMapAvailable) {
    const lines = map.createPane('route-lines');
    lines.style.zIndex = 380;
    lines.style.pointerEvents = 'none';
    const stops = map.createPane('route-stops');
    stops.style.zIndex = 620;
    routeStopLayer = window.L.layerGroup().addTo(map);
    map.on('zoomend', renderRouteStops);
  }
  if (routeSelect) {
    routeSelect.disabled = !localMapAvailable;
    routeSelect.addEventListener('change', () => {
      showRoute(routeSelect.value);
      routeSelect.value = selectedRoute;
    });
  }
  document.querySelectorAll('[data-show-route]').forEach((link) => link.addEventListener('click', () => showRoute(link.dataset.showRoute)));
  document.addEventListener('namba:viewchange', (event) => {
    if (event.detail?.view === 'map') refreshMapLayout();
  });
  routeFitButton?.addEventListener('click', fitRoute);
  updateRouteUI();
  if (localMapAvailable && mapPanel) mapPanel.dataset.mapMode = mapMode;
})();
