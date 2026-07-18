const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!motionQuery.matches) {
  import("./vendor/three.module.min.js")
    .then((THREE) => initAmbientMotion(THREE))
    .catch(() => document.documentElement.classList.add("three-unavailable"));
}

function initAmbientMotion(THREE) {
  const isCompact = window.matchMedia("(max-width: 700px)").matches;
  const openingCanvas = document.querySelector("#openingCanvas");
  const heroCanvas = document.querySelector("#heroCanvas");
  const hero = document.querySelector(".hero");
  const opening = document.querySelector("#opening");

  const openingScene = createScene(THREE, openingCanvas, {
    count: isCompact ? 70 : 120,
    color: 0xe1c48f,
    petalColor: 0x8d2d44,
    spread: 7.4,
    speed: 0.75,
    dustOpacity: 0.14,
    petalCount: isCompact ? 13 : 19,
    petalOpacity: 0.36,
    petalScale: 1.45,
  });

  const heroScene = createScene(THREE, heroCanvas, {
    count: isCompact ? 170 : 380,
    color: 0xb58a49,
    petalColor: 0x9f5264,
    spread: 8.8,
    speed: 0.48,
    dustOpacity: 0.48,
    petalCount: isCompact ? 7 : 11,
    petalOpacity: 0.18,
  });

  let heroInView = true;
  let invitationOpened = opening.classList.contains("is-revealing") || opening.classList.contains("is-open");
  heroScene.setActive(invitationOpened);
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroInView = entry.isIntersecting;
    heroScene.setActive(invitationOpened && heroInView && document.visibilityState === "visible");
  }, { threshold: 0.02 });
  heroObserver.observe(hero);

  const retireOpeningScene = () => {
    invitationOpened = true;
    window.setTimeout(() => openingScene.destroy(), 1500);
    heroScene.setActive(heroInView && document.visibilityState === "visible");
  };
  if (invitationOpened) retireOpeningScene();
  else window.addEventListener("invitation:opened", retireOpeningScene, { once: true });

  document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState === "visible";
    openingScene.setActive(visible && !opening.classList.contains("is-open"));
    heroScene.setActive(visible && invitationOpened && heroInView);
  });

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      openingScene.setPointer(x, y);
      heroScene.setPointer(x, y);
    }, { passive: true });
  }
}

function createScene(THREE, canvas, options) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 30);
  camera.position.z = 5.8;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const positions = new Float32Array(options.count * 3);
  for (let index = 0; index < options.count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * options.spread;
    positions[index * 3 + 1] = (Math.random() - 0.5) * options.spread;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: options.color,
    size: 0.028,
    transparent: true,
    opacity: options.dustOpacity ?? 0.58,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  const petalGeometry = new THREE.CircleGeometry(0.075, 8);
  const petalScale = options.petalScale ?? 1;
  petalGeometry.scale(0.58 * petalScale, petalScale, 1);
  const petalMaterial = new THREE.MeshBasicMaterial({
    color: options.petalColor,
    transparent: true,
    opacity: options.petalOpacity ?? 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const petals = [];
  const petalCount = options.petalCount ?? (isFinite(options.count) && options.count < 200 ? 7 : 11);
  for (let index = 0; index < petalCount; index += 1) {
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.position.set((Math.random() - 0.5) * options.spread, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2);
    petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    petal.userData = { drift: 0.0001 + Math.random() * 0.00016, phase: Math.random() * Math.PI * 2 };
    petals.push(petal);
    scene.add(petal);
  }

  let frame = 0;
  let active = true;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(time = 0) {
    if (destroyed || !active) return;
    dust.rotation.z = time * 0.000012 * options.speed;
    dust.rotation.y = time * 0.000018 * options.speed;
    camera.position.x += (pointerX * 0.45 - camera.position.x) * 0.025;
    camera.position.y += (-pointerY * 0.28 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    petals.forEach((petal, index) => {
      petal.position.y += petal.userData.drift * options.speed * 16;
      petal.position.x += Math.sin(time * 0.00045 + petal.userData.phase) * 0.00045;
      petal.rotation.x += 0.0022 * options.speed;
      petal.rotation.z += (0.0014 + index * 0.00005) * options.speed;
      if (petal.position.y > 4.2) petal.position.y = -4.2;
    });

    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  frame = requestAnimationFrame(render);

  return {
    setPointer(x, y) { pointerX = x; pointerY = y; },
    setActive(next) {
      if (destroyed || active === next) return;
      active = next;
      if (active) frame = requestAnimationFrame(render);
      else cancelAnimationFrame(frame);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      dustGeometry.dispose();
      dustMaterial.dispose();
      petalGeometry.dispose();
      petalMaterial.dispose();
      renderer.dispose();
    },
  };
}
