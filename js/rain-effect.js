// Three.js rain with mouse deflection and live settings editor
(function () {
  const SETTINGS_KEY = 'nd-rain-settings';
  const DEFAULT_SETTINGS = {
    speed: 0.1,
    direction: 0.03,
    deflection: 0.5,
    color: ''
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hideRainControls() {
    const toggleButton = document.getElementById('rain-editor-toggle');
    const panel = document.getElementById('rain-editor');
    if (toggleButton) toggleButton.hidden = true;
    if (panel) panel.hidden = true;
  }

  function safeParse(jsonValue) {
    try {
      return JSON.parse(jsonValue);
    } catch {
      return null;
    }
  }

  function normalizeHexColor(colorValue) {
    if (!colorValue || typeof colorValue !== 'string') return '';
    const value = colorValue.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(value)) return value;
    if (/^#[0-9a-f]{3}$/.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return '';
  }

  function rgbToHex(colorValue) {
    const match = colorValue.match(/\d+/g);
    if (!match || match.length < 3) return '';
    const [r, g, b] = match.slice(0, 3).map(function (part) {
      return clamp(parseInt(part, 10), 0, 255);
    });
    const toHex = function (num) {
      return num.toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function cssColorToHex(colorValue) {
    const normalized = normalizeHexColor(colorValue);
    if (normalized) return normalized;
    if (typeof colorValue === 'string' && colorValue.toLowerCase().startsWith('rgb')) {
      return rgbToHex(colorValue);
    }
    return '#7a9fb5';
  }

  function loadSettings() {
    const saved = safeParse(localStorage.getItem(SETTINGS_KEY)) || {};
    // Adjust values here to change range of sliders
    return {
      speed: clamp(Number(saved.speed) || DEFAULT_SETTINGS.speed, 0.001, 1),
      direction: clamp(Number(saved.direction) || DEFAULT_SETTINGS.direction, -0.5, 0.5),
      deflection: clamp(Number(saved.deflection) || DEFAULT_SETTINGS.deflection, 0, 1),
      color: normalizeHexColor(saved.color) || ''
    };
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getThemeAccentColor() {
    const cssColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-blue')
      .trim();
    return cssColorToHex(cssColor);
  }

  const toggleButton = document.getElementById('rain-editor-toggle');
  const panel = document.getElementById('rain-editor');
  const speedInput = document.getElementById('rain-speed');
  const speedValue = document.getElementById('rain-speed-value');
  const directionInput = document.getElementById('rain-direction');
  const directionValue = document.getElementById('rain-direction-value');
  const deflectionInput = document.getElementById('rain-deflection');
  const deflectionValue = document.getElementById('rain-deflection-value');
  const colorInput = document.getElementById('rain-color');
  const resetButton = document.getElementById('rain-reset');

  const hasRequiredDom = toggleButton && panel && speedInput && speedValue
    && directionInput && directionValue && deflectionInput && deflectionValue
    && colorInput && resetButton;

  if (!hasRequiredDom) return;

  if (!window.THREE) {
    hideRainControls();
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    hideRainControls();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 45, 120);
  // x,y,z angle for the viewer: initally 0,25,0
  camera.lookAt(0, 25, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = 'rain-layer';
  document.body.prepend(renderer.domElement);

  const rainCount = window.innerWidth < 768 ? 700 : 1300;
  const spreadX = 180;
  const spreadY = 120;
  const spreadZ = 180;
  const resetY = -10;
  const deflectRadius = 50;
  const radiusSquared = deflectRadius * deflectRadius;

  const positions = new Float32Array(rainCount * 3);
  const baseFallSpeed = new Float32Array(rainCount);
  const lateralX = new Float32Array(rainCount);
  const lateralZ = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    const index = i * 3;
    positions[index] = (Math.random() - 0.5) * spreadX;
    positions[index + 1] = Math.random() * spreadY;
    positions[index + 2] = (Math.random() - 0.5) * spreadZ;
    baseFallSpeed[i] = 0.9 + Math.random() * 1.4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.6,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });

  const settings = loadSettings();

  function getEffectiveRainColor() {
    return settings.color || getThemeAccentColor();
  }

  function updateRainColor() {
    material.color.set(getEffectiveRainColor());
    if (!settings.color) {
      colorInput.value = getThemeAccentColor();
    }
  }

  updateRainColor();

  const themeObserver = new MutationObserver(function () {
    if (!settings.color) updateRainColor();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'style']
  });

  const rain = new THREE.Points(geometry, material);
  scene.add(rain);

  const mouseNdc = new THREE.Vector2(2, 2);
  const mouseWorld = new THREE.Vector3(9999, 0, 9999);
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function updateMousePosition(clientX, clientY) {
    mouseNdc.x = (clientX / window.innerWidth) * 2 - 1;
    mouseNdc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseNdc, camera);
    raycaster.ray.intersectPlane(groundPlane, mouseWorld);
  }

  function updateToggleState(isOpen) {
    toggleButton.setAttribute('aria-label', isOpen ? 'Close rain settings' : 'Open rain settings');
    toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function syncEditorControls() {
    speedInput.value = String(settings.speed);
    directionInput.value = String(settings.direction);
    deflectionInput.value = String(settings.deflection);
    colorInput.value = getEffectiveRainColor();
    speedValue.textContent = `${settings.speed.toFixed(1)}x`;
    directionValue.textContent = settings.direction.toFixed(2);
    deflectionValue.textContent = settings.deflection.toFixed(2);
  }

  function openEditor() {
    panel.hidden = false;
    syncEditorControls();
    updateToggleState(true);
  }

  function closeEditor() {
    panel.hidden = true;
    updateToggleState(false);
  }

  function toggleEditor() {
    if (panel.hidden) {
      openEditor();
    } else {
      closeEditor();
    }
  }

  window.addEventListener(
    'pointermove',
    function (event) {
      updateMousePosition(event.clientX, event.clientY);
    },
    { passive: true }
  );

  toggleButton.addEventListener('click', toggleEditor);

  speedInput.addEventListener('input', function () {
    settings.speed = clamp(Number(speedInput.value), -1, 1);
    speedValue.textContent = `${settings.speed.toFixed(1)}x`;
    saveSettings(settings);
  });

  directionInput.addEventListener('input', function () {
    settings.direction = clamp(Number(directionInput.value), -0.5, 0.5);
    directionValue.textContent = settings.direction.toFixed(2);
    saveSettings(settings);
  });

  deflectionInput.addEventListener('input', function () {
    settings.deflection = clamp(Number(deflectionInput.value), 0, 1);
    deflectionValue.textContent = settings.deflection.toFixed(2);
    saveSettings(settings);
  });

  colorInput.addEventListener('input', function () {
    settings.color = normalizeHexColor(colorInput.value) || '';
    updateRainColor();
    saveSettings(settings);
  });

  resetButton.addEventListener('click', function () {
    settings.speed = DEFAULT_SETTINGS.speed;
    settings.direction = DEFAULT_SETTINGS.direction;
    settings.deflection = DEFAULT_SETTINGS.deflection;
    settings.color = DEFAULT_SETTINGS.color;
    updateRainColor();
    syncEditorControls();
    saveSettings(settings);
  });

  function animate() {
    for (let i = 0; i < rainCount; i++) {
      const index = i * 3;
      let x = positions[index];
      let y = positions[index + 1];
      let z = positions[index + 2];

      const dx = x - mouseWorld.x;
      const dz = z - mouseWorld.z;
      const distanceSquared = dx * dx + dz * dz;

      if (distanceSquared < radiusSquared && distanceSquared > 0.0001) {
        const distance = Math.sqrt(distanceSquared);
        const push = ((deflectRadius - distance) / deflectRadius) * settings.deflection;
        lateralX[i] += (dx / distance) * push;
        lateralZ[i] += (dz / distance) * push;
      }

      x += lateralX[i] + settings.direction;
      z += lateralZ[i];
      y -= baseFallSpeed[i] * settings.speed;

      lateralX[i] *= 0.93;
      lateralZ[i] *= 0.93;

      if (y < resetY) {
        x = (Math.random() - 0.5) * spreadX;
        y = spreadY;
        z = (Math.random() - 0.5) * spreadZ;
        baseFallSpeed[i] = 0.9 + Math.random() * 1.4;
        lateralX[i] = 0;
        lateralZ[i] = 0;
      }

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
    }

    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', handleResize);

  syncEditorControls();
  closeEditor();
  animate();
})();
