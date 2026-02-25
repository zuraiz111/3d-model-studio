import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==================== State Management ====================
const state = {
  rotationSpeed: 1,
  autoRotate: false,
  lightingEnabled: true,
  lightMode: false,
  frameCount: 0,
  lastTime: Date.now(),
  fps: 60
};

// ==================== Scene Setup ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e27);
scene.fog = new THREE.Fog(0x0a0e27, 100, 1000);

// ==================== Camera ====================
const canvas = document.getElementById('canvas-container');
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / 600,
  0.1,
  2000
);
camera.position.set(0, 2, 8);

// Store initial camera position
const initialCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };

// ==================== Renderer ====================
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(canvas.clientWidth, 600);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
canvas.appendChild(renderer.domElement);

// ==================== Orbit Controls ====================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotateSpeed = 2;
controls.enableZoom = true;
controls.enablePan = true;

// ==================== Lighting Setup ====================
function setupLighting() {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  ambientLight.name = 'ambientLight';
  scene.add(ambientLight);

  // Main Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.name = 'directionalLight';
  scene.add(directionalLight);

  // Point Light for accent
  const pointLight = new THREE.PointLight(0x00d4ff, 0.5, 100);
  pointLight.position.set(-10, 5, 5);
  pointLight.name = 'pointLight';
  scene.add(pointLight);

  // Fill Light
  const fillLight = new THREE.DirectionalLight(0xff006e, 0.3);
  fillLight.position.set(-10, 5, -10);
  fillLight.name = 'fillLight';
  scene.add(fillLight);
}

setupLighting();

// ==================== Model Loading ====================
let loadedModel = null;
const loader = new GLTFLoader();
const loadingIndicator = document.getElementById('loadingIndicator');

loader.load(
  'scene.glb',
  function (gltf) {
    loadedModel = gltf.scene;
    scene.add(loadedModel);

    // Center and scale model
    const box = new THREE.Box3().setFromObject(loadedModel);
    const center = box.getCenter(new THREE.Vector3());
    loadedModel.position.sub(center);

    // Add shadows
    loadedModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Update model info
    const modelInfo = `Vertices: ${loadedModel.children.length} objects loaded`;
    document.getElementById('modelInfo').textContent = modelInfo;

    // Hide loading indicator
    loadingIndicator.classList.add('hidden');
  },
  function (progress) {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    document.querySelector('.loading p').textContent = `Loading ${percent}%...`;
  },
  function (error) {
    console.error('Model loading error:', error);
    loadingIndicator.innerHTML = '<p style="color: #ff006e;">Error loading model</p>';
  }
);

// ==================== UI Controls ====================

// Rotation Speed Control
const rotationSpeedInput = document.getElementById('rotationSpeed');
const rotationValue = document.getElementById('rotationValue');

rotationSpeedInput.addEventListener('input', (e) => {
  state.rotationSpeed = parseFloat(e.target.value);
  rotationValue.textContent = `${state.rotationSpeed.toFixed(1)}x`;
  controls.autoRotateSpeed = 2 * state.rotationSpeed;
});

// Lighting Toggle
const toggleLightingBtn = document.getElementById('toggleLighting');
toggleLightingBtn.addEventListener('click', () => {
  state.lightingEnabled = !state.lightingEnabled;

  scene.children.forEach((child) => {
    if (child.isLight) {
      child.visible = state.lightingEnabled;
    }
  });

  toggleLightingBtn.style.opacity = state.lightingEnabled ? '1' : '0.5';
});

// Reset Camera
const resetCameraBtn = document.getElementById('resetCamera');
resetCameraBtn.addEventListener('click', () => {
  state.autoRotate = false;
  controls.autoRotate = false;
  camera.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);
  controls.target.set(0, 0, 0);
  controls.update();
});

// Auto Rotate Toggle
const autoRotateBtn = document.getElementById('autoRotate');
autoRotateBtn.addEventListener('click', () => {
  state.autoRotate = !state.autoRotate;
  controls.autoRotate = state.autoRotate;
  autoRotateBtn.style.opacity = state.autoRotate ? '1' : '0.5';
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  state.lightMode = !state.lightMode;
  document.body.classList.toggle('light-mode');

  if (state.lightMode) {
    scene.background = new THREE.Color(0xf5f7fa);
    scene.fog.color.set(0xf5f7fa);
    themeToggle.innerHTML = '🌙';
  } else {
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog.color.set(0x0a0e27);
    themeToggle.innerHTML = '☀️';
  }
});

// ==================== Window Resize Handler ====================
window.addEventListener('resize', () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// ==================== FPS Counter ====================
function updateFPS() {
  state.frameCount++;
  const now = Date.now();
  const elapsed = now - state.lastTime;

  if (elapsed >= 1000) {
    state.fps = Math.round((state.frameCount * 1000) / elapsed);
    document.getElementById('fps').textContent = state.fps;
    state.frameCount = 0;
    state.lastTime = now;
  }
}

// ==================== Animation Loop ====================
function animate() {
  requestAnimationFrame(animate);

  // Update controls and FPS
  controls.update();
  updateFPS();

  // Subtle model rotation if auto-rotate disabled but want smooth idle
  if (loadedModel && !state.autoRotate) {
    // Keep the model in nice viewing position
  }

  // Render the scene
  renderer.render(scene, camera);
}

animate();

// ==================== Navigation Menu ====================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
});

// Close menu when clicking nav links
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    
    // Update active link
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
  let current = '';
  const sections = document.querySelectorAll('section');
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    
    if (scrollY >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});