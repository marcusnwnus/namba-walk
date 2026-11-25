(() => {
  'use strict';

  const gsiAttribution = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer" lang="ja">国土地理院</a>';
  const osmAttribution = '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>';
  const legLabels = { airport: '機場至難波', 'day-1': '心齋橋及道頓堀', 'day-6': '日本橋及難波', 'airport-back': '難波至機場' };
  const segmentStyles = {
    walk: { color: '#24654e' },
    rail: { color: '#4b5283', dashArray: '10 6' },
    bus: { color: '#934719', dashArray: '1 7' },
    estimated: { color: '#555e65', dashArray: '3 6' }
  };
  const pinSize = 30;
  const pinRadius = pinSize / 2;
  const visibleMargin = 20;
  const validCoords = (coords) => Array.isArray(coords) && coords.length === 2 && coords.every(Number.isFinite);

  window.createNambaDayMap = ({ element, fitButton, context, note, onStopSelect }) => {
    const L = window.L;
    if (fitButton) fitButton.disabled = true;
    const setNote = (message) => {
      if (!note) return;
      if (note.textContent !== message) note.textContent = message;
      note.hidden = !message;
    };
    const unavailable = () => setNote('路線地圖未能載入。');
    if (!L || !element) return { show: unavailable, focus() {} };

    let map;
    let zoomControl;
    let tiles;
    let simpleLayer;
    let routeLayer;
    let routeBounds;
    let mapFailed = false;
    let tileFailed = false;
    let tileBatchFailed = false;
    let selectedIndex;
    let routeId;
    let routeChanged = false;
    let needsFit = false;
    let needsPan = false;
    let frame = null;
    const stops = new Map();
    const markers = new Map();
    const offsets = [L.point(0, 0)];
    // Spread labels at the overview zoom while leaving their route coordinates intact.
    for (const distance of [32, 64, 96]) {
      for (let step = 0; step < 8; step += 1) {
        const angle = (step - 2) * Math.PI / 4;
        offsets.push(L.point(Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance)));
      }
    }

    const updateNote = () => {
      if (mapFailed) { unavailable(); return; }
      if (!routeBounds?.isValid()) { setNote('這天暫無路線地圖。'); return; }
      const messages = [];
      if (navigator.onLine === false || tileFailed) {
        const reason = navigator.onLine === false ? '現時離線' : '詳細底圖未能載入';
        const coverage = simpleLayer ? '簡明底圖只覆蓋難波一帶。' : '仍可查看路線和停留點。';
        messages.push(`${reason}。${coverage}`);
      }
      if (!stops.has(selectedIndex)) messages.push('這個停留點未有地圖位置。');
      setNote(messages.join(''));
    };

    const syncBasemap = () => {
      const useSimple = navigator.onLine === false || tileFailed;
      const active = routeBounds?.isValid() ? (useSimple ? simpleLayer : tiles) : null;
      [tiles, simpleLayer].forEach((layer) => {
        if (layer && layer !== active && map.hasLayer(layer)) layer.remove();
      });
      if (active && !map.hasLayer(active)) active.addTo(map);
      element.dataset.basemap = useSimple ? 'simple' : 'detail';
    };

    const layoutMarkers = () => {
      if (!markers.size) return;
      const size = map.getSize();
      const visible = L.bounds([visibleMargin, visibleMargin], size.subtract([visibleMargin, visibleMargin]));
      const mapRect = element.getBoundingClientRect();
      const controls = [zoomControl.getContainer(), fitButton].filter(Boolean).map((control) => {
        const rect = control.getBoundingClientRect();
        return L.bounds(
          [rect.left - mapRect.left - pinRadius, rect.top - mapRect.top - pinRadius],
          [rect.right - mapRect.left + pinRadius, rect.bottom - mapRect.top + pinRadius]
        );
      });
      const placed = [];
      markers.forEach(({ marker, stem }) => {
        const pin = marker.getElement();
        if (!pin) return;
        const truePoint = map.latLngToContainerPoint(marker.getLatLng());
        const stayVisible = visible.contains(truePoint);
        const offset = offsets.find((candidate) => {
          const position = truePoint.add(candidate);
          if (stayVisible && (!visible.contains(position) || controls.some((control) => control.contains(position)))) return false;
          return placed.every((other) => position.distanceTo(other) >= pinSize);
        }) || offsets[0];
        placed.push(truePoint.add(offset));
        const distance = Math.hypot(offset.x, offset.y);
        pin.style.marginLeft = `${offset.x - pinRadius}px`;
        pin.style.marginTop = `${offset.y - pinRadius}px`;
        stem.hidden = distance === 0;
        stem.style.width = `${distance}px`;
        stem.style.transform = `rotate(${Math.atan2(-offset.y, -offset.x)}rad)`;
      });
    };

    const initialize = () => {
      try {
        map = L.map(element, { zoomControl: false, scrollWheelZoom: false, minZoom: 7, maxZoom: 19, zoomSnap: 0.25, zoomAnimation: false });
        map.attributionControl.setPrefix(false);
        zoomControl = L.control.zoom({ position: 'bottomleft', zoomInTitle: '放大地圖', zoomOutTitle: '縮小地圖' }).addTo(map);
        tiles = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
          maxNativeZoom: 18, maxZoom: 19, attribution: gsiAttribution
        });
        tiles.on('loading', () => { tileBatchFailed = false; });
        tiles.on('tileerror', () => { tileBatchFailed = true; });
        tiles.on('load', () => {
          if (!tileBatchFailed || !map.hasLayer(tiles)) return;
          tileFailed = true;
          schedule();
        });

        const baseData = window.NAMBA_BASEMAP;
        if (baseData?.features?.length) {
          const pane = map.createPane('day-map-basemap');
          pane.style.zIndex = '220';
          simpleLayer = L.geoJSON(baseData, {
            pane: 'day-map-basemap', interactive: false, attribution: osmAttribution,
            style(feature) {
              const kind = feature.properties?.kind;
              const area = feature.geometry?.type?.endsWith('Polygon');
              if (area) return { stroke: false, fillColor: kind === 'water' ? '#c9dfe1' : '#e2e9db', fillOpacity: 1 };
              if (kind === 'water') return { color: '#c9dfe1', weight: 4, opacity: 1 };
              return { color: '#fffdf7', weight: { main: 5, street: 3, path: 1.5 }[kind] || 1, opacity: 1 };
            }
          });
        }
        map.on('moveend', layoutMarkers);
      } catch (error) {
        map?.remove();
        mapFailed = true;
        console.warn('當日路線地圖未能載入。', error);
      }
    };

    const makeMarker = ({ coords, index, title }) => {
      const number = String(index + 1).padStart(2, '0');
      const label = `${number} ${title}`;
      const pinContent = document.createElement('span');
      const stem = document.createElement('span');
      stem.className = 'day-map-marker-stem';
      stem.hidden = true;
      stem.style.cssText = 'position:absolute;left:50%;top:50%;height:2px;background:#536759;box-shadow:0 0 0 1px white;transform-origin:left center;pointer-events:none;z-index:-1';
      const badge = document.createElement('span');
      badge.className = 'day-map-marker-number';
      badge.textContent = number;
      pinContent.setAttribute('aria-hidden', 'true');
      pinContent.append(stem, badge);
      const marker = L.marker(coords, {
        title: label, autoPanOnFocus: true,
        icon: L.divIcon({ className: 'day-map-marker', html: pinContent, iconSize: [pinSize, pinSize], iconAnchor: [pinRadius, pinRadius] })
      });
      marker.on('add', () => {
        const pin = marker.getElement();
        pin.setAttribute('aria-label', label);
        pin.addEventListener('keydown', (event) => {
          if ((event.key !== ' ' && event.key !== 'Enter') || event.repeat) return;
          event.preventDefault();
          onStopSelect?.(index);
        });
      });
      marker.on('click', () => onStopSelect?.(index));
      return { marker, stem };
    };

    const renderRoute = () => {
      routeLayer?.remove();
      markers.clear();
      routeBounds = L.latLngBounds();
      const casings = [];
      const lines = [];
      const route = window.NAMBA_ROUTES?.[routeId];
      (route?.segments || []).forEach(({ coords, kind, line }) => {
        const points = (coords || []).filter(validCoords);
        if (points.length < 2) return;
        points.forEach((point) => routeBounds.extend(point));
        const style = segmentStyles[kind] || segmentStyles.walk;
        const color = kind === 'rail' && line ? `var(--rail-${line}, ${style.color})` : style.color;
        casings.push(L.polyline(points, { ...style, color: '#fff', weight: 7.5, opacity: .96, interactive: false }));
        lines.push(L.polyline(points, { ...style, color, weight: 4.5, opacity: 1, interactive: false }));
      });
      stops.forEach((stop) => {
        if (stop.routeId !== routeId) return;
        routeBounds.extend(stop.coords);
        markers.set(stop.index, makeMarker(stop));
      });
      routeLayer = L.layerGroup([...casings, ...lines, ...Array.from(markers.values(), ({ marker }) => marker)]).addTo(map);
    };

    const fit = () => {
      map.fitBounds(routeBounds, { paddingTopLeft: [40, 34], paddingBottomRight: [40, 35], maxZoom: 17, animate: false });
    };

    const updateSelection = () => {
      markers.forEach(({ marker }, index) => {
        const active = index === selectedIndex;
        const pin = marker.getElement();
        pin?.classList.toggle('is-active', active);
        pin?.setAttribute('aria-pressed', String(active));
        marker.setZIndexOffset(active ? 1000 : 0);
      });
      if (!needsPan) return;
      const marker = markers.get(selectedIndex)?.marker;
      if (!marker) return;
      const size = map.getSize();
      const point = map.latLngToContainerPoint(marker.getLatLng());
      const inside = L.bounds([visibleMargin, visibleMargin], size.subtract([visibleMargin, visibleMargin])).contains(point);
      if (!inside) map.panTo(marker.getLatLng(), { animate: false });
    };

    function render() {
      frame = null;
      if (!element.clientWidth || !element.clientHeight || mapFailed) return;
      if (!map && routeId) initialize();
      if (!map || mapFailed) { updateNote(); return; }

      map.invalidateSize({ animate: false });
      if (routeChanged) {
        routeChanged = false;
        renderRoute();
      }
      const hasRoute = routeBounds?.isValid();
      if (fitButton) fitButton.disabled = !hasRoute;
      if (hasRoute && needsFit) fit();
      syncBasemap();
      if (hasRoute) {
        layoutMarkers();
        updateSelection();
      }
      needsFit = false;
      needsPan = false;
      updateNote();
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(render);
    }

    const updateLeg = () => {
      if (!context) return;
      context.textContent = legLabels[routeId] || '';
      context.hidden = !context.textContent;
    };

    const show = (points, index) => {
      stops.clear();
      points.forEach((point, cardIndex) => {
        const stop = window.NAMBA_ROUTES?.[point?.routeId]?.stops?.[point?.stopIndex];
        if (!validCoords(stop?.coords)) return;
        stops.set(cardIndex, { index: cardIndex, routeId: point.routeId, coords: stop.coords, title: point.title || stop.name });
      });
      selectedIndex = index;
      routeId = stops.get(index)?.routeId || stops.values().next().value?.routeId;
      routeChanged = true;
      needsFit = true;
      needsPan = false;
      updateLeg();
      schedule();
    };

    const focus = (index) => {
      if (index === selectedIndex) return;
      selectedIndex = index;
      const nextRoute = stops.get(index)?.routeId;
      if (nextRoute && nextRoute !== routeId) {
        routeId = nextRoute;
        routeChanged = true;
        needsFit = true;
        updateLeg();
      }
      needsPan = !needsFit;
      schedule();
    };

    fitButton?.addEventListener('click', () => {
      needsFit = true;
      needsPan = false;
      schedule();
    });
    window.addEventListener('offline', schedule);
    window.addEventListener('online', () => { tileFailed = false; schedule(); });
    if (window.ResizeObserver) new window.ResizeObserver(schedule).observe(element);
    else window.addEventListener('resize', schedule);
    return { show, focus };
  };
})();
