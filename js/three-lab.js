(function () {
  const mount = document.getElementById('three-lab-canvas');
  const status = document.getElementById('three-lab-status');
  const rotationInput = document.getElementById('lab-rotation-speed');
  const bobSpeedInput = document.getElementById('lab-bob-speed');
  const colorInput = document.getElementById('lab-color');
  const wireframeInput = document.getElementById('lab-wireframe');
  const resetButton = document.getElementById('lab-reset');

  if (!mount || !status || !rotationInput || !bobSpeedInput || !colorInput || !wireframeInput || !resetButton) return;

  if (!window.THREE) {
    status.hidden = false;
    status.textContent = 'Three.js did not load. Check js/vendor/three.min.js.';
    return;
  }

  const defaults = {
    rotationSpeed: 0.02,
    bobSpeed: 1.2,
    color: '#58a6ff',
    wireframe: false
  };

  const state = { ...defaults };

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0.6, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(4, 7, 3);
  scene.add(ambientLight, keyLight);

  // Start here if you want a different experiment object.
  const material = new THREE.MeshStandardMaterial({
    color: state.color,
    roughness: 0.4,
    metalness: 0.2,
    wireframe: state.wireframe
  });
  const geometry = new THREE.TorusKnotGeometry(0.9, 0.28, 150, 24);
  const demoMesh = new THREE.Mesh(geometry, material);
  scene.add(demoMesh);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.3;
  scene.add(floor);

  function syncControls() {
    rotationInput.value = String(state.rotationSpeed);
    bobSpeedInput.value = String(state.bobSpeed);
    colorInput.value = state.color;
    wireframeInput.checked = state.wireframe;
  }

  function applyState() {
    material.color.set(state.color);
    material.wireframe = state.wireframe;
  }

  function resizeRenderer() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function resetState() {
    state.rotationSpeed = defaults.rotationSpeed;
    state.bobSpeed = defaults.bobSpeed;
    state.color = defaults.color;
    state.wireframe = defaults.wireframe;
    syncControls();
    applyState();
  }

  rotationInput.addEventListener('input', function () {
    state.rotationSpeed = Number(rotationInput.value);
  });

  bobSpeedInput.addEventListener('input', function () {
    state.bobSpeed = Number(bobSpeedInput.value);
  });

  colorInput.addEventListener('input', function () {
    state.color = colorInput.value;
    applyState();
  });

  wireframeInput.addEventListener('change', function () {
    state.wireframe = wireframeInput.checked;
    applyState();
  });

  resetButton.addEventListener('click', resetState);

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();
    demoMesh.rotation.x += state.rotationSpeed * 0.7;
    demoMesh.rotation.y += state.rotationSpeed;
    demoMesh.position.y = Math.sin(elapsed * state.bobSpeed) * 0.25;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeRenderer);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resizeRenderer);
    observer.observe(mount);
  }

  syncControls();
  applyState();
  resizeRenderer();
  animate();
})();
