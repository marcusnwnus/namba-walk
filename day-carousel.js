(() => {
  const itinerary = document.getElementById('itinerary');
  if (!itinerary || typeof window.createNambaDayMap !== 'function') return;

  const narrowScreen = window.matchMedia('(max-width: 750px)');
  const selectedStops = new WeakMap();
  const stopSummary = document.createElement('section');
  stopSummary.className = 'day-stop-summary';
  stopSummary.setAttribute('aria-label', '目前站點摘要');
  stopSummary.innerHTML = `
    <p class="day-stop-summary-time"></p>
    <h3 class="day-stop-summary-title"></h3>
    <p class="day-stop-summary-action"></p>`;
  const summaryTime = stopSummary.querySelector('.day-stop-summary-time');
  const summaryTitle = stopSummary.querySelector('.day-stop-summary-title');
  const summaryAction = stopSummary.querySelector('.day-stop-summary-action');

  const mapPanel = document.createElement('section');
  mapPanel.className = 'day-route-panel';
  mapPanel.setAttribute('aria-labelledby', 'day-route-title');
  mapPanel.innerHTML = `
    <div class="day-map-toolbar">
      <h3 id="day-route-title">行程地圖</h3>
      <div class="day-map-actions">
        <div class="day-map-modes" role="group" aria-label="行程地圖模式">
          <button type="button" data-day-map-mode="google" aria-controls="day-map-google" aria-pressed="true">Google 地圖</button>
          <button type="button" data-day-map-mode="route" aria-controls="day-map-local" aria-pressed="false">行程路線</button>
        </div>
        <button type="button" class="day-map-size" aria-controls="day-map-google day-map-local" aria-expanded="false" aria-label="放大行程地圖" title="放大行程地圖">放大</button>
      </div>
    </div>
    <div id="day-map-google" class="day-map-viewport">
      <iframe class="day-google-frame" title="行程站點的 Google 地圖" loading="lazy" referrerpolicy="no-referrer" allow="geolocation 'none'" allowfullscreen></iframe>
      <p class="day-google-empty" role="status" hidden>這個停留點未有地圖位置。</p>
    </div>
    <div id="day-map-local" hidden>
      <div class="day-map-viewport">
        <div id="day-route-map" role="region" aria-label="當日路線地圖"></div>
        <button type="button" class="day-map-fit" aria-controls="day-route-map" disabled>
          <svg class="icon" aria-hidden="true"><use href="#i-target"/></svg>顯示全程
        </button>
      </div>
      <p class="day-map-note" role="status" hidden></p>
    </div>`;

  const sizeButton = mapPanel.querySelector('.day-map-size');
  const googleButton = mapPanel.querySelector('[data-day-map-mode="google"]');
  const routeButton = mapPanel.querySelector('[data-day-map-mode="route"]');
  const googleView = mapPanel.querySelector('#day-map-google');
  const routeView = mapPanel.querySelector('#day-map-local');
  const googleFrame = googleView.querySelector('iframe');
  const googleEmpty = googleView.querySelector('.day-google-empty');

  const carousel = document.createElement('section');
  carousel.className = 'day-carousel';
  carousel.setAttribute('aria-labelledby', 'day-carousel-title');
  carousel.innerHTML = `
    <header class="day-carousel-toolbar">
      <h3 id="day-carousel-title">行程站點</h3>
      <a class="day-carousel-meals" data-open-meals hidden>附近食店</a>
      <div class="day-carousel-controls">
        <button type="button" class="day-carousel-prev" aria-label="上一站" aria-controls="day-carousel-track">
          <svg class="icon" aria-hidden="true"><use href="#i-down"/></svg>
        </button>
        <output class="day-carousel-position" aria-live="polite" aria-atomic="true">
          <span class="day-carousel-count" aria-hidden="true"></span><span class="day-carousel-sr"></span>
        </output>
        <button type="button" class="day-carousel-next" aria-label="下一站" aria-controls="day-carousel-track">
          <svg class="icon" aria-hidden="true"><use href="#i-down"/></svg>
        </button>
      </div>
    </header>`;

  const mealsLink = carousel.querySelector('.day-carousel-meals');
  const previousButton = carousel.querySelector('.day-carousel-prev');
  const nextButton = carousel.querySelector('.day-carousel-next');
  const count = carousel.querySelector('.day-carousel-count');
  const announcement = carousel.querySelector('.day-carousel-sr');
  let active;
  let map;
  let preferRouteMap = false;
  let googleUpdateTimer;
  let scrollBeforeExpansion = null;
  let scrollFrame = 0;

  const setMapExpanded = (expanded) => {
    const label = expanded ? '還原' : '放大';
    const title = `${label}行程地圖`;
    mapPanel.classList.toggle('is-expanded', expanded);
    sizeButton.textContent = label;
    sizeButton.title = title;
    sizeButton.setAttribute('aria-label', title);
    sizeButton.setAttribute('aria-expanded', String(expanded));
  };

  const collapseMap = (restoreScroll) => {
    if (scrollBeforeExpansion === null) return;
    const previousScroll = scrollBeforeExpansion;
    scrollBeforeExpansion = null;
    setMapExpanded(false);
    if (restoreScroll) window.scrollTo({ top: previousScroll, behavior: 'instant' });
  };

  sizeButton.addEventListener('click', () => {
    if (scrollBeforeExpansion !== null) {
      collapseMap(true);
      return;
    }
    scrollBeforeExpansion = window.scrollY;
    setMapExpanded(true);
    mapPanel.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || scrollBeforeExpansion === null) return;
    event.preventDefault();
    collapseMap(true);
    sizeButton.focus({ preventScroll: true });
  });

  const stopTitle = (card) => {
    const heading = card.querySelector('h3');
    if (!heading) return '';
    return Array.from(heading.childNodes)
      .filter((node) => !node.classList?.contains('ja'))
      .map((node) => node.textContent).join('').trim() || heading.textContent.trim();
  };

  const stopAction = (card) => {
    const content = card.querySelector('.stop-content');
    const heading = content?.querySelector('h3');
    if (!heading) return '';
    for (let node = heading.nextElementSibling; node; node = node.nextElementSibling) {
      if (node.matches('.rail-legs')) {
        const leg = node.querySelector('.rail-leg');
        if (!leg) continue;
        const header = leg.querySelector('.rail-leg-header')?.textContent;
        const journey = leg.querySelector('.rail-journey')?.textContent;
        return [header, journey].filter(Boolean).join(' · ').replace(/\s+/g, ' ').trim();
      }
      if (node.matches('p:not(.stop-address):not(.stop-time)')) {
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (text) return text.match(/^[^。！？]+[。！？]?/)?.[0] || text;
      }
    }
    return '';
  };

  const mapPoint = (card, title) => {
    const reference = card.dataset.mapPoint?.match(/^([^:]+):(\d+)$/);
    if (!reference) return null;
    return { routeId: reference[1], stopIndex: Number(reference[2]), title };
  };

  const showGoogleStop = (immediate) => {
    clearTimeout(googleUpdateTimer);
    const point = active.points[active.index];
    const coords = window.NAMBA_ROUTES?.[point?.routeId]?.stops?.[point?.stopIndex]?.coords;
    const hasLocation = Array.isArray(coords) && coords.length === 2 && coords.every(Number.isFinite);
    googleFrame.hidden = !hasLocation;
    googleEmpty.hidden = hasLocation;
    if (!hasLocation) return;

    const params = new URLSearchParams({ q: coords.join(','), z: '16', hl: 'zh-TW', output: 'embed' });
    const src = `https://maps.google.com/maps?${params}`;
    const loadStop = () => {
      googleFrame.title = `${point.title}的 Google 地圖`;
      if (googleFrame.getAttribute('src') !== src) googleFrame.src = src;
    };
    if (immediate || !googleFrame.hasAttribute('src')) loadStop();
    else googleUpdateTimer = setTimeout(loadStop, 180);
  };

  const showMapMode = () => {
    if (!active) return;
    const offline = navigator.onLine === false;
    const useRouteMap = offline || preferRouteMap;
    const routeWasVisible = !routeView.hidden;
    googleButton.disabled = offline;
    googleButton.setAttribute('aria-pressed', String(!useRouteMap));
    routeButton.setAttribute('aria-pressed', String(useRouteMap));
    googleView.hidden = useRouteMap;
    routeView.hidden = !useRouteMap;

    if (useRouteMap) {
      clearTimeout(googleUpdateTimer);
      if (routeWasVisible) return;
      map ??= window.createNambaDayMap({
        element: mapPanel.querySelector('#day-route-map'),
        fitButton: mapPanel.querySelector('.day-map-fit'),
        note: mapPanel.querySelector('.day-map-note'),
        onStopSelect: scrollToStop,
      });
      map.show(active.points, active.index);
    } else {
      showGoogleStop(true);
    }
  };

  googleButton.addEventListener('click', () => {
    if (!googleView.hidden) return;
    preferRouteMap = false;
    showMapMode();
  });
  routeButton.addEventListener('click', () => {
    preferRouteMap = true;
    if (routeView.hidden) showMapMode();
  });
  window.addEventListener('offline', showMapMode);
  window.addEventListener('online', showMapMode);

  const sizeTrack = () => {
    if (!active) return;
    const { track, cards, index } = active;
    const height = Math.ceil(cards[index].getBoundingClientRect().height);
    if (height) track.style.setProperty('--day-card-height', `${height}px`);
  };

  const sizeObserver = window.ResizeObserver && new window.ResizeObserver(sizeTrack);
  // Resize before a shortcut scrolls to a newly opened guide inside the track.
  carousel.addEventListener('namba:mealsopen', sizeTrack);
  if (!sizeObserver) {
    carousel.addEventListener('toggle', sizeTrack, true);
    window.addEventListener('resize', sizeTrack);
  }

  const selectStop = (index, updateMap = true) => {
    const { day, cards, titles, index: previousIndex } = active;
    if (index === previousIndex) return;

    if (previousIndex != null) {
      cards[previousIndex].removeAttribute('aria-current');
      cards[previousIndex].setAttribute('inert', '');
    }
    active.index = index;
    selectedStops.set(day, index);
    cards[index].removeAttribute('inert');
    cards[index].setAttribute('aria-current', 'step');
    count.textContent = `${index + 1} / ${cards.length}`;
    announcement.textContent = `第 ${index + 1} 站，共 ${cards.length} 站。${titles[index]}`;
    summaryTitle.textContent = titles[index];
    summaryTime.textContent = cards[index].querySelector('.stop-time')?.textContent.trim() || '';
    summaryAction.textContent = stopAction(cards[index]);
    const guide = cards[index].querySelector('.stop-food-guide');
    mealsLink.hidden = !guide;
    if (guide) {
      mealsLink.href = `#${guide.id}`;
      mealsLink.setAttribute('aria-controls', guide.id);
    } else {
      mealsLink.removeAttribute('href');
      mealsLink.removeAttribute('aria-controls');
    }
    previousButton.setAttribute('aria-disabled', String(index === 0));
    nextButton.setAttribute('aria-disabled', String(index === cards.length - 1));
    sizeTrack();
    sizeObserver?.disconnect();
    sizeObserver?.observe(cards[index]);
    if (updateMap) {
      if (routeView.hidden) showGoogleStop(false);
      else map.focus(index);
    }
  };

  const scrollToStop = (index) => {
    if (!active || !active.cards[index]) return;
    const { track, cards } = active;
    selectStop(index);
    track.scrollTo({ left: cards[index].offsetLeft - cards[0].offsetLeft, behavior: 'instant' });
  };

  const readScrollPosition = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!active || active.cards.length < 2) return;
      const { track, cards } = active;
      const stride = cards[1].offsetLeft - cards[0].offsetLeft;
      if (!stride) return;
      const index = Math.round(track.scrollLeft / stride);
      selectStop(Math.max(0, Math.min(index, cards.length - 1)));
    });
  };

  previousButton.addEventListener('click', () => scrollToStop(active?.index - 1));
  nextButton.addEventListener('click', () => scrollToStop(active?.index + 1));

  carousel.addEventListener('keydown', (event) => {
    if (!active || (event.target !== previousButton && event.target !== nextButton)) return;
    const shortcuts = { ArrowLeft: active.index - 1, ArrowRight: active.index + 1, Home: 0, End: active.cards.length - 1 };
    const index = shortcuts[event.key];
    if (index == null) return;
    event.preventDefault();
    scrollToStop(index);
  });

  const restoreDay = () => {
    if (!active) return;
    const { header, track, cards, actions, timeNote, timeNoteContainer } = active;
    active = undefined;
    collapseMap(false);
    clearTimeout(googleUpdateTimer);
    sizeObserver?.disconnect();
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    track.removeEventListener('scroll', readScrollPosition);
    track.scrollLeft = 0;
    track.classList.remove('day-carousel-track');
    track.removeAttribute('id');
    track.removeAttribute('role');
    track.style.removeProperty('--day-card-height');
    cards.forEach((card) => {
      card.removeAttribute('inert');
      card.removeAttribute('aria-current');
    });
    if (actions) {
      actions.classList.remove('day-carousel-actions');
      header.append(actions);
    }
    if (timeNote) {
      timeNote.classList.remove('day-carousel-time-note');
      timeNoteContainer.append(timeNote);
    }
    carousel.before(track);
    carousel.remove();
    mapPanel.remove();
    stopSummary.remove();
    routeView.hidden = true;
    googleFrame.removeAttribute('src');
    itinerary.classList.remove('has-day-carousel');
  };

  const showDay = (day) => {
    if (active?.day === day) return;
    restoreDay();
    if (!day) return;

    const header = day.querySelector(':scope > .itinerary-header');
    const track = day.querySelector(':scope > .itinerary-stops');
    if (!header || !track?.children.length) return;
    const cards = Array.from(track.children);
    const titles = cards.map(stopTitle);
    const points = cards.map((card, index) => mapPoint(card, titles[index]));
    const actions = header.querySelector(':scope > :is(.itinerary-map-actions, .route-link)');
    const timeNote = header.querySelector('.itinerary-time-note');
    const timeNoteContainer = timeNote?.parentElement;
    const index = selectedStops.get(day) ?? 0;
    active = { day, header, track, cards, titles, points, actions, timeNote, timeNoteContainer };

    itinerary.classList.add('has-day-carousel');
    header.after(stopSummary, mapPanel);
    track.before(carousel);
    carousel.append(track);
    if (actions) {
      actions.classList.add('day-carousel-actions');
      carousel.after(actions);
    }
    if (timeNote) {
      timeNote.classList.add('day-carousel-time-note');
      carousel.after(timeNote);
    }
    track.id = 'day-carousel-track';
    track.classList.add('day-carousel-track');
    // Keep the ordered list exposed to VoiceOver when its markers are styled by the cards.
    track.setAttribute('role', 'list');
    cards.forEach((card) => card.setAttribute('inert', ''));
    selectStop(index, false);
    scrollToStop(index);
    track.addEventListener('scroll', readScrollPosition, { passive: true });

    showMapMode();
  };

  const sync = () => {
    const day = narrowScreen.matches && !itinerary.hidden
      ? itinerary.querySelector('[data-trip-day]:not([hidden])')
      : undefined;
    showDay(day);
  };

  document.addEventListener('namba:destinationchange', sync);
  narrowScreen.addEventListener('change', sync);
  sync();
})();
