(() => {
  const views = new Map(Array.from(document.querySelectorAll('[data-trip-view]'), (panel) => [panel.dataset.tripView, panel]));
  const days = new Map(Array.from(document.querySelectorAll('[data-trip-day]'), (panel) => [panel.dataset.tripDay, panel]));
  if (!views.has('itinerary') || !days.has('1')) return;

  const viewLinks = document.querySelectorAll('[data-view-link]');
  const dayLinks = document.querySelectorAll('#trip-days a[data-day-link]');
  const destinations = new Map([
    ['#itinerary', { view: 'itinerary' }],
    ['#explore', { view: 'map' }],
    ['#trip-food', { view: 'food' }],
    ['#trip-shopping', { view: 'shopping' }],
    ['#trip-hotel', { view: 'hotel' }],
    ['#trip-japanese', { view: 'japanese' }],
    ['#hotel-stop', { view: 'hotel' }],
  ]);
  days.forEach((panel, day) => destinations.set(`#${panel.id}`, { view: 'itinerary', day }));

  const tripStart = Date.parse('2026-11-28T00:00:00+09:00');
  const japanTripDay = String(Math.floor((Date.now() - tripStart) / 86400000) + 1);
  const defaultDay = days.has(japanTripDay) ? japanTripDay : '1';
  let selectedDay = defaultDay;
  let activeView;

  const markCurrent = (links, dataKey, selected, value) => {
    links.forEach((link) => {
      if (link.dataset[dataKey] === selected) link.setAttribute('aria-current', value);
      else link.removeAttribute('aria-current');
    });
  };

  const showDestination = ({ view, day = selectedDay }, moveFocus = false) => {
    if (!views.has(view)) return;
    const viewChanged = activeView !== view;
    activeView = view;
    selectedDay = day;

    views.forEach((panel, key) => { panel.hidden = key !== view; });
    days.forEach((panel, key) => { panel.hidden = key !== day; });
    markCurrent(viewLinks, 'viewLink', view, 'page');
    markCurrent(dayLinks, 'dayLink', day, 'date');
    document.body.classList.add('app-ready');

    if (viewChanged) document.dispatchEvent(new CustomEvent('namba:viewchange', { detail: { view } }));
    document.dispatchEvent(new CustomEvent('namba:destinationchange', { detail: { view, day } }));

    if (moveFocus) {
      const panel = view === 'itinerary' ? days.get(day) : views.get(view);
      const heading = document.getElementById(panel.getAttribute('aria-labelledby')) || panel.querySelector('h1, h2') || panel;
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const destinationAtLocation = () => {
    const { hash } = window.location;
    return hash ? destinations.get(hash) : { view: 'itinerary', day: defaultDay };
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element && event.target.closest('a[href^="#"], [data-show-route]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    const hash = link.hasAttribute('data-show-route') ? '#explore' : link.getAttribute('href');
    if (link.hasAttribute('data-open-meals')) {
      const mealGuide = document.getElementById(hash.slice(1));
      if (!mealGuide?.matches('details.stop-food-guide')) return;
      event.preventDefault();
      if (mealGuide.closest('[hidden], [inert]')) return;
      mealGuide.open = true;
      mealGuide.dispatchEvent(new Event('namba:mealsopen', { bubbles: true }));
      const summary = mealGuide.querySelector('summary');
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
      return;
    }

    const destination = destinations.get(hash);
    if (!destination) return;

    event.preventDefault();
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    // Capture phase lets Leaflet measure the visible map before the route link's click handler runs.
    showDestination(destination, true);
  }, true);

  window.addEventListener('hashchange', () => {
    const destination = destinationAtLocation();
    if (destination) showDestination(destination, true);
  });

  showDestination(destinationAtLocation() || { view: 'itinerary' });

  const copyWithSelection = (text) => {
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.cssText = 'position: fixed; top: 0; left: 0; opacity: 0; font-size: 16px;';
    document.body.append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      field.remove();
      previousFocus?.focus({ preventScroll: true });
    }
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // The browser may deny clipboard access even when the API is available.
    }
    return copyWithSelection(text);
  };
  window.NAMBA_COPY_TEXT = copyText;

  const copyButton = document.getElementById('copy-hotel');
  const hotelName = document.getElementById('hotel-japanese');
  const hotelAddress = document.getElementById('hotel-address');
  const copyStatus = document.getElementById('hotel-copy-status');
  if (!copyButton || !hotelName || !hotelAddress || !copyStatus) return;

  copyButton.addEventListener('click', async () => {
    const text = `${hotelName.textContent.trim()}\n${hotelAddress.textContent.trim()}`;
    copyStatus.textContent = '';
    const copied = await copyText(text);
    copyStatus.textContent = copied ? '已複製酒店名稱及地址' : '請長按複製酒店資料';
  });
})();
