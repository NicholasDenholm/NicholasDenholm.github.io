(function () {
  const mount = document.getElementById('soccer-scene-canvas');
  const status = document.getElementById('soccer-scene-status');
  const resetViewButton = document.getElementById('soccer-reset-view');

  if (!mount || !status || !resetViewButton) return;

  if (!window.THREE) {
    status.hidden = false;
    status.textContent = 'Three.js did not load. Check js/vendor/three.min.js.';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 1.1, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(3, 5, 2);
  scene.add(ambientLight, keyLight);

  // ---------------- BALL ----------------
  function createCustomSceneObject() {
    const group = new THREE.Group();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 42, 28),
      new THREE.MeshStandardMaterial({
        color: 0xf8f8f8,
        roughness: 0.65,
        metalness: 0.08
      })
    );
    group.add(ball);

    const seams = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.01, 1),
      new THREE.MeshBasicMaterial({
        color: 0x1e1e1e,
        wireframe: true
      })
    );
    group.add(seams);

    return group;
  }

  const sceneObject = createCustomSceneObject();
  scene.add(sceneObject);

  // ---------------- FLOOR ----------------
  const floorY = -1.3;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  scene.add(floor);

  // ---------------- SIMPLE PHYSICS ----------------
  const velocity = new THREE.Vector3(0, 0, 0);
  const gravity = -9.8;
  const bounce = 0.6;
  const friction = 0.98;

  // ---------------- RAYCAST ----------------
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mount.addEventListener('click', function (event) {
    const rect = mount.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(sceneObject, true);

    if (intersects.length > 0) {
      kickBall();
    }
  });

  function kickBall() {
    const direction = new THREE.Vector3();
    direction.subVectors(sceneObject.position, camera.position).normalize();

    // Add randomness so it feels natural
    direction.x += (Math.random() - 0.5) * 0.4;
    direction.y += Math.random() * 0.5;

    const strength = 20;

    velocity.x += direction.x * strength;
    velocity.y += direction.y * strength;
    velocity.z += direction.z * strength;
  }

  // ---------------- CONTROLS ----------------
  resetViewButton.addEventListener('click', function () {
    camera.position.set(0, 1.1, 4);
    camera.lookAt(0, 0, 0);

    // Reset ball
    sceneObject.position.set(0, 0, 0);
    velocity.set(0, 0, 0);
  });

  // ---------------- RESIZE ----------------
  function resizeRenderer() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();

  // ---------------- ANIMATION ----------------
  function animate() {
    const delta = clock.getDelta();

    // Apply gravity
    velocity.y += gravity * delta;

    // Move ball
    sceneObject.position.addScaledVector(velocity, delta);

    // Floor collision
    if (sceneObject.position.y - 1 <= floorY) {
      sceneObject.position.y = floorY + 1;
      velocity.y *= -bounce;

      // Ground friction
      velocity.x *= friction;
      velocity.z *= friction;
    }

    // Spin based on movement
    sceneObject.rotation.x += velocity.z * 0.02;
    sceneObject.rotation.z += velocity.x * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeRenderer);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resizeRenderer);
    observer.observe(mount);
  }

  resizeRenderer();
  animate();
})();

/*
// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20252f);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Renderer
//const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas });
const canvas = document.getElementById('soccer-scene-canvas');
const status = document.getElementById('soccer-scene-status');

renderer.setSize(window.innerWidth, window.innerHeight);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Ground (Three.js)
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Ball (Three.js)
const ballGeo = new THREE.SphereGeometry(1, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const ballMesh = new THREE.Mesh(ballGeo, ballMat);
scene.add(ballMesh);

// ---------------- PHYSICS ----------------
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Ground body
const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Ball body
const ballBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(1),
  position: new CANNON.Vec3(0, 5, 0)
});
world.addBody(ballBody);

// ---------------- RAYCAST + KICK ----------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(ballMesh);

  if (intersects.length > 0) {
    kickBall(intersects[0]);
  }
});

function kickBall(hit) {
  const direction = new THREE.Vector3();
  direction.subVectors(ballMesh.position, camera.position).normalize();

  // Add slight randomness for realism
  direction.x += (Math.random() - 0.5) * 0.3;
  direction.y += Math.random() * 0.2;

  const strength = 6;

  const impulse = new CANNON.Vec3(
    direction.x * strength,
    direction.y * strength,
    direction.z * strength
  );

  ballBody.applyImpulse(
    impulse,
    new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z)
  );
}

// ---------------- LOOP ----------------
function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  // Sync Three.js with physics
  ballMesh.position.copy(ballBody.position);
  ballMesh.quaternion.copy(ballBody.quaternion);

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


(function () {
  const mount = document.getElementById('soccer-scene-canvas');
  const status = document.getElementById('soccer-scene-status');
  const resetViewButton = document.getElementById('soccer-reset-view');

  if (!mount || !status || !resetViewButton) return;

  if (!window.THREE) {
    status.hidden = false;
    status.textContent = 'Three.js did not load. Check js/vendor/three.min.js.';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 1.1, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(3, 5, 2);
  scene.add(ambientLight, keyLight);

  // Starter soccer-ball-like object. Replace this function with your own ideas.
  function createCustomSceneObject() {
    const group = new THREE.Group();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 42, 28),
      new THREE.MeshStandardMaterial({
        color: 0xf8f8f8,
        roughness: 0.65,
        metalness: 0.08
      })
    );
    group.add(ball);

    const seams = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.01, 1),
      new THREE.MeshBasicMaterial({
        color: 0x1e1e1e,
        wireframe: true
      })
    );
    group.add(seams);

    return group;
  }

  const sceneObject = createCustomSceneObject();
  scene.add(sceneObject);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.3;
  scene.add(floor);

  resetViewButton.addEventListener('click', function () {
    camera.position.set(0, 1.1, 4);
    camera.lookAt(0, 0, 0);
  });

  function resizeRenderer() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    const elapsed = clock.getElapsedTime();
    sceneObject.rotation.y = elapsed * 0.45;
    sceneObject.position.y = Math.sin(elapsed * 1.4) * 0.08;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeRenderer);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resizeRenderer);
    observer.observe(mount);
  }

  resizeRenderer();
  animate();
})();
*/