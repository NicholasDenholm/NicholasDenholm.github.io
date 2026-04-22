// Three.js rain with mouse-based deflection
(function () {
  if (!window.THREE) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 45, 120);
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

  const positions = new Float32Array(rainCount * 3);
  const fallSpeed = new Float32Array(rainCount);
  const lateralX = new Float32Array(rainCount);
  const lateralZ = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    const index = i * 3;
    positions[index] = (Math.random() - 0.5) * spreadX;
    positions[index + 1] = Math.random() * spreadY;
    positions[index + 2] = (Math.random() - 0.5) * spreadZ;
    fallSpeed[i] = 0.9 + Math.random() * 1.4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.6,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });

  function updateRainColor() {
    const cssColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-blue')
      .trim();
    material.color.set(cssColor || '#7a9fb5');
  }

  updateRainColor();
  const themeObserver = new MutationObserver(updateRainColor);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
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

  window.addEventListener(
    'pointermove',
    function (event) {
      updateMousePosition(event.clientX, event.clientY);
    },
    { passive: true }
  );

  const deflectRadius = 18;
  const radiusSquared = deflectRadius * deflectRadius;
  const repelStrength = 0.12;

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
        const push = ((deflectRadius - distance) / deflectRadius) * repelStrength;
        lateralX[i] += (dx / distance) * push;
        lateralZ[i] += (dz / distance) * push;
      }

      x += lateralX[i];
      z += lateralZ[i];
      y -= fallSpeed[i];

      lateralX[i] *= 0.93;
      lateralZ[i] *= 0.93;

      if (y < resetY) {
        x = (Math.random() - 0.5) * spreadX;
        y = spreadY;
        z = (Math.random() - 0.5) * spreadZ;
        fallSpeed[i] = 0.9 + Math.random() * 1.4;
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

  animate();
})();
