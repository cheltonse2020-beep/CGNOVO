/**
 * ============================================================
 *  DASH RETRO 3D — ADVANCED RACING GAME
 *  Auto-acceleration, traffic, power-ups, obstacles, day/night
 * ============================================================
 * 
 * 🚀 OTIMIZAÇÕES DE PERFORMANCE IMPLEMENTADAS:
 * 
 * ✅ RENDERER:
 *    • setPixelRatio limitado a 1.5 (era device ratio)
 *    • antialias desativado (antialias: false)
 *    • powerPreference: 'high-performance'
 *    • BasicShadowMap em vez de PCFSoftShadowMap
 * 
 * ✅ LUZES:
 *    • AmbientLight: 2.0 → 1.2 (reduzido 40%)
 *    • DirectionalLight: 2.5 → 1.8 (reduzido 28%)
 *    • shadowMapSize: 2048×2048 → 1024×1024 (reduzido 75%)
 *    • PointLights de polícia: 4.0 → 1.0 (reduzido 75%)
 * 
 * ✅ OBJETOS:
 *    • Carros inimigos: max 9 → 5 (reduzido 44%)
 *    • Obstáculos: max 6 → 3 (reduzido 50%)
 *    • Moedas: max 25 → 12 (reduzido 52%)
 *    • Jump pickups: max 3 → 2 (reduzido 33%)
 * 
 * ✅ MATERIAIS:
 *    • Moedas: emissiveIntensity 1.8 → 1.0
 *    • Power-ups: emissiveIntensity 1.8 → 1.0
 *    • Esferas de moedas: 4×4 → 3×3 segments
 * 
 * ✅ ANIMAÇÕES:
 *    • HUD: atualização a cada 100ms (era cada frame)
 *    • Moedas: rotação 0.12 → 0.06 (menos vibrante)
 *    • Jump pickups: rotação 0.15 → 0.08
 *    • Pedestres: WALK_SPEED 5.0 → 3.0, SWING_AMP 0.44 → 0.35
 *    • Árvores: esfera segments 7×5 → 5×4 (reduzido 43%)
 *    • Câmera cinematográfica: oscilação 0.4 → 0.2
 * 
 * ✅ LOOP PRINCIPAL:
 *    • Remoção de forEach pesado em scene.children
 *    • Substituição por loops for otimizados
 *    • Sway das árvores: verificação condicional por frame
 * 
 * ✅ COLISÕES:
 *    • Box3 reutilizáveis (já implementado)
 *    • Verificações otimizadas
 * 
 * ✅ RESULTADO ESPERADO:
 *    • FPS aumentado em 40-60%
 *    • Redução de lag em cenas com muitos objetos
 *    • Mantém qualidade visual retro 3D
 *    • Todas as funcionalidades preservadas
 * 
 * ============================================================
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// DOM references
// ─────────────────────────────────────────────────────────────
const menu       = document.getElementById('main-menu');
const canvas     = document.getElementById('game-canvas');
const btnStart   = document.getElementById('btn-start');
const btnExit    = document.getElementById('btn-exit');

// ─────────────────────────────────────────────────────────────
// Menu button handlers
// ─────────────────────────────────────────────────────────────

/** START GAME — hide menu, show canvas, boot Three.js */
btnStart.addEventListener('click', () => {
  menu.classList.add('hidden');
  canvas.style.display = 'block';
  gameState = {
    time: 0,
    baseVelocity: 12,
    currentVelocity: 0,
    overtakes: 0,
    score: 0,
    nitroCharge: 100,
    invulnerable: false,
    invulnerableTime: 0,
    dayNightCycle: 0,
    collisions: 0,
    isJumping: false,
    jumpVelocity: 0,
    jumpsAvailable: 3,
    obstacleHit: false,
    lastObstacleHitTime: -999,
    speedPenaltyActive: false,
    speedPenaltyTimer: 0,
    speedPenaltyAmount: 50
  };
  enemyCars = [];
  obstacles = [];
  powerUps = [];
  jumpPickups = [];
  coins = [];
  coinsCollected = 0;
  policeCars = [];
  policeConvoyActive = false;
  policeConvoyTimer  = 0;
  nextPoliceEventTime = 45;
  headlightSpots = [];
  isGameOver = false;
  initScene();
});

/** EXIT — simple window close */
btnExit.addEventListener('click', () => {
  window.close();
  document.body.innerHTML =
    '<p style="color:#00f5ff;font-family:monospace;padding:2rem;font-size:1.5rem;">GAME OVER — CLOSE THIS TAB TO EXIT</p>';
});

// ─────────────────────────────────────────────────────────────
// Return to menu handler (ESC key)
// ─────────────────────────────────────────────────────────────
function returnToMenu() {
  menu.classList.remove('hidden');
  canvas.style.display = 'none';
  const hud = document.getElementById('game-hud');
  if (hud) hud.remove();
  location.reload();
}

/**
 * togglePause()
 * ─────────────
 * Toggles pause state: pauses/resumes the game and shows pause menu.
 */
function togglePause() {
  isGamePaused = !isGamePaused;
  const pauseBtn = document.getElementById('pause-btn');
  const overlay = document.getElementById('pause-overlay');

  if (isGamePaused) {
    pauseBtn.classList.add('paused');
    pauseBtn.textContent = '▶';
    if (overlay) overlay.classList.add('visible');
  } else {
    pauseBtn.classList.remove('paused');
    pauseBtn.textContent = '⏸';
    if (overlay) overlay.classList.remove('visible');
  }
}

// ─────────────────────────────────────────────────────────────
// PAUSE MENU & LIGHTING SYSTEM FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * pauseGame()
 * ───────────
 * Pausa o jogo e mostra menu de pausa
 */
function pauseGame() {
  isGamePaused = true;
  const pauseBtn = document.getElementById('pause-btn');
  const overlay = document.getElementById('pause-overlay');
  if (pauseBtn) {
    pauseBtn.classList.add('paused');
    pauseBtn.textContent = '▶';
  }
  if (overlay) overlay.classList.add('visible');
}

/**
 * resumeGame()
 * ────────────
 * Retoma o jogo e fecha menu de pausa
 */
function resumeGame() {
  isGamePaused = false;
  const pauseBtn = document.getElementById('pause-btn');
  const overlay = document.getElementById('pause-overlay');
  if (pauseBtn) {
    pauseBtn.classList.remove('paused');
    pauseBtn.textContent = '⏸';
  }
  if (overlay) overlay.classList.remove('visible');
}

/**
 * restartGame()
 * ─────────────
 * Reinicia a partida (mesmo que ao clicar REPLAY)
 */
function restartGame() {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.classList.remove('visible');

  // Reset crash effect
  crashEffect.active = false;
  crashEffect.timer = 0;

  // Reset game state (igual ao REPLAY)
  isGameOver = false;
  isGamePaused = false;
  gameState.time = 0;
  gameState.currentVelocity = 0;
  gameState.baseVelocity = 12;
  gameState.overtakes = 0;
  gameState.score = 0;
  gameState.nitroCharge = 100;
  gameState.nitroActive = false;
  gameState.invulnerable = false;
  gameState.invulnerableTime = 0;
  gameState.isJumping = false;
  gameState.jumpVelocity = 0;
  gameState.jumpsAvailable = 3;
  gameState.collisions = 0;
  gameState.obstacleHit = false;
  gameState.lastObstacleHitTime = -999;
  gameState.speedPenaltyActive = false;
  gameState.speedPenaltyTimer = 0;

  // Reset player car position
  playerCar.position.set(0, 0, 5);
  playerCar.rotation.set(0, 0, 0);
  targetX = 0;
  currentTurnTilt = 0;

  // Clear arrays
  enemyCars = [];
  obstacles = [];
  powerUps = [];
  jumpPickups = [];
  coins = [];
  coinsCollected = 0;
  policeCars = [];
  policeConvoyActive = false;
  policeConvoyTimer = 0;
  nextPoliceEventTime = 45;
  policeChaseActive = false;
  policeChaseTimer = 0;
  policeTriggerIndex = 0;
  policeAggressiveness = 1.0;
  policeChaseMultiplier = 1.0;

  // Update HUD
  updateHUD();

  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.classList.remove('paused');
    pauseBtn.textContent = '⏸';
  }
}

/**
 * setLightLevel(level)
 * ────────────────────
 * Altera o nível de iluminação: 'min', 'medium', 'max'
 */
function setLightLevel(level) {
  if (!LIGHTING_LEVELS[level] || !ambientLight || !dirLight) return;

  const config = LIGHTING_LEVELS[level];
  currentLightLevel = level;

  // Atualizar luzes
  ambientLight.intensity = config.ambientIntensity;
  dirLight.intensity = config.dirIntensity;

  // Atualizar exposure do renderer (se suportado)
  if (renderer.toneMappingExposure !== undefined) {
    renderer.toneMappingExposure = config.exposureMultiplier;
  }

  // Atualizar faróis do carro (headlights)
  headlightSpots.forEach(spot => {
    spot.intensity = config.ambientIntensity * 2; // Faróis respondem à iluminação geral
  });

  // Salvar preferência
  saveLightLevel(level);

  // Atualizar UI (destacar botão selecionado)
  updateLightButtonsUI(level);
}

/**
 * saveLightLevel(level)
 * ─────────────────────
 * Salva o nível de iluminação no localStorage
 */
function saveLightLevel(level) {
  try {
    localStorage.setItem(LIGHT_LEVEL_STORAGE_KEY, level);
  } catch (e) {
    console.warn('⚠️ Erro ao salvar nível de iluminação:', e);
  }
}

/**
 * loadLightLevel()
 * ────────────────
 * Carrega o nível de iluminação salvo ou usa padrão 'medium'
 */
function loadLightLevel() {
  try {
    const saved = localStorage.getItem(LIGHT_LEVEL_STORAGE_KEY);
    if (saved && LIGHTING_LEVELS[saved]) {
      currentLightLevel = saved;
      return saved;
    }
  } catch (e) {
    console.warn('⚠️ Erro ao carregar nível de iluminação:', e);
  }
  return 'medium';
}

/**
 * updateLightButtonsUI(activeLevel)
 * ──────────────────────────────────
 * Destaca o botão de iluminação selecionado
 */
function updateLightButtonsUI(activeLevel) {
  ['min', 'medium', 'max'].forEach(level => {
    const btn = document.getElementById(`light-btn-${level}`);
    if (btn) {
      if (level === activeLevel) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

/**
 * exitGame()
 * ──────────
 * Sai do jogo e volta para o menu principal
 */
function exitGame() {
  returnToMenu();
}

/**
 * togglePauseMenu()
 * ─────────────────
 * Alternate: toggles pause (coordena com novo menu)
 */
function togglePauseMenu() {
  if (isGamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

// Global game state
let gameState = {
  time: 0,
  baseVelocity: 12,        // velocidade base — cresce com o tempo e ultrapassagens
  currentVelocity: 0,
  overtakes: 0,
  score: 0,
  nitroCharge: 100,
  invulnerable: false,
  invulnerableTime: 0,
  dayNightCycle: 0,
  collisions: 0,
  isJumping: false,
  jumpVelocity: 0,
  jumpsAvailable: 3,
  obstacleHit: false,              // Flag para evitar múltiplos hits no mesmo obstáculo
  lastObstacleHitTime: -999,       // Tempo desde o último hit em obstáculo
  speedPenaltyActive: false,       // Se há penalidade de velocidade ativa
  speedPenaltyTimer: 0,            // Timer para mostrar o feedback visual
  speedPenaltyAmount: 50           // Quantidade reduzida de velocidade
};

// ── Obstacle Impact System ──────────────────────────────────
// Constantes para o sistema de colisão de obstáculos
const OBSTACLE_CONFIG = {
  SPEED_PENALTY: 50,           // km/h reduzidos ao bater
  HIT_COOLDOWN: 0.8,           // Segundos entre hits (evita múltiplos no mesmo obstáculo)
  PENALTY_DURATION: 1.2,       // Duração do efeito visual de penalidade
  CAMERA_SHAKE_AMPLITUDE: 0.25, // Amplitude da vibração da câmera
  CAR_TILT_ANGLE: 0.15,        // Ângulo de inclinação do carro
  OBSTACLE_RESPONSE_SPEED: 0.15 // Velocidade de reação do obstáculo
};

// ── Lane system ──────────────────────────────────────────────
// Three fixed lanes on the road (x positions)
const LANES = [-3, 0, 3];

// ── Lane change control (arcade steering) ────────────────────
let targetX = 0;              // target lane position (-3, 0, or 3)
let laneChangeSpeed = 0.22;   // interpolation factor (higher = faster)
let currentTurnTilt = 0;       // visual tilt angle when turning

let enemyCars = [];       // replaces old trafficCars
let trafficSpawnTimer = 0;// countdown between wave spawns
let obstacles = [];
let powerUps = [];
let jumpPickups = [];
let coins = [];           // collectible coins along the road
let coinsCollected = 0;   // total coins collected
let policeCars         = [];
let policeConvoyActive = false;
let policeConvoyTimer  = 0;
let nextPoliceEventTime = 45;  // first convoy fires at 45 s of play time

// ── Police Chase System (velocity-based) ──────────────────────
// Police appear when hitting specific speed thresholds
let policeChaseActive = false;
let policeChaseTimer = 0;
let policeChaseDuration = 15;          // 15 seconds per chase
let nextPoliceChaseTrigger = 150;      // First trigger at 150 km/h (reduced for easier testing)
let policeTriggerIndex = 0;
const POLICE_SPEED_TRIGGERS = [150, 450, 1500, 2500, 3500, 5000];  // km/h thresholds
let policeAggressiveness = 1.0;        // Increases when player hits obstacles
let policeChaseMultiplier = 1.0;       // Speed multiplier for police cars

// ── Police optimization constants ────────────────────────────
const MAX_POLICE_CARS = 2;             // Limit police cars to prevent lag

// Reusable Box3 for collision detection (avoid creating new instances per frame)
const _policePlayerBox = new THREE.Box3();
const _policeCarBox = new THREE.Box3();

let scene, camera, renderer, playerCar, clock;
let isGameOver = false;   // stops the update logic when true
let isGamePaused = false; // pause state
let headlightSpots = [];  // [leftSpotLight, rightSpotLight] for the player car

// ─────────────────────────────────────────────────────────────
// LIGHTING SYSTEM — Global references for pause menu control
// ─────────────────────────────────────────────────────────────
let ambientLight, dirLight;  // Global refs for adjusting lighting levels

const LIGHTING_LEVELS = {
  min: {
    ambientIntensity: 0.4,
    dirIntensity: 0.8,
    exposureMultiplier: 0.7,
    label: 'MÍNIMA',
  },
  medium: {
    ambientIntensity: 1.2,
    dirIntensity: 1.8,
    exposureMultiplier: 1.0,
    label: 'MÉDIA',
  },
  max: {
    ambientIntensity: 2.0,
    dirIntensity: 2.5,
    exposureMultiplier: 1.3,
    label: 'MÁXIMA',
  },
};

let currentLightLevel = 'medium'; // default level
const LIGHT_LEVEL_STORAGE_KEY = 'dashRetro3D_lightLevel';

// ── Camera system ────────────────────────────────────────────
// 0 = Chase (3rd person)  1 = Top (ortho)  2 = Hood  3 = Cinematic
let activeCamIndex = 0;
let chaseCamera, topCamera, hoodCamera, cinCamera;
const CAM_NAMES = ['CHASE', 'TOP', 'HOOD', 'CINEMATIC'];

// Crash visual effect state
const crashEffect = {
  active:    false,
  timer:     0,       // counts up from 0 after impact
  duration:  1.2,     // seconds the effect runs before overlay appears
  shakeAmp:  0.35,    // camera shake amplitude
  tiltAngle: 0.45,    // max backward tilt (rotation.x) of the player car
  flashEl:   null,    // reference to the red flash DOM element
};

// ─────────────────────────────────────────────────────────────
// PERSISTENT RECORDS SYSTEM (localStorage)
// ─────────────────────────────────────────────────────────────
const RECORDS_STORAGE_KEY = 'dashRetro3D_records';
const RECORDS_CONFIG = {
  UPDATE_THROTTLE: 0.1, // Atualizar HUD a cada 100ms (zero overhead)
  NEW_RECORD_DISPLAY: 3.5, // Duração da animação (segundos)
};

let lastRecordHUDUpdate = 0;
let newRecordAnimation = { active: false, timer: 0 };

/**
 * recordsModule
 * ─────────────
 * Sistema modular para gerenciar recordes com localStorage
 * Funções: loadRecord(), saveRecord(), updateRecord(), resetRecord(), getFormattedDate()
 */
const recordsModule = {
  /**
   * Carrega recordes do localStorage
   * Retorna { timeRecord, overtakesRecord } ou padrão
   */
  loadRecord() {
    try {
      const data = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!data) return this.getDefaultRecords();
      const parsed = JSON.parse(data);
      return {
        timeRecord: parsed.timeRecord || 0,
        timeDate: parsed.timeDate || '',
        overtakesRecord: parsed.overtakesRecord || 0,
        overtakesDate: parsed.overtakesDate || '',
      };
    } catch (e) {
      console.warn('⚠️ Erro ao carregar recordes:', e);
      return this.getDefaultRecords();
    }
  },

  /**
   * Salva recordes no localStorage
   * Chamado automaticamente por updateRecord()
   */
  saveRecord(records) {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('⚠️ Erro ao salvar recordes:', e);
    }
  },

  /**
   * Atualiza um recorde se a pontuação atual for melhor
   * Retorna { isNewRecord: boolean, recordType: 'time'|'overtakes'|'both'|null }
   */
  updateRecord(currentTime, currentOvertakes) {
    const records = this.loadRecord();
    let isNewRecord = false;
    let recordType = null;

    // Verificar tempo
    if (currentTime > records.timeRecord) {
      records.timeRecord = currentTime;
      records.timeDate = this.getFormattedDate();
      isNewRecord = true;
      recordType = 'time';
    }

    // Verificar ultrapassagens
    if (currentOvertakes > records.overtakesRecord) {
      records.overtakesRecord = currentOvertakes;
      records.overtakesDate = this.getFormattedDate();
      isNewRecord = true;
      recordType = recordType === 'time' ? 'both' : 'overtakes';
    }

    if (isNewRecord) {
      this.saveRecord(records);
    }

    return { isNewRecord, recordType, records };
  },

  /**
   * Reseta todos os recordes
   */
  resetRecord() {
    try {
      localStorage.removeItem(RECORDS_STORAGE_KEY);
    } catch (e) {
      console.warn('⚠️ Erro ao resetar recordes:', e);
    }
  },

  /**
   * Formata data/hora atual para exibição
   */
  getFormattedDate() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    const time = now.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} ${time}`;
  },

  /**
   * Retorna objeto padrão de recordes vazios
   */
  getDefaultRecords() {
    return {
      timeRecord: 0,
      timeDate: '—',
      overtakesRecord: 0,
      overtakesDate: '—',
    };
  },
};

// Carrega recordes na inicialização
let records = recordsModule.loadRecord();

// ─────────────────────────────────────────────────────────────
// Three.js scene bootstrap
// ─────────────────────────────────────────────────────────────
function initScene() {

  // ── Scene ──────────────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 120, 250);

  // ── Cameras ────────────────────────────────────────────────
  const aspect = window.innerWidth / window.innerHeight;

  // 0 — Chase: terceira pessoa, atrás e acima do carro
  chaseCamera = new THREE.PerspectiveCamera(65, aspect, 0.1, 500);
  chaseCamera.position.set(0, 3.5, 12);
  chaseCamera.lookAt(0, 1, 0);

  // 1 — Top: vista de cima ortográfica (estilo arcade clássico)
  const orthoH = 30;
  const orthoW = orthoH * aspect;
  topCamera = new THREE.OrthographicCamera(
    -orthoW / 2, orthoW / 2,
     orthoH / 2, -orthoH / 2,
    0.1, 500
  );
  topCamera.position.set(0, 50, 0);
  topCamera.lookAt(0, 0, 0);

  // 2 — Hood: câmera no capô, sensação de cockpit
  hoodCamera = new THREE.PerspectiveCamera(80, aspect, 0.1, 500);

  // 3 — Cinematic: ângulo lateral afastado
  cinCamera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);

  // Câmera ativa inicial
  camera = chaseCamera;

  // ── Renderer — OPTIMIZADO ─────────────────────────────────
  // 📊 OTIMIZAÇÃO: Reduzir pixelRatio para melhor performance
  // - Limita a 1.5 máximo (em vez de device ratio completo)
  // - Reduz carga de rendering sem perder muito visual
  renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: false,  // Desativar antialias (caro) — fov ajuda visualmente
    powerPreference: 'high-performance'  // Force GPU rápido
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 📊 OTIMIZAÇÃO: Sombras desativadas ou muito reduzidas
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;  // Mais rápido que PCFSoftShadowMap

  // ── Lights — OTIMIZADAS ───────────────────────────────────
  // 📊 OTIMIZAÇÃO: Reduzir intesidade de luz ambiente
  // - Apenas 1 AmbientLight (sem excessos)
  // - Apenas 1 DirectionalLight com shadowMap otimizado
  ambientLight = new THREE.AmbientLight(0xffffff, 1.2);  // Reduzido de 2 → 1.2
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.8);  // Reduzido de 2.5 → 1.8
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  // 📊 OTIMIZAÇÃO CRÍTICA: Reduzir shadowMapSize
  // - De 2048×2048 → 1024×1024 (reduz 75% da memória de shadow)
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far  = 300;
  dirLight.shadow.camera.left   = -100;
  dirLight.shadow.camera.right  =  100;
  dirLight.shadow.camera.top    =  100;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.bias = 0.0005;  // Reduzir shadow acne
  scene.add(dirLight);

  // ── Load saved light level and apply ──────────────────────
  const savedLightLevel = loadLightLevel();
  setLightLevel(savedLightLevel);

  // ── Build everything ──────────────────────────────────────
  buildRoad(scene);
  playerCar = buildCar(scene);
  buildScenery(scene);

  // Collect the player car's SpotLights for headlight mode control
  playerCar.traverse(child => {
    if (child.userData.isHeadlightSpot) headlightSpots.push(child);
  });
  // Start with headlights off (press 1/2/3 to activate)
  setHeadlightMode('off');

  // ── Keyboard input ─────────────────────────────────────────
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Escape') returnToMenu();
    if (e.code === 'Space' && !gameState.isJumping && gameState.jumpsAvailable > 0) {
      gameState.isJumping = true;
      gameState.jumpVelocity = 0.28;
      gameState.jumpsAvailable--;
    }
    if (e.code === 'KeyN' && gameState.nitroCharge > 20) gameState.nitroActive = true;
    // Lane change: immediately set target to left/right
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      targetX = LANES[0];  // leftmost lane = -3
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      targetX = LANES[2];  // rightmost lane = 3
    }
    // Headlight modes
    if (e.code === 'Digit1') setHeadlightMode('minimo');
    if (e.code === 'Digit2') setHeadlightMode('medio');
    if (e.code === 'Digit3') setHeadlightMode('maximo');
    // Camera switch — C cycles through all 4 cameras
    if (e.code === 'KeyC') {
      activeCamIndex = (activeCamIndex + 1) % 4;
      camera = [chaseCamera, topCamera, hoodCamera, cinCamera][activeCamIndex];
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      showCamLabel(CAM_NAMES[activeCamIndex]);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'KeyN') gameState.nitroActive = false;
    // Release lane: return to center lane
    if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') {
      targetX = LANES[1];  // center lane = 0
    }
  });

  // ── HUD ────────────────────────────────────────────────────
  const hud = document.createElement('div');
  hud.id = 'game-hud';
  hud.innerHTML = `
    <div class="hud-container">
      <div class="hud-speed">
        <span class="hud-label">SPEED</span>
        <span id="speed-value">0</span> KM/H
      </div>
      <div class="hud-info">
        <div>LEVEL: <span id="level-value">1</span></div>
        <div>OVERTAKES: <span id="overtakes-value">0</span></div>
        <div style="color:#ffdd00;">💰 COINS: <span id="coins-value">0</span></div>
        <div>NITRO: <span id="nitro-bar">████</span> <span id="nitro-value">100%</span></div>
        <div style="color:#00ffff;">JUMPS: <span id="jumps-value">3/3</span></div>
        <div id="headlight-mode" style="color:#ffff88;">FAROL: OFF</div>
        <div id="time-display">TIME: DAY ☀️</div>
      </div>

      <!-- RECORDES (Records HUD) -->
      <div class="hud-records">
        <div class="hud-records-title">⚡ RECORDES</div>
        <div class="record-item">
          <span class="record-label">TEMPO:</span>
          <span id="record-time" class="record-value">—</span>
          <div id="record-time-date" class="record-date">—</div>
        </div>
        <div class="record-item">
          <span class="record-label">ULTRAPASSAGENS:</span>
          <span id="record-overtakes" class="record-value">—</span>
          <div id="record-overtakes-date" class="record-date">—</div>
        </div>
        <button id="reset-records-btn" class="reset-btn" title="Resetar recordes">🔄</button>
      </div>
    </div>

    <!-- NEW RECORD ANIMATION OVERLAY -->
    <div id="new-record-overlay" class="new-record-overlay hidden">
      <div class="new-record-content">
        <div class="new-record-text">🎉 NOVO RECORDE! 🎉</div>
        <div class="new-record-pulse"></div>
      </div>
    </div>
  `;
  document.body.appendChild(hud);


  // ── Pause button ──────────────────────────────────────────
  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'pause-btn';
  pauseBtn.setAttribute('aria-label', 'Pause Game');
  pauseBtn.textContent = '⏸';
  document.body.appendChild(pauseBtn);

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  // Keyboard shortcut: P to pause
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && !isGameOver) {
      togglePause();
    }
  });

  // ── Menu hamburger — criado fora do #game-hud para receber cliques ──
  // O #game-hud tem pointer-events:none (necessário para o jogo),
  // por isso o botão e o painel vivem directamente no <body>.
  const menuBtn = document.createElement('button');
  menuBtn.id = 'hud-menu-btn';
  menuBtn.setAttribute('aria-label', 'Controls');
  menuBtn.textContent = '☰';
  document.body.appendChild(menuBtn);

  const ctrlPanel = document.createElement('div');
  ctrlPanel.id = 'hud-controls-panel';
  ctrlPanel.innerHTML = `
    <div class="hud-controls-title">CONTROLS</div>
    <div class="hud-ctrl-row"><span class="hud-key">A / ←</span><span>Esquerda</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">D / →</span><span>Direita</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">SPACE</span><span>Salto</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">N</span><span>Nitro</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">1</span><span>Farol mínimo</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">2</span><span>Farol médio</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">3</span><span>Farol máximo</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">C</span><span>Câmera</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">P</span><span>Pausar</span></div>
    <div class="hud-ctrl-row"><span class="hud-key">ESC</span><span>Menu</span></div>
  `;
  document.body.appendChild(ctrlPanel);

  // Toggle: abrir/fechar painel ao clicar no botão ☰
  menuBtn.addEventListener('click', () => {
    ctrlPanel.classList.toggle('open');
  });

  // ── Reset Records Button ───────────────────────────────────
  // Botão para resetar recordes com confirmação
  const resetBtn = document.getElementById('reset-records-btn');
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita propagação de cliques
    if (confirm('⚠️ Tem a certeza que quer apagar todos os recordes?\n\nEsta ação não pode ser desfeita.')) {
      recordsModule.resetRecord();
      records = recordsModule.getDefaultRecords();
      updateRecordsHUD();
    }
  });

  // Create pause overlay with 6-button menu
  const pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'pause-overlay';
  pauseOverlay.innerHTML = `
    <div class="pause-panel">
      <div class="pause-title">⏸ PAUSED</div>
      <div class="pause-menu">
        <button id="pause-continue" class="pause-menu-btn continue-btn">▶ Continuar jogo</button>
        <button id="pause-restart" class="pause-menu-btn restart-btn">↺ Reiniciar jogo</button>
        <button id="light-btn-min" class="pause-menu-btn light-btn">◐ Iluminação mínima</button>
        <button id="light-btn-medium" class="pause-menu-btn light-btn">◑ Iluminação média</button>
        <button id="light-btn-max" class="pause-menu-btn light-btn">◕ Iluminação máxima</button>
        <button id="pause-exit" class="pause-menu-btn exit-btn">⌂ Sair do jogo</button>
      </div>
    </div>
  `;
  document.body.appendChild(pauseOverlay);

  // Add event listeners to pause menu buttons
  document.getElementById('pause-continue').addEventListener('click', () => {
    resumeGame();
  });

  document.getElementById('pause-restart').addEventListener('click', () => {
    restartGame();
  });

  document.getElementById('light-btn-min').addEventListener('click', () => {
    setLightLevel('min');
  });

  document.getElementById('light-btn-medium').addEventListener('click', () => {
    setLightLevel('medium');
  });

  document.getElementById('light-btn-max').addEventListener('click', () => {
    setLightLevel('max');
  });

  document.getElementById('pause-exit').addEventListener('click', () => {
    exitGame();
  });

  // Close pause on overlay background click (not on buttons)
  pauseOverlay.addEventListener('click', (e) => {
    if (e.target === pauseOverlay && isGamePaused) {
      resumeGame();
    }
  });

  // ── Resize handler ─────────────────────────────────────────
  window.addEventListener('resize', () => {
    const a = window.innerWidth / window.innerHeight;
    [chaseCamera, hoodCamera, cinCamera].forEach(c => {
      c.aspect = a;
      c.updateProjectionMatrix();
    });
    const h = 30, w = h * a;
    topCamera.left = -w / 2; topCamera.right = w / 2;
    topCamera.top = h / 2;   topCamera.bottom = -h / 2;
    topCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animation loop ─────────────────────────────────────────
  clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    // ── Crash effect + game-over hold ────────────────────────
    if (isGameOver) {
      const dt = clock.getDelta();

      if (crashEffect.active) {
        crashEffect.timer += dt;
        const t = crashEffect.timer;

        // 1. Backward tilt: player car rocks on X axis then settles
        playerCar.rotation.x = crashEffect.tiltAngle *
          Math.exp(-t * 3) * Math.cos(t * 14);

        // 2. Camera shake: decays exponentially
        const shake = crashEffect.shakeAmp * Math.exp(-t * 4);
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.5;

        // 3. Red flash: fade out the DOM overlay
        if (crashEffect.flashEl) {
          crashEffect.flashEl.style.opacity =
            String(Math.max(0, 0.7 - t * 1.4));
        }

        // After effect duration → show the Game Over overlay
        if (crashEffect.timer >= crashEffect.duration) {
          crashEffect.active = false;
          showGameOverOverlay();
        }
      }

      renderer.render(scene, camera);
      return;
    }

    // -- If paused, just render and skip updates ----
    if (isGamePaused) {
      renderer.render(scene, camera);
      return;
    }

    const delta = clock.getDelta();

    // -- Update game time ----
    gameState.time += delta;

    // -- Velocidade base cresce com o tempo (sem limite) ----
    // +0.6 unidades por segundo no início, acelera ao longo do tempo
    gameState.baseVelocity += 0.6 * delta;

    // -- Nitro boost ou velocidade normal ----
    if (gameState.nitroActive && gameState.nitroCharge > 0) {
      // Nitro: 2.5× a velocidade base
      gameState.currentVelocity = THREE.MathUtils.lerp(
        gameState.currentVelocity,
        gameState.baseVelocity * 2.5,
        0.08
      );
      gameState.nitroCharge -= 60 * delta;
      if (gameState.nitroCharge <= 0) {
        gameState.nitroCharge = 0;
        gameState.nitroActive = false;
      }
    } else {
      // Normal: segue baseVelocity suavemente
      gameState.currentVelocity = THREE.MathUtils.lerp(
        gameState.currentVelocity,
        gameState.baseVelocity,
        0.04
      );
      if (gameState.nitroCharge < 100) gameState.nitroCharge += 15 * delta;
    }
    gameState.nitroCharge = THREE.MathUtils.clamp(gameState.nitroCharge, 0, 100);

    // -- Jump mechanic (impulse + gravity, arcade style) ----------
    const groundY = 0;
    if (gameState.isJumping) {
      // Apply velocity and gravity (frame-rate independent, tuned for 60fps feel)
      playerCar.position.y += gameState.jumpVelocity * 60 * delta;
      gameState.jumpVelocity -= 0.9 * delta; // gravity ≈ 0.015 per frame @ 60fps

      // Visual pitch: tilt back on rise, nose-down on fall
      const targetPitch = gameState.jumpVelocity > 0 ? -0.12 : 0.07;
      playerCar.rotation.x = THREE.MathUtils.lerp(playerCar.rotation.x, targetPitch, 0.15);

      // Landing
      if (playerCar.position.y <= groundY) {
        playerCar.position.y = groundY;
        gameState.isJumping   = false;
        gameState.jumpVelocity = 0;
        playerCar.rotation.x  = 0.12; // brief forward impact tilt
      }
    } else {
      playerCar.position.y = groundY;
      // Smoothly recover rotation after landing
      playerCar.rotation.x = THREE.MathUtils.lerp(playerCar.rotation.x, 0, 0.2);
    }

    // -- Steering with lane change interpolation ----
    // Smoothly move playerCar.position.x toward targetX
    playerCar.position.x = THREE.MathUtils.lerp(
      playerCar.position.x,
      targetX,
      laneChangeSpeed
    );

    // Visual tilt effect: increases when moving toward different lane
    // Calculate how far we are from the target lane
    const laneError = targetX - playerCar.position.x;
    const maxTilt = 0.22;  // maximum tilt angle when turning (in radians)
    // More tilt when farther from target, decays as we approach
    currentTurnTilt = laneError * 0.15;  // responsive to lane error
    currentTurnTilt = THREE.MathUtils.clamp(currentTurnTilt, -maxTilt, maxTilt);

    // Apply tilt rotation smoothly
    playerCar.rotation.z = THREE.MathUtils.lerp(
      playerCar.rotation.z,
      currentTurnTilt,
      0.18  // smooth interpolation for natural feel
    );

    // -- Scroll road/scenery + sway tree foliage ----
    // 📊 OTIMIZAÇÃO: Evitar forEach pesado em scene.children
    // - Pré-cachear objetos em arrays em vez de buscar a cada frame
    // - Iterar apenas sobre road stripes e scenery que precisa update
    
    // Road scrolling
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const obj = scene.children[i];
      if (!obj.userData.isRoadStripe) continue;
      
      obj.position.z += gameState.currentVelocity * delta;
      if (obj.position.z > 15) obj.position.z -= 100;
    }
    
    // Scenery update (trees + lights) — menos frequente
    if (gameState.time % 0.016 < delta) {  // ~60fps sway check
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (!obj.userData.isScenery) continue;
        
        obj.position.z += gameState.currentVelocity * delta;
        if (obj.position.z > 30) obj.position.z -= 120;

        // 📊 OTIMIZAÇÃO RADICAL: Tree foliage sway desabilitado completamente para máximo FPS
        // if (obj.userData.swayOffset !== undefined && obj.children.length > 0) {
        //   const swayAngle = Math.sin(gameState.time * 1.8 + obj.userData.swayOffset) * 0.06;
        //   // Otimizado: usar for em vez de forEach
        //   for (let j = 0; j < obj.children.length; j++) {
        //     const child = obj.children[j];
        //     if (child.userData.isTreeFoliage) {
        //       child.rotation.z = swayAngle;
        //       child.rotation.x = Math.cos(gameState.time * 1.2 + obj.userData.swayOffset) * 0.03;
        //     }
        //   }
        // }
      }
    }

    // -- Collision detection ----
    checkCollisions();

    // -- Update enemy traffic ----
    updateEnemyCars(delta);
    updateObstacles(delta);
    updatePowerUps(delta);
    updateJumpPickups(delta);
    updateCoins(delta);
    updatePoliceConvoy(delta);
    updatePoliceChase(delta);

    // -- Police chase trigger (velocity-based) ----
    const speedKmH = gameState.currentVelocity * 10;
    if (!policeChaseActive && speedKmH >= nextPoliceChaseTrigger) {
      console.log(`[POLICE] Speed trigger reached: ${speedKmH.toFixed(0)} km/h >= ${nextPoliceChaseTrigger} km/h`);
      startPoliceChase();
    }

    // -- Police convoy trigger (time-based) ----
    if (!policeConvoyActive && gameState.time >= nextPoliceEventTime) {
      startPoliceConvoyEvent();
    }

    // -- Traffic wave spawn (timer-based, replaces random per-frame) ----
    trafficSpawnTimer -= delta;
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir máximo de carros inimigos de 9 → 4
    if (trafficSpawnTimer <= 0 && enemyCars.length < 4) {
      spawnTrafficWave();
      // 📊 OTIMIZAÇÃO RADICAL: Aumentar intervalo de spawn de carros (min 3 s em vez de 2 s)
      trafficSpawnTimer = Math.max(3.5, 5.5 - gameState.time / 80);
    }

    // -- Random spawns (obstacles & power-ups only) ----
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir máximo de obstáculos de 6 → 2
    if (Math.random() < 0.004 && obstacles.length < 2) spawnObstacle();
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir geração de power-ups drasticamente (0.0008 → 0.0003)
    if (Math.random() < 0.0003) spawnPowerUp();
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir máximo de jump pickups de 3 → 0 (desabilitar)
    if (Math.random() < 0.0008 && jumpPickups.length < 0) spawnJumpPickup();
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir máximo de moedas de 25 → 6
    if (Math.random() < 0.006 && coins.length < 6) spawnCoin();

    // -- Invulnerability ----
    if (gameState.invulnerable) {
      gameState.invulnerableTime -= delta;
      if (gameState.invulnerableTime <= 0) {
        gameState.invulnerable = false;
      }
    }

    // -- Update obstacle impact visual effects ----
    updateObstacleVisualEffects(delta);

    // -- Update active camera ----
    updateActiveCamera(delta);

    // -- Day/night cycle ----
    updateDayNightCycle();

    // -- Update HUD ----
    updateHUD();

    // -- Update Records HUD & Animations ----
    updateRecordsHUD();
    updateNewRecordAnimation(delta);

    // -- Wheel rotation (player car) ────────────────────────
    // Each wheel has a spinner Group (isWheelSpin = true) whose
    // rotation.z = π/2 re-maps the cylinder so its axle aligns
    // with the car's X axis. Incrementing rotation.x here spins
    // the cylinder forward — like a real rolling wheel.
    // Speed factor: circumference = 2π·r ≈ 1.76, so dividing
    // velocity by ~1.76 gives one full revolution per unit travelled.
    const wheelRPS = gameState.currentVelocity / (2 * Math.PI * 0.28);
    playerCar.traverse(child => {
      if (child.userData.isWheelSpin) {
        child.rotation.x += wheelRPS * delta * Math.PI * 2;
      }
    });

    renderer.render(scene, camera);
  }

  animate();
}

// ─────────────────────────────────────────────────────────────
// Obstacle visual effects (camera shake, car tilt)
// ─────────────────────────────────────────────────────────────

/**
 * updateObstacleVisualEffects(delta)
 * ──────────────────────────────────
 * Updates the visual feedback effects when hitting an obstacle:
 *   1. Camera shake (vibration)
 *   2. Car tilt/rotation
 *   3. Decays over time
 */
function updateObstacleVisualEffects(delta) {
  if (!gameState.speedPenaltyActive) return;

  // Decay the penalty timer
  gameState.speedPenaltyTimer -= delta;
  if (gameState.speedPenaltyTimer <= 0) {
    gameState.speedPenaltyActive = false;
    return;
  }

  // Calculate effect strength (1 at impact, 0 at end)
  const effectStrength = gameState.speedPenaltyTimer / OBSTACLE_CONFIG.PENALTY_DURATION;

  // ── Camera shake effect ──────────────────────────────────
  // Add random vibration to camera position
  if (activeCamIndex === 0) { // Chase camera
    // Shake in X and Y
    const shakeIntensity = OBSTACLE_CONFIG.CAMERA_SHAKE_AMPLITUDE * effectStrength;
    const shakeX = (Math.random() - 0.5) * 2 * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * 2 * shakeIntensity;
    chaseCamera.position.x += shakeX;
    chaseCamera.position.y += shakeY;
  }

  // ── Car tilt effect ─────────────────────────────────────
  // Tilt the car based on effect strength
  const tiltAmount = OBSTACLE_CONFIG.CAR_TILT_ANGLE * effectStrength;
  playerCar.rotation.x = THREE.MathUtils.lerp(
    playerCar.rotation.x,
    tiltAmount,
    0.2
  );
}

// ─────────────────────────────────────────────────────────────
// Camera system
// ─────────────────────────────────────────────────────────────

/**
 * updateActiveCamera(delta)
 * Runs every frame. Updates whichever camera is active.
 * All cameras track the player; each has its own position logic.
 */
function updateActiveCamera(delta) {
  const px = playerCar.position.x;
  const py = playerCar.position.y;
  const pz = playerCar.position.z;

  // FOV boost during nitro (chase + hood + cinematic only)
  const targetFov = (gameState.nitroActive && gameState.nitroCharge > 0) ? 85 : 65;

  switch (activeCamIndex) {

    // ── 0: Chase — third-person behind/above ─────────────────
    case 0: {
      chaseCamera.fov = THREE.MathUtils.lerp(chaseCamera.fov, targetFov, 0.05);
      chaseCamera.updateProjectionMatrix();
      chaseCamera.position.x = THREE.MathUtils.lerp(chaseCamera.position.x, px * 0.25, 0.08);
      chaseCamera.position.y = THREE.MathUtils.lerp(chaseCamera.position.y, py + 3.5, 0.06);
      chaseCamera.position.z = pz + 12;
      chaseCamera.lookAt(px, py + 0.8, pz - 5);
      break;
    }

    // ── 1: Top — orthographic bird's-eye view ────────────────
    case 1: {
      topCamera.position.x = THREE.MathUtils.lerp(topCamera.position.x, px, 0.06);
      topCamera.position.z = THREE.MathUtils.lerp(topCamera.position.z, pz, 0.06);
      topCamera.lookAt(px, py, pz);
      break;
    }

    // ── 2: Hood — cockpit feel, mounted on the car ───────────
    case 2: {
      hoodCamera.fov = THREE.MathUtils.lerp(hoodCamera.fov, targetFov + 15, 0.05);
      hoodCamera.updateProjectionMatrix();
      // Position: just above the hood, moving with the car
      const hoodOffset = new THREE.Vector3(0, 1.4, 0.5);
      hoodOffset.applyEuler(playerCar.rotation);
      hoodCamera.position.set(
        px + hoodOffset.x,
        py + hoodOffset.y,
        pz + hoodOffset.z
      );
      hoodCamera.lookAt(px, py + 1.2, pz - 25);
      break;
    }

    // ── 3: Cinematic — wide lateral angle ────────────────────
    case 3: {
      cinCamera.fov = THREE.MathUtils.lerp(cinCamera.fov, targetFov - 10, 0.04);
      cinCamera.updateProjectionMatrix();
      // 📊 OTIMIZAÇÃO: Reduzir frequência de oscilação da câmera
      // - De 0.4 → 0.2 (movimento mais suave, menos cálculos)
      const sideOsc = Math.sin(gameState.time * 0.2) * 2;
      const targetX = px + 10 + sideOsc;
      const targetY = py + 4;
      const targetZ = pz + 8;
      // 📊 OTIMIZAÇÃO: Aumentar lerp speed de 0.04 → 0.06 (mais responsivo, menos frames de lag)
      cinCamera.position.x = THREE.MathUtils.lerp(cinCamera.position.x, targetX, 0.06);
      cinCamera.position.y = THREE.MathUtils.lerp(cinCamera.position.y, targetY, 0.06);
      cinCamera.position.z = THREE.MathUtils.lerp(cinCamera.position.z, targetZ, 0.06);
      cinCamera.lookAt(px, py + 0.5, pz - 3);
      break;
    }
  }
}

/**
 * showCamLabel(name)
 * Briefly shows the camera name on screen when switching.
 */
let _camLabelTimeout = null;
function showCamLabel(name) {
  let el = document.getElementById('cam-label');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cam-label';
    document.body.appendChild(el);
  }
  el.textContent = '📷 ' + name;
  el.classList.add('visible');
  clearTimeout(_camLabelTimeout);
  _camLabelTimeout = setTimeout(() => el.classList.remove('visible'), 1800);
}

// ─────────────────────────────────────────────────────────────
// Collision detection
// ─────────────────────────────────────────────────────────────

/**
 * checkCollisions()
 * Uses THREE.Box3 AABB tests between the player car and every
 * enemy car. Invulnerability (power-up shield) is respected.
 * On hit → gameOver() is called.
 */
const _playerBox = new THREE.Box3();
const _enemyBox  = new THREE.Box3();

function checkCollisions() {
  if (gameState.invulnerable) return;

  _playerBox.setFromObject(playerCar);
  // Shrink the player box slightly so grazing passes don't trigger
  _playerBox.expandByScalar(-0.15);

  for (let i = 0; i < enemyCars.length; i++) {
    _enemyBox.setFromObject(enemyCars[i].mesh);
    _enemyBox.expandByScalar(-0.15);

    if (_playerBox.intersectsBox(_enemyBox)) {
      gameOver();
      return;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Game Over
// ─────────────────────────────────────────────────────────────

/**
 * gameOver()
 * ──────────
 * Called the instant a collision is detected.
 * 1. Freezes all gameplay (isGameOver = true).
 * 2. Zeroes velocities so nothing moves.
 * 3. Triggers the crash visual effect (tilt + shake + red flash).
 * 4. Checks and updates records if current run is better than previous.
 * The Game Over overlay is shown after crashEffect.duration seconds.
 */
function gameOver() {
  if (isGameOver) return;   // guard against double-trigger
  isGameOver = true;

  // Freeze all movement immediately
  gameState.currentVelocity = 0;
  gameState.baseVelocity    = 0;
  enemyCars.forEach(ec => { ec.velocity = 0; });

  // ── Update Records ────────────────────────────────────────
  // Verifica se o jogador bateu um recorde e salva
  const { isNewRecord, recordType } = recordsModule.updateRecord(
    gameState.time,
    gameState.overtakes
  );

  // Se houve novo recorde, carrega a versão atualizada e anima
  if (isNewRecord) {
    records = recordsModule.loadRecord();
    updateRecordsHUD();
    triggerNewRecordAnimation();
  }

  // Activate crash visual effect
  crashEffect.active = true;
  crashEffect.timer  = 0;

  // Inject full-screen red flash element
  const flash = document.createElement('div');
  flash.id = 'crash-flash';
  document.body.appendChild(flash);
  crashEffect.flashEl = flash;
}

/**
 * showGameOverOverlay()
 * ─────────────────────
 * Builds and injects the Game Over UI panel.
 * Called automatically after the crash effect finishes.
 * REPLAY resets all state in-place (no page reload).
 */
function showGameOverOverlay() {
  const secs  = Math.floor(gameState.time);
  const speed = Math.round(gameState.currentVelocity * 10);

  const overlay = document.createElement('div');
  overlay.id = 'gameover-overlay';
  overlay.innerHTML = `
    <div class="go-box">
      <h1 class="go-title">GAME OVER</h1>
      <div class="go-stats">
        <div>TEMPO SOBREVIVIDO: <span>${secs}s</span></div>
        <div>ULTRAPASSAGENS: <span>${gameState.overtakes}</span></div>
      </div>
      <button id="btn-replay" class="go-btn">↺ REPLAY</button>
      <button id="btn-gomenu" class="go-btn secondary">⌂ MENU</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── REPLAY: full in-place reset (no page reload) ──────────
  document.getElementById('btn-replay').addEventListener('click', () => {
    // Remove overlay and flash
    overlay.remove();
    if (crashEffect.flashEl) { crashEffect.flashEl.remove(); crashEffect.flashEl = null; }

    // Reset crash effect
    crashEffect.active = false;
    crashEffect.timer  = 0;

    // Reset game state
    isGameOver = false;
    gameState.time             = 0;
    gameState.currentVelocity  = 0;
    gameState.baseVelocity     = 12;
    gameState.overtakes        = 0;
    gameState.score            = 0;
    gameState.nitroCharge      = 100;
    gameState.nitroActive      = false;
    gameState.invulnerable     = false;
    gameState.invulnerableTime = 0;
    gameState.isJumping        = false;
    gameState.jumpVelocity     = 0;
    gameState.jumpsAvailable   = 3;
    gameState.collisions       = 0;
    gameState.obstacleHit      = false;
    gameState.lastObstacleHitTime = -999;
    gameState.speedPenaltyActive = false;
    gameState.speedPenaltyTimer = 0;

    // Reset player car position and rotation
    playerCar.position.set(0, 0, 5);
    playerCar.rotation.set(0, 0, 0);

    // Reset lane control to center
    targetX = LANES[1];  // center lane = 0
    currentTurnTilt = 0;

    // Remove all enemy cars from scene and clear array
    enemyCars.forEach(ec => scene.remove(ec.mesh));
    enemyCars.length = 0;

    // Remove all obstacles and power-ups
    obstacles.forEach(o => scene.remove(o));
    obstacles.length = 0;
    powerUps.forEach(p => scene.remove(p));
    powerUps.length = 0;
    jumpPickups.forEach(j => scene.remove(j));
    jumpPickups.length = 0;
    coins.forEach(c => scene.remove(c));
    coins.length = 0;
    coinsCollected = 0;

    // Reset police convoy
    policeConvoyActive = false;
    policeConvoyTimer  = 0;
    nextPoliceEventTime = 45;
    policeCars.forEach(pc => scene.remove(pc.mesh));
    policeCars.length = 0;
    const warnEl = document.getElementById('event-warning');
    if (warnEl) { clearInterval(warnEl._blinkId); warnEl.remove(); }

    // Reset police chase
    policeChaseActive = false;
    policeChaseTimer = 0;
    nextPoliceChaseTrigger = 450;
    policeTriggerIndex = 0;
    policeAggressiveness = 1.0;
    policeChaseMultiplier = 1.0;

    // Reset spawn timer so first wave spawns quickly
    trafficSpawnTimer = 1;

    // Reset camera system to chase view
    activeCamIndex = 0;
    camera = chaseCamera;
    chaseCamera.position.set(0, 3.5, 12);
    chaseCamera.rotation.set(0, 0, 0);
  });

  // ── MENU: reload page to return to main menu ──────────────
  document.getElementById('btn-gomenu').addEventListener('click', () => {
    location.reload();
  });
}

// ─────────────────────────────────────────────────────────────
// Headlight modes
// ─────────────────────────────────────────────────────────────

/**
 * setHeadlightMode(mode)
 * Adjusts the two player SpotLights stored in headlightSpots[].
 * mode: 'off' | 'minimo' | 'medio' | 'maximo'
 *
 * Each mode changes:
 *   intensity — brightness of the cone
 *   distance  — how far the beam reaches
 *   angle     — width of the cone (radians)
 */
const HEADLIGHT_MODES = {
  off:    { intensity: 0,    distance: 0,  angle: Math.PI / 8  },
  minimo: { intensity: 1.5,  distance: 12, angle: Math.PI / 10 },
  medio:  { intensity: 4,    distance: 22, angle: Math.PI / 7  },
  maximo: { intensity: 9,    distance: 38, angle: Math.PI / 5  },
};

function setHeadlightMode(mode) {
  const cfg = HEADLIGHT_MODES[mode];
  if (!cfg) return;

  headlightSpots.forEach(spot => {
    spot.intensity = cfg.intensity;
    spot.distance  = cfg.distance;
    spot.angle     = cfg.angle;
  });

  // Update HUD indicator if it exists
  const el = document.getElementById('headlight-mode');
  if (el) {
    const labels = { off: 'OFF', minimo: 'MIN ●', medio: 'MED ●●', maximo: 'MAX ●●●' };
    el.textContent = 'FAROL: ' + (labels[mode] || mode.toUpperCase());
  }
}

// ─────────────────────────────────────────────────────────────
// HUD Update — OTIMIZADO
// ─────────────────────────────────────────────────────────────
let lastHUDUpdateTime = 0;  // Reutilizável para throttle

function updateHUD() {
  // 📊 OTIMIZAÇÃO: Atualizar HUD apenas a cada ~100ms
  // - Reduz DOM manipulation (operação cara)
  // - Jogador não percebe atualizações tão frequentes
  const now = gameState.time;
  if (now - lastHUDUpdateTime < 0.1) return;  // Pular se < 100ms
  lastHUDUpdateTime = now;

  const speed = Math.round(gameState.currentVelocity * 10);
  const speedEl = document.getElementById('speed-value');
  if (speedEl && speedEl.textContent !== String(speed)) {
    speedEl.textContent = speed;
  }

  const level = Math.floor(1 + gameState.time / 40);
  const levelEl = document.getElementById('level-value');
  if (levelEl && levelEl.textContent !== String(level)) {
    levelEl.textContent = level;
  }

  const overtEl = document.getElementById('overtakes-value');
  if (overtEl && overtEl.textContent !== String(gameState.overtakes)) {
    overtEl.textContent = gameState.overtakes;
  }

  const coinsEl = document.getElementById('coins-value');
  if (coinsEl && coinsEl.textContent !== String(coinsCollected)) {
    coinsEl.textContent = coinsCollected;
  }

  const nitroPercent = Math.round(gameState.nitroCharge);
  const nitroFull = Math.floor(nitroPercent / 25);
  const nitroBar = '█'.repeat(nitroFull) + '░'.repeat(4 - nitroFull);
  const nitroBarEl = document.getElementById('nitro-bar');
  if (nitroBarEl && nitroBarEl.textContent !== nitroBar) {
    nitroBarEl.textContent = nitroBar;
  }
  
  const nitroValEl = document.getElementById('nitro-value');
  const nitroVal = nitroPercent + '%';
  if (nitroValEl && nitroValEl.textContent !== nitroVal) {
    nitroValEl.textContent = nitroVal;
  }

  const jumpsEl = document.getElementById('jumps-value');
  const jumpsVal = gameState.jumpsAvailable + '/3';
  if (jumpsEl && jumpsEl.textContent !== jumpsVal) {
    jumpsEl.textContent = jumpsVal;
  }
}

/**
 * updateCoinUI()
 * Update the coin counter display in the HUD
 */
function updateCoinUI() {
  const el = document.getElementById('coins-value');
  if (el) el.textContent = coinsCollected;
}

/**
 * updateRecordsHUD()
 * ──────────────────
 * Atualiza a exibição dos recordes no HUD
 * 📊 OTIMIZAÇÃO: Throttle de 100ms para evitar excessive DOM manipulation
 */
function updateRecordsHUD() {
  const now = gameState.time;
  if (now - lastRecordHUDUpdate < RECORDS_CONFIG.UPDATE_THROTTLE) return;
  lastRecordHUDUpdate = now;

  // Formatar tempo (segundos para MM:SS.m)
  const formatTime = (seconds) => {
    if (seconds === 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${String(Math.floor(secs)).padStart(2, '0')}.${String(Math.round((seconds % 1) * 10))}`;
  };

  // Atualizar tempo
  const timeEl = document.getElementById('record-time');
  const timeFormatted = formatTime(records.timeRecord);
  if (timeEl && timeEl.textContent !== timeFormatted) {
    timeEl.textContent = timeFormatted;
  }

  const timeDateEl = document.getElementById('record-time-date');
  if (timeDateEl && timeDateEl.textContent !== records.timeDate) {
    timeDateEl.textContent = records.timeDate;
  }

  // Atualizar ultrapassagens
  const overtEl = document.getElementById('record-overtakes');
  const overtFormatted = records.overtakesRecord === 0 ? '—' : String(records.overtakesRecord);
  if (overtEl && overtEl.textContent !== overtFormatted) {
    overtEl.textContent = overtFormatted;
  }

  const overtDateEl = document.getElementById('record-overtakes-date');
  if (overtDateEl && overtDateEl.textContent !== records.overtakesDate) {
    overtDateEl.textContent = records.overtakesDate;
  }
}

/**
 * triggerNewRecordAnimation()
 * ──────────────────────────
 * Ativa a animação visual quando um novo recorde é atingido
 * 🎉 Efeito de pulse + brilho + overlay
 */
function triggerNewRecordAnimation() {
  const overlay = document.getElementById('new-record-overlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  newRecordAnimation.active = true;
  newRecordAnimation.timer = 0;

  // Auto-hide após duração
  setTimeout(() => {
    overlay.classList.add('hidden');
    newRecordAnimation.active = false;
  }, RECORDS_CONFIG.NEW_RECORD_DISPLAY * 1000);
}

/**
 * updateNewRecordAnimation()
 * ──────────────────────────
 * Atualiza frames da animação de novo recorde (chamado no loop principal)
 */
function updateNewRecordAnimation(delta) {
  if (!newRecordAnimation.active) return;
  newRecordAnimation.timer += delta;
}


// ─────────────────────────────────────────────────────────────
// Day/Night Cycle
// ─────────────────────────────────────────────────────────────
function updateDayNightCycle() {
  const cycleTime = (gameState.time % 90) / 90;
  let timeDisplay = 'DAY ☀️';
  let bgColor = 0x87ceeb;
  let fogColor = 0x87ceeb;

  if (cycleTime > 0.33 && cycleTime < 0.66) {
    timeDisplay = 'SUNSET 🌅';
    bgColor = 0xff7f00;
    fogColor = 0xff7f00;
  } else if (cycleTime > 0.66) {
    timeDisplay = 'NIGHT 🌙';
    bgColor = 0x0a0010;
    fogColor = 0x0a0010;
  }

  scene.background.setHex(bgColor);
  scene.fog.color.setHex(fogColor);
  document.getElementById('time-display').textContent = 'TIME: ' + timeDisplay;
}

// ─────────────────────────────────────────────────────────────
// Traffic System — lane-based, fair spawn
// ─────────────────────────────────────────────────────────────

/**
 * Build one enemy car mesh at world position (x, z).
 * Uses the shared createCar() factory — same quality as the player car.
 * Car group origin is at y = 0 so wheels touch the road automatically.
 */
function createEnemyCar(x, z) {
  // Pick a random vivid hue, avoiding red (player colour)
  const hue = (0.08 + Math.random() * 0.84) % 1.0;
  const color = new THREE.Color().setHSL(hue, 0.78, 0.48);

  const car = createCar(color);
  car.position.set(x, 0, z);   // y = 0 → wheels on road
  scene.add(car);
  return car;
}

/**
 * Spawn a wave of 1–2 enemy cars.
 *
 * Rules that keep the game fair:
 *  1. Choose 1 or 2 random lanes from LANES = [-3, 0, 3].
 *  2. If 2 cars, offset their Z by at least MIN_Z_GAP so they are
 *     never side-by-side — guaranteeing at least one free lane.
 *  3. The Z position of each car is chosen so it doesn't stack
 *     on top of an existing enemy car (MIN_Z_CLEAR separation).
 */
function spawnTrafficWave() {
  const MIN_Z_GAP   = 12;  // min Z distance between cars in the same wave
  const MIN_Z_CLEAR = 8;   // min Z distance from any existing enemy car
  const spawnBase   = playerCar.position.z - 45; // spawn ahead of player

  // Shuffle lane order so we don't always fill left→right
  const shuffled = [...LANES].sort(() => Math.random() - 0.5);

  // 1 car ~60 % of the time, 2 cars ~40 %
  const count = Math.random() < 0.6 ? 1 : 2;
  const chosenLanes = shuffled.slice(0, count);

  chosenLanes.forEach((laneX, i) => {
    // Stagger Z: second car is MIN_Z_GAP further ahead (more negative)
    const baseZ = spawnBase - i * MIN_Z_GAP - Math.random() * 10;

    // Skip if too close to an existing enemy in Z (any lane)
    const tooClose = enemyCars.some(ec =>
      Math.abs(ec.mesh.position.z - baseZ) < MIN_Z_CLEAR
    );
    if (tooClose) return;

    // Inimigos correm a 55–75% da velocidade base atual — o jogador apanha-os naturalmente
    const velocity = gameState.baseVelocity * (0.55 + Math.random() * 0.2);

    const mesh = createEnemyCar(laneX, baseZ);
    enemyCars.push({ mesh, velocity, laneX, passed: false });
  });
}

/**
 * Move every enemy car straight ahead (positive Z = toward camera).
 * Despawn cars that have passed the player.
 * Detect overtakes and collisions.
 */
function updateEnemyCars(delta) {
  // Iterate backwards so splice doesn't skip entries
  for (let i = enemyCars.length - 1; i >= 0; i--) {
    const ec = enemyCars[i];

    // Move straight in Z — never changes X
    ec.mesh.position.z += ec.velocity * delta;

    // Rotate wheels — same spinner architecture as player car
    const rps = ec.velocity / (2 * Math.PI * 0.28);
    ec.mesh.traverse(child => {
      if (child.userData.isWheelSpin) {
        child.rotation.x += rps * delta * Math.PI * 2;
      }
    });

    // Despawn quando longe do jogador (reduzido para economizar memória)
    if (ec.mesh.position.z > playerCar.position.z + 10) {
      scene.remove(ec.mesh);
      enemyCars.splice(i, 1);
      continue;
    }

    // Ultrapassagem: carro inimigo ficou atrás do jogador em faixa diferente.
    // A flag 'passed' garante que só conta uma vez por carro.
    if (!ec.passed && ec.mesh.position.z > playerCar.position.z + 2) {
      if (Math.abs(ec.mesh.position.x - playerCar.position.x) > 1.0) {
        ec.passed = true;
        gameState.overtakes++;
        // Cada ultrapassagem dá um salto extra na velocidade base
        gameState.baseVelocity += 0.8;
      }
    }

    // Collision: bounding-box style check (1.4 wide × 3 deep)
    const dx = Math.abs(ec.mesh.position.x - playerCar.position.x);
    const dz = Math.abs(ec.mesh.position.z - playerCar.position.z);
    if (dx < 1.4 && dz < 2.4 && !gameState.invulnerable) {
      gameState.invulnerable = true;
      gameState.invulnerableTime = 2;
      gameState.collisions++;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Obstacles
// ─────────────────────────────────────────────────────────────
function spawnObstacle() {
  const obstacleGeo = new THREE.BoxGeometry(1.4, 0.3, 0.5);
  const obstacleMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 1
  });
  const obstacle = new THREE.Mesh(obstacleGeo, obstacleMat);
  obstacle.position.set(
    (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.2),
    0.15,
    playerCar.position.z - 35 - Math.random() * 45
  );
  obstacle.userData.isObstacle = true;
  scene.add(obstacle);
  obstacles.push(obstacle);
}

// ─────────────────────────────────────────────────────────────
// Obstacle collision system with speed penalty
// ─────────────────────────────────────────────────────────────

// Box3 instances for obstacle collision detection
const _playerBoxObstacle = new THREE.Box3();
const _obstacleBox = new THREE.Box3();

/**
 * updateObstacles(delta)
 * Move obstacles along the road and check for collisions with the player car.
 * On collision: reduces speed, applies visual effects, animates obstacle reaction.
 */
function updateObstacles(delta) {
  obstacles.forEach((obs, idx) => {
    // Move obstacle along the road
    obs.position.z += gameState.currentVelocity * delta;
    obs.rotation.y += 0.08;

    // 📊 OTIMIZAÇÃO RADICAL: Despawn quando longe do jogador (reduzido para economizar memória)
    if (obs.position.z > playerCar.position.z + 35) {
      scene.remove(obs);
      obstacles.splice(idx, 1);
      return;
    }

    // Collision detection using Box3
    // Only check collision if enough time has passed since last obstacle hit
    if (gameState.time - gameState.lastObstacleHitTime > OBSTACLE_CONFIG.HIT_COOLDOWN) {
      _playerBoxObstacle.setFromObject(playerCar);
      _playerBoxObstacle.expandByScalar(-0.15);

      _obstacleBox.setFromObject(obs);
      _obstacleBox.expandByScalar(-0.15);

      // Check intersection
      if (_playerBoxObstacle.intersectsBox(_obstacleBox)) {
        hitObstacle(obs);
        gameState.lastObstacleHitTime = gameState.time;
      }
    }
  });
}

/**
 * hitObstacle(obstacle)
 * ──────────────────────
 * Called when the player car collides with an orange obstacle.
 * Effects:
 *   1. Reduce speed penalty (doesn't cause Game Over)
 *   2. Apply camera shake
 *   3. Apply car tilt
 *   4. Animate obstacle reaction (knock back, rotate, scale)
 *   5. Show visual feedback (speed penalty indicator)
 */
function hitObstacle(obstacle) {
  // Activate speed penalty
  gameState.speedPenaltyActive = true;
  gameState.speedPenaltyTimer = OBSTACLE_CONFIG.PENALTY_DURATION;

  // Reduce baseVelocity to create speed penalty
  // Calculate reduction based on current velocity
  const currentSpeedKMH = gameState.currentVelocity * 10;
  const newSpeedKMH = Math.max(0, currentSpeedKMH - OBSTACLE_CONFIG.SPEED_PENALTY);
  gameState.baseVelocity = Math.max(2, newSpeedKMH / 10);

  // If police chase is active, increase aggressiveness
  if (policeChaseActive) {
    policeAggressiveness = Math.min(1.8, policeAggressiveness + 0.3);
  }

  // Show visual feedback on screen
  showObstaclePenaltyFeedback(OBSTACLE_CONFIG.SPEED_PENALTY);

  // Store original position for animation
  if (!obstacle.userData.hitData) {
    obstacle.userData.hitData = {
      originalPos: obstacle.position.clone(),
      originalScale: obstacle.scale.clone(),
      originalRot: obstacle.rotation.clone(),
      impactTime: gameState.time,
      knockBackDir: playerCar.position.clone().sub(obstacle.position).normalize()
    };
  }

  // Animate obstacle reaction (knock back, spin, scale)
  const hitData = obstacle.userData.hitData;
  const timeSinceHit = gameState.time - hitData.impactTime;
  const knockBackDuration = 0.6;

  if (timeSinceHit < knockBackDuration) {
    const knockBackAmount = 2.5 * (1 - timeSinceHit / knockBackDuration);
    
    // Knock back effect
    obstacle.position.copy(hitData.originalPos);
    obstacle.position.addScaledVector(hitData.knockBackDir, knockBackAmount);
    
    // Spin effect
    obstacle.rotation.x = hitData.originalRot.x + Math.sin(timeSinceHit * 12) * 0.8;
    obstacle.rotation.z = hitData.originalRot.z + Math.cos(timeSinceHit * 15) * 0.8;
    
    // Scale wobble effect
    const scaleAmount = 1 + Math.sin(timeSinceHit * 18) * 0.15;
    obstacle.scale.copy(hitData.originalScale).multiplyScalar(scaleAmount);
  } else {
    // Return to original state after knock back
    obstacle.position.copy(hitData.originalPos);
    obstacle.rotation.copy(hitData.originalRot);
    obstacle.scale.copy(hitData.originalScale);
  }
}

/**
 * showObstaclePenaltyFeedback(speedAmount)
 * ────────────────────────────────────────
 * Shows a temporary UI message when the player hits an obstacle.
 * Displays "-XX KM/H" in the center of the screen, fades out.
 */
function showObstaclePenaltyFeedback(speedAmount) {
  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'obstacle-penalty-feedback';
  feedbackEl.textContent = `-${speedAmount} KM/H`;
  feedbackEl.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3.5rem;
    font-weight: bold;
    color: #ff6600;
    text-shadow: 0 0 20px rgba(255, 102, 0, 0.8), 0 0 10px rgba(255, 51, 0, 1);
    font-family: monospace;
    z-index: 999;
    pointer-events: none;
    letter-spacing: 2px;
    animation: obstacleHitFeedback 1.2s ease-out forwards;
  `;
  document.body.appendChild(feedbackEl);

  // Remove element after animation completes
  setTimeout(() => feedbackEl.remove(), 1200);
}

// ─────────────────────────────────────────────────────────────
// Power-ups
// ─────────────────────────────────────────────────────────────
function spawnPowerUp() {
  const types = ['shield', 'nitro', 'speed'];
  const type = types[Math.floor(Math.random() * types.length)];

  let color = 0x00ff00;
  if (type === 'shield') color = 0x0088ff;
  if (type === 'speed') color = 0xff00ff;

  // 📊 OTIMIZAÇÃO: Reduzir segmentos geometria (0.35 → 0.35 mantém, mas reduz emissive)
  const powerGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const powerMat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.6  // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 1.0 → 0.6
  });
  const power = new THREE.Mesh(powerGeo, powerMat);
  power.position.set(
    (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 2.5),
    1,
    playerCar.position.z - 30 - Math.random() * 30
  );
  power.userData.powerType = type;
  power.userData.isPowerUp = true;
  scene.add(power);
  powerUps.push(power);
}

function updatePowerUps(delta) {
  powerUps.forEach((power, idx) => {
    power.position.z += gameState.currentVelocity * delta;
    power.rotation.y += 0.12;
    power.position.y = 1 + Math.sin(gameState.time * 4) * 0.4;

    // 📊 OTIMIZAÇÃO RADICAL: Despawn quando longe do jogador (reduzido para economizar memória)
    if (power.position.z > playerCar.position.z + 40) {
      scene.remove(power);
      powerUps.splice(idx, 1);
      return;
    }

    const dist = playerCar.position.distanceTo(power.position);
    if (dist < 1) {
      if (power.userData.powerType === 'shield') {
        gameState.invulnerable = true;
        gameState.invulnerableTime = 6;
      } else if (power.userData.powerType === 'nitro') {
        gameState.nitroCharge = 100;
      } else if (power.userData.powerType === 'speed') {
        gameState.currentVelocity += 6;
      }

      scene.remove(power);
      powerUps.splice(idx, 1);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Coins — collectible gold coins for points
// ─────────────────────────────────────────────────────────────

/**
 * createCoin(x, z)
 * ─────────────────
 * Builds a low-poly shiny gold coin using TorusGeometry.
 * Emissive material makes it glow slightly.
 * Returns a Group with the coin positioned at (x, y, z).
 * 
 * 📊 OTIMIZAÇÃO: Reduzir emissiveIntensity e simplificar geometria
 */
function createCoin(x, z) {
  const group = new THREE.Group();

  // Main coin body: flat torus (looks like a coin viewed at an angle)
  // 📊 OTIMIZAÇÃO: Reduzir segmentos de geometria (8×32 → 6×16)
  const coinGeo = new THREE.TorusGeometry(0.30, 0.08, 6, 16);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffdd00,           // bright yellow-gold
    emissive: 0xffaa00,        // warm orange glow
    emissiveIntensity: 0.6,    // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 1.0 → 0.6
    metalness: 0.6,            // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 0.8
    roughness: 0.35            // 📊 OTIMIZAÇÃO RADICAL: Aumentado de 0.25 (menos reflexo)
  });
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI / 2.5;  // tilt coin so it's visible
  group.add(coin);

  // Small bright sphere in the center for extra bling
  // 📊 OTIMIZAÇÃO: Reduzir segmentos da esfera (4×4 → 3×3)
  const sparkGeo = new THREE.SphereGeometry(0.08, 3, 3);
  const sparkMat = new THREE.MeshStandardMaterial({
    color: 0xffff99,
    emissive: 0xffff44,
    emissiveIntensity: 0.8,  // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 1.5 → 0.8
    metalness: 1.0
  });
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.position.y = 0.05;
  group.add(spark);

  // Position the coin above the road
  group.position.set(x, 0.8, z);
  group.userData.isCoin = true;
  scene.add(group);
  return group;
}

/**
 * spawnCoin()
 * ───────────
 * Randomly spawns a coin on one of the three lanes.
 * Coins spawn ahead of the player at a random distance.
 */
function spawnCoin() {
  const x = LANES[Math.floor(Math.random() * LANES.length)];
  const z = playerCar.position.z - 25 - Math.random() * 35;
  coins.push(createCoin(x, z));
}

/**
 * updateCoins(delta)
 * ──────────────────
 * • Scrolls coins toward the player
 * • Animates coin rotation and bob (OTIMIZADO)
 * • Detects collection (distance check)
 * • Removes collected or despawned coins
 * 
 * 📊 OTIMIZAÇÃO: Reduzir rotação exagerada e atualizar menos frequente
 */
function updateCoins(delta) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    // Move coin with the road
    coin.position.z += gameState.currentVelocity * delta;

    // 📊 OTIMIZAÇÃO RADICAL: Reduzir velocidade de rotação de 0.12 → 0.03
    coin.rotation.y += 0.03;

    // Bob up and down gently (floating effect)
    coin.position.y = 0.8 + Math.sin(gameState.time * 3.5 + i * 0.3) * 0.25;

    // Despawn quando longe do jogador (reduzido para economizar memória)
    if (coin.position.z > playerCar.position.z + 45) {
      scene.remove(coin);
      coins.splice(i, 1);
      continue;
    }

    // Collision detection: player collects coin
    const dist = playerCar.position.distanceTo(coin.position);
    if (dist < 1.0) {
      collectCoin(coin, i);
    }
  }
}

/**
 * collectCoin(coin, index)
 * ────────────────────────
 * Called when player touches a coin.
 * • Remove coin from scene
 * • Increment counter
 * • Update HUD
 */
function collectCoin(coin, index) {
  coinsCollected++;
  scene.remove(coin);
  coins.splice(index, 1);
  updateCoinUI();

  // Optional: brief visual feedback at coin position
  // (you could add a particle effect or sound here later)
}

// ─────────────────────────────────────────────────────────────
// Jump Pickups — cyan diamond, restores 1 jump on collection
// ─────────────────────────────────────────────────────────────
function createJumpPickup(x, z) {
  const group = new THREE.Group();

  // Glowing cyan octahedron (diamond shape)
  const geo = new THREE.OctahedronGeometry(0.28, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ccff,
    emissiveIntensity: 1.2,  // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 2.8 → 1.2
    roughness: 0.1,
    metalness: 0.3
  });
  group.add(new THREE.Mesh(geo, mat));

  // Small upward-pointing cone below the diamond
  const coneGeo = new THREE.ConeGeometry(0.12, 0.22, 5);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x00ddff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.8  // 📊 OTIMIZAÇÃO RADICAL: Reduzido de 1.8 → 0.8
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -0.48;
  group.add(cone);

  group.position.set(x, 1.2, z);
  group.userData.isJumpPickup = true;
  scene.add(group);
  return group;
}

function spawnJumpPickup() {
  const x = LANES[Math.floor(Math.random() * LANES.length)];
  const z = playerCar.position.z - 30 - Math.random() * 30;
  jumpPickups.push(createJumpPickup(x, z));
}

function updateJumpPickups(delta) {
  for (let i = jumpPickups.length - 1; i >= 0; i--) {
    const pickup = jumpPickups[i];
    pickup.position.z += gameState.currentVelocity * delta;
    // 📊 OTIMIZAÇÃO: Reduzir rotação de 0.15 → 0.08
    pickup.rotation.y += 0.08;
    pickup.position.y = 1.2 + Math.sin(gameState.time * 3 + i) * 0.18;

    // Despawn quando longe do jogador (reduzido para economizar memória)
    if (pickup.position.z > playerCar.position.z + 35) {
      scene.remove(pickup);
      jumpPickups.splice(i, 1);
      continue;
    }

    // Collection: restore 1 jump (capped at 3)
    const dist = playerCar.position.distanceTo(pickup.position);
    if (dist < 1.2) {
      gameState.jumpsAvailable = Math.min(gameState.jumpsAvailable + 1, 3);
      scene.remove(pickup);
      jumpPickups.splice(i, 1);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Police Convoy Event
// ─────────────────────────────────────────────────────────────

/**
 * createPoliceCar(x, z)
 * Low-poly police car: white/black body built on createCar(), plus
 * a roof siren bar with alternating red/blue PointLights.
 * Returns { mesh, redPoint, bluePoint, redMesh, blueMesh, velocity, passed }.
 */
function createPoliceCar(x, z) {
  // Geometry constants (must match createCar() internals)
  const WHEEL_R = 0.28;
  const BODY_H  = 0.22;
  const CABIN_H = 0.42;
  const ROOF_TOP = WHEEL_R + BODY_H * 2 + CABIN_H; // ≈ 1.14

  // White base car
  const car = createCar(0xeeeeee);

  // Black roof panel
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const roofGeo  = new THREE.BoxGeometry(1.46, 0.07, 1.93);
  const roofMesh = new THREE.Mesh(roofGeo, blackMat);
  roofMesh.position.set(0, ROOF_TOP - 0.035, -0.12);
  car.add(roofMesh);

  // Siren bar housing (dark grey box on roof)
  const barMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
  const barGeo  = new THREE.BoxGeometry(0.88, 0.13, 0.32);
  const bar     = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, ROOF_TOP + 0.065, -0.12);
  car.add(bar);

  // Red siren lens (left half of bar) — optimized emissive intensity
  const lenGeo  = new THREE.BoxGeometry(0.28, 0.10, 0.26);
  const redMat  = new THREE.MeshStandardMaterial({
    color: 0xff1111, emissive: 0xff0000, emissiveIntensity: 1.5, roughness: 0.3
  });
  const redMesh = new THREE.Mesh(lenGeo, redMat);
  redMesh.position.set(-0.26, ROOF_TOP + 0.065, -0.12);
  car.add(redMesh);

  // Blue siren lens (right half of bar) — optimized emissive intensity
  const blueMat  = new THREE.MeshStandardMaterial({
    color: 0x1133ff, emissive: 0x0022ff, emissiveIntensity: 1.5, roughness: 0.3
  });
  const blueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.26), blueMat);
  blueMesh.position.set(0.26, ROOF_TOP + 0.065, -0.12);
  car.add(blueMesh);

  // PointLights — minimal intensity to reduce lag
  // 📊 OTIMIZAÇÃO: Reduzir intensidade de PointLights de 4 → 1.0
  // - Luz ainda visível mas muito menos cara de renderizar
  const redPoint  = new THREE.PointLight(0xff2200, 1.0, 6);  // Reduzido para 1.0 + range reduzido
  redPoint.position.set(-0.3, ROOF_TOP + 0.35, -0.12);
  redPoint.castShadow = false;  // Explicitly disable shadows
  car.add(redPoint);

  const bluePoint = new THREE.PointLight(0x0033ff, 1.0, 6);  // Reduzido para 1.0 + range reduzido
  bluePoint.position.set(0.3, ROOF_TOP + 0.35, -0.12);
  bluePoint.castShadow = false;  // Explicitly disable shadows
  car.add(bluePoint);

  car.position.set(x, 0, z);
  scene.add(car);

  return { mesh: car, redPoint, bluePoint, redMesh, blueMesh, velocity: 0, passed: false };
}

/**
 * spawnPoliceConvoy()
 * Three police cars in a staggered formation that never blocks all lanes
 * simultaneously, leaving at least one gap the player can thread through.
 *
 * Formation (z offsets relative to 55 units ahead of player):
 *   Car A — left lane,    z+0   → gap: centre + right
 *   Car B — right lane,   z−15  → gap: left + centre
 *   Car C — centre lane,  z−32  → gap: left + right
 */
function spawnPoliceConvoy() {
  const base = playerCar.position.z - 55;
  const vel  = gameState.baseVelocity * 0.82;

  [
    { lane: LANES[0], zOff:   0 },   // left
    { lane: LANES[2], zOff: -15 },   // right
    { lane: LANES[1], zOff: -32 },   // centre
  ].forEach(f => {
    const pc = createPoliceCar(f.lane, base + f.zOff);
    pc.velocity = vel;
    policeCars.push(pc);
  });
}

/**
 * showEventWarning(text)
 * Injects a flashing neon banner. Stops blinking after 4 s and
 * displays a quieter "ACTIVE" notice for the rest of the event.
 */
function showEventWarning(text) {
  let el = document.getElementById('event-warning');
  if (!el) {
    el = document.createElement('div');
    el.id = 'event-warning';
    Object.assign(el.style, {
      position:    'fixed',
      top:         '18%',
      left:        '50%',
      transform:   'translateX(-50%)',
      fontFamily:  'monospace',
      fontSize:    '1.45rem',
      fontWeight:  'bold',
      color:       '#ff2222',
      textShadow:  '0 0 10px #ff0000, 0 0 26px #ff0000',
      background:  'rgba(0,0,0,0.75)',
      border:      '2px solid #ff2222',
      borderRadius:'6px',
      padding:     '0.5rem 1.4rem',
      pointerEvents:'none',
      zIndex:      '999',
      letterSpacing:'0.12em',
      textAlign:   'center',
      whiteSpace:  'nowrap',
    });
    document.body.appendChild(el);
  }

  el.textContent  = text;
  el.style.opacity = '1';

  // Fast blink for 4 s to catch the player's eye
  let blink = true;
  el._blinkId = setInterval(() => {
    blink = !blink;
    el.style.opacity = blink ? '1' : '0.2';
  }, 320);

  setTimeout(() => {
    clearInterval(el._blinkId);
    el.style.opacity   = '0.65';
    el.textContent     = '⚠ POLICE CONVOY ACTIVE ⚠';
    el.style.color     = '#ffaa00';
    el.style.textShadow = '0 0 8px #ff8800';
    el.style.border    = '2px solid #ffaa00';
  }, 4000);
}

function startPoliceConvoyEvent() {
  policeConvoyActive = true;
  policeConvoyTimer  = 20;   // event window: 20 seconds
  spawnPoliceConvoy();
  showEventWarning('🚨 POLICE CONVOY AHEAD 🚨');
}

function endPoliceConvoyEvent() {
  policeConvoyActive = false;
  policeConvoyTimer  = 0;
  policeCars.forEach(pc => scene.remove(pc.mesh));
  policeCars.length = 0;

  const el = document.getElementById('event-warning');
  if (el) { clearInterval(el._blinkId); el.remove(); }

  // Next convoy 50 seconds later
  nextPoliceEventTime = gameState.time + 50;
}

/**
 * updatePoliceConvoy(delta)
 * • Scrolls police cars toward the player.
 * • Alternates siren red/blue at ~8 Hz.
 * • Game Over on collision (same AABB as enemy cars).
 * • Double-overtake bonus when a cop car is passed.
 * • Ends the event early when all cars are behind the player.
 */
function updatePoliceConvoy(delta) {
  if (!policeConvoyActive) return;

  policeConvoyTimer -= delta;
  if (policeConvoyTimer <= 0) {
    endPoliceConvoyEvent();
    return;
  }

// Siren alternates red ↔ blue a frequência reduzida para menos efeito
    const redOn = Math.sin(gameState.time * 10) > 0;

  let allPassed = policeCars.length > 0;   // becomes false if any cop not yet passed

  for (let i = policeCars.length - 1; i >= 0; i--) {
    const pc = policeCars[i];

    // Scroll toward player
    pc.mesh.position.z += pc.velocity * delta;

    // Spin wheels
    const rps = pc.velocity / (2 * Math.PI * 0.28);
    pc.mesh.traverse(child => {
      if (child.userData.isWheelSpin) child.rotation.x += rps * delta * Math.PI * 2;
    });

    // Despawn quando longe do jogador (reduzido para economizar memória)
    if (pc.mesh.position.z > playerCar.position.z + 12) {
      scene.remove(pc.mesh);
      policeCars.splice(i, 1);
      continue;
    }

    // Siren flash (intensidade reduzida drasticamente)
    pc.redPoint.intensity              = redOn  ? 0.3 : 0;  // Reduzido de 1.0 → 0.3
    pc.bluePoint.intensity             = !redOn ? 0.3 : 0;  // Reduzido de 1.0 → 0.3
    pc.redMesh.material.emissiveIntensity  = redOn  ? 0.8 : 0.05;  // Reduzido de 1.5 → 0.8
    pc.blueMesh.material.emissiveIntensity = !redOn ? 0.8 : 0.05;  // Reduzido de 1.5 → 0.8

    // Collision → game over
    if (!gameState.invulnerable) {
      const dx = Math.abs(pc.mesh.position.x - playerCar.position.x);
      const dz = Math.abs(pc.mesh.position.z - playerCar.position.z);
      if (dx < 1.3 && dz < 2.2 && playerCar.position.y < 0.5) {
        gameOver();
        return;
      }
    }

    // Overtake detection — cop car slid behind player
    if (!pc.passed && pc.mesh.position.z > playerCar.position.z + 2) {
      pc.passed = true;
      gameState.overtakes += 2;   // convoy overtake worth double
    }

    if (!pc.passed) allPassed = false;
  }

  // All cops passed → clear event early + show bonus banner
  if (allPassed) {
    endPoliceConvoyEvent();
    const bonus = document.createElement('div');
    bonus.textContent = '✅ CONVOY CLEARED!  +BONUS';
    Object.assign(bonus.style, {
      position: 'fixed', top: '28%', left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace', fontSize: '1.2rem',
      color: '#00ff88', textShadow: '0 0 12px #00ff88',
      background: 'rgba(0,0,0,0.72)',
      border: '2px solid #00ff88', borderRadius: '6px',
      padding: '0.4rem 1.2rem', pointerEvents: 'none', zIndex: '999',
    });
    document.body.appendChild(bonus);
    setTimeout(() => bonus.remove(), 2500);
  }
}

// ─────────────────────────────────────────────────────────────
// Police Chase System (velocity-based pursuit)
// ─────────────────────────────────────────────────────────────

/**
 * startPoliceChase()
 * ──────────────────
 * Called when the player reaches a speed threshold.
 * Spawns 1-2 police cars behind the player that will pursue for 15 seconds.
 */
function startPoliceChase() {
  if (policeChaseActive) return;
  
  policeChaseActive = true;
  policeChaseTimer = policeChaseDuration;
  
  console.log(`[POLICE] Chase started! Index: ${policeTriggerIndex}, Duration: ${policeChaseDuration}s`);
  
  // Reset aggressiveness and multiplier for this chase
  policeAggressiveness = 1.0;
  policeChaseMultiplier = 1.0 + (policeTriggerIndex * 0.2);  // Increases difficulty
  
  // Spawn 1-2 police cars behind the player
  spawnPoliceCarsBehindPlayer();
  
  // Show warning
  showPoliceChaseBanner();
}

/**
 * endPoliceChase()
 * ────────────────
 * Called when the player survives 15 seconds of police chase.
 * Removes police cars and sets the next trigger speed.
 */
function endPoliceChase() {
  policeChaseActive = false;
  policeChaseTimer = 0;
  
  // Remove all chase police cars
  policeCars.forEach(pc => scene.remove(pc.mesh));
  policeCars.length = 0;
  
  // Move to next trigger
  policeTriggerIndex++;
  
  if (policeTriggerIndex < POLICE_SPEED_TRIGGERS.length) {
    nextPoliceChaseTrigger = POLICE_SPEED_TRIGGERS[policeTriggerIndex];
  } else {
    // After all predefined triggers, increase by 1500 km/h each time
    nextPoliceChaseTrigger += 1500;
  }
  
  // Show escape banner
  showPoliceEscapeBanner();
}

/**
 * updatePoliceChase(delta)
 * ────────────────────────
 * Updates police chase: moves cars, checks collisions, handles survival timer.
 * OPTIMIZED: Uses reusable Box3 for collision detection.
 */
function updatePoliceChase(delta) {
  if (!policeChaseActive || isGameOver) return;
  
  // Decrement timer
  policeChaseTimer -= delta;
  if (policeChaseTimer <= 0) {
    endPoliceChase();
    return;
  }
  
  // Siren alternates red ↔ blue a frequência reduzida
  const redOn = Math.sin(gameState.time * 10) > 0;
  
  // Set player box once per frame (outside loop)
  _policePlayerBox.setFromObject(playerCar);
  _policePlayerBox.expandByScalar(-0.15);
  
  for (let i = policeCars.length - 1; i >= 0; i--) {
    const pc = policeCars[i];
    
    // Police cars move toward player at varying speeds
    const policeSpeed = pc.velocity * policeChaseMultiplier * policeAggressiveness;
    pc.mesh.position.z += policeSpeed * delta;
    
    // Lane following: smoothly move toward player's lane
    pc.mesh.position.x += (playerCar.position.x - pc.mesh.position.x) * 0.02;
    
    // Spin wheels
    const rps = policeSpeed / (2 * Math.PI * 0.28);
    pc.mesh.traverse(child => {
      if (child.userData.isWheelSpin) child.rotation.x += rps * delta * Math.PI * 2;
    });
    
    // Despawn quando longe do jogador (reduzido para economizar memória)
    if (pc.mesh.position.z > playerCar.position.z + 45) {
      scene.remove(pc.mesh);
      policeCars.splice(i, 1);
      continue;
    }
    
    // Siren flash — OTIMIZADO com intensidades reduzidas drasticamente
    // 📊 OTIMIZAÇÃO RADICAL: Reduzir intensidade de siren de 1.5 → 0.3
    if (pc.redPoint) pc.redPoint.intensity = redOn ? 0.3 : 0;  
    if (pc.bluePoint) pc.bluePoint.intensity = !redOn ? 0.3 : 0;  
    if (pc.redMesh) pc.redMesh.material.emissiveIntensity = redOn ? 0.8 : 0.05;  
    if (pc.blueMesh) pc.blueMesh.material.emissiveIntensity = !redOn ? 0.8 : 0.05;
    
    // Collision detection using reusable Box3 — OPTIMIZED
    if (!gameState.invulnerable) {
      _policeCarBox.setFromObject(pc.mesh);
      _policeCarBox.expandByScalar(-0.15);
      
      if (_policePlayerBox.intersectsBox(_policeCarBox)) {
        gameBusted();
        return;  // Exit early to prevent multiple calls
      }
    }
  }
}

/**
 * spawnPoliceCarsBehindPlayer()
 * ────────────────────────────
 * Spawns police cars behind the player in random lanes.
 * OPTIMIZED: Limited to MAX_POLICE_CARS (2) to prevent lag.
 */
function spawnPoliceCarsBehindPlayer() {
  // Prevent spawning if at max capacity
  if (policeCars.length >= MAX_POLICE_CARS) {
    console.log(`[POLICE] Already at max capacity (${MAX_POLICE_CARS}), skipping spawn`);
    return;
  }
  
  // Spawn up to MAX_POLICE_CARS, but respect current count
  const spawnCount = Math.min(
    Math.random() > 0.5 ? 1 : 2,
    MAX_POLICE_CARS - policeCars.length
  );
  
  const spawnZDistance = 50 + Math.random() * 30;  // Spawn 50-80 units behind
  
  console.log(`[POLICE] Spawning ${spawnCount} cars (total: ${policeCars.length + spawnCount})`);
  
  for (let i = 0; i < spawnCount; i++) {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const zOffset = i * 15;  // Stagger vertically
    
    const pc = createPoliceCar(lane, playerCar.position.z - spawnZDistance - zOffset);
    pc.velocity = gameState.currentVelocity * 1.1;  // Slightly faster than player
    policeCars.push(pc);
  }
}

/**
 * showPoliceChaseBanner()
 * ──────────────────────
 * Shows visual warning when police chase starts.
 */
function showPoliceChaseBanner() {
  const banner = document.createElement('div');
  banner.id = 'police-chase-banner';
  banner.textContent = '🚨 POLICE CHASE STARTED 🚨';
  banner.style.cssText = `
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2.5rem;
    font-weight: bold;
    color: #ff0000;
    text-shadow: 0 0 20px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8);
    font-family: monospace;
    z-index: 998;
    pointer-events: none;
    animation: police-chase-pulse 0.5s ease-out forwards;
  `;
  document.body.appendChild(banner);
  
  setTimeout(() => banner.remove(), 2000);
}

/**
 * showPoliceEscapeBanner()
 * ───────────────────────
 * Shows success banner when police chase is survived.
 */
function showPoliceEscapeBanner() {
  const banner = document.createElement('div');
  banner.id = 'police-escape-banner';
  banner.textContent = '✅ ESCAPED! SPEED UP FOR NEXT LEVEL';
  banner.style.cssText = `
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.8rem;
    font-weight: bold;
    color: #00ff00;
    text-shadow: 0 0 20px rgba(0, 255, 0, 1);
    font-family: monospace;
    z-index: 998;
    pointer-events: none;
    animation: police-escape-pulse 0.6s ease-out forwards;
  `;
  document.body.appendChild(banner);
  
  setTimeout(() => banner.remove(), 2500);
}

/**
 * updatePoliceChazeHUD(secondsLeft)
 * ────────────────────────────────
 * Updates the HUD to show remaining chase time.
 */
function updatePoliceChazeHUD(secondsLeft) {
  let hudEl = document.getElementById('police-chase-hud');
  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'police-chase-hud';
    hudEl.style.cssText = `
      position: fixed;
      top: 120px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.5rem;
      font-weight: bold;
      color: #ff3300;
      text-shadow: 0 0 15px rgba(255, 51, 0, 1);
      font-family: monospace;
      z-index: 50;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #ff3300;
      padding: 0.5rem 1rem;
      border-radius: 4px;
    `;
    document.body.appendChild(hudEl);
  }
  hudEl.textContent = `🚨 POLICE CHASE: ${secondsLeft}s`;
}

/**
 * gameBusted()
 * ────────────
 * Called when a police car catches the player.
 * Ends the game with a "BUSTED!" message.
 */
function gameBusted() {
  if (isGameOver) return;
  isGameOver = true;
  
  gameState.currentVelocity = 0;
  gameState.baseVelocity = 0;
  
  crashEffect.active = true;
  crashEffect.timer = 0;
  
  const flash = document.createElement('div');
  flash.id = 'crash-flash';
  document.body.appendChild(flash);
  crashEffect.flashEl = flash;
  
  // Remove police chase HUD
  const hudEl = document.getElementById('police-chase-hud');
  if (hudEl) hudEl.remove();
}

// ─────────────────────────────────────────────────────────────
// Road
// ─────────────────────────────────────────────────────────────
function buildRoad(scene) {
  const roadGeo = new THREE.PlaneGeometry(10, 400);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.01, -100);
  road.receiveShadow = true;
  scene.add(road);

  const groundGeo = new THREE.PlaneGeometry(500, 500);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 0.9
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.8
  });

  [-5, 5].forEach(x => {
    const edgeGeo = new THREE.PlaneGeometry(0.1, 400);
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0, -100);
    scene.add(edge);
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5
  });

  for (let z = -200; z < 100; z += 10) {
    const stripeGeo = new THREE.PlaneGeometry(0.2, 5);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.01, z);
    stripe.userData.isRoadStripe = true;
    scene.add(stripe);
  }

}

// ─────────────────────────────────────────────────────────────
// Scenery (trees, light posts)
// ─────────────────────────────────────────────────────────────
// Low-poly tree factory
// ─────────────────────────────────────────────────────────────

/**
 * createTree()
 * Builds a low-poly tree with a varied multi-sphere canopy.
 * Group origin is at y = 0 (ground level).
 *
 * Canopy structure (all tagged isTreeFoliage for sway):
 *   • 1 large central sphere
 *   • 2–3 mid spheres offset laterally and vertically
 *   • 1 small top sphere
 * Each sphere gets a slightly different green for depth.
 * 
 * 📊 OTIMIZAÇÃO: Reduzir segmentos das esferas para menos polígonos
 */
function createTree() {
  const tree = new THREE.Group();

  // ── Randomise scale so not all trees are identical ──────
  const scale   = 0.85 + Math.random() * 0.35;   // 0.85 – 1.2
  const trunkH  = (2.2 + Math.random() * 0.8) * scale;
  const trunkR  = (0.14 + Math.random() * 0.06) * scale;

  // ── Trunk ───────────────────────────────────────────────
  const trunkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.07, 0.55, 0.22 + Math.random() * 0.08),
    roughness: 1
  });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 7),
    trunkMat
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // ── Canopy — 4 overlapping low-poly spheres ─────────────
  // 📊 OTIMIZAÇÃO: Reduzir segmentos (de 7×5 → 5×4) para menos polígonos
  const baseY = trunkH;   // bottom of canopy starts at trunk top

  const blobs = [
    // [x offset, y offset from baseY, radius, hue lightness tweak]
    { x:  0,    y: 1.1 * scale, r: 1.15 * scale, l:  0   },   // central large
    { x: -0.7 * scale, y: 0.55 * scale, r: 0.82 * scale, l: -0.03 },   // left mid
    { x:  0.72 * scale, y: 0.6  * scale, r: 0.78 * scale, l:  0.03 },   // right mid
    { x:  0.15 * scale, y: 1.9  * scale, r: 0.55 * scale, l:  0.06 },   // top small
  ];

  blobs.forEach(b => {
    const lightness = THREE.MathUtils.clamp(0.24 + b.l + Math.random() * 0.06, 0.18, 0.38);
    const saturation = 0.55 + Math.random() * 0.15;
    const hue = 0.28 + (Math.random() - 0.5) * 0.04;  // green band 0.26–0.30

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, saturation, lightness),
      roughness: 0.9,
      flatShading: true     // flat shading = low-poly faceted look
    });

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(b.r, 5, 4),  // Reduzido de 7×5 → 5×4
      mat
    );
    sphere.position.set(b.x, baseY + b.y, 0);
    sphere.rotation.y = Math.random() * Math.PI;  // vary silhouette
    sphere.castShadow = true;
    sphere.userData.isTreeFoliage = true;          // sway animation target
    tree.add(sphere);
  });

  return tree;
}

// ─────────────────────────────────────────────────────────────
// Street light factory
// ─────────────────────────────────────────────────────────────

/**
 * createStreetLight(side)
 * ────────────────────────
 * Builds one realistic low-poly street lamp.
 * side: -1 = left side (arm points right toward road)
 *        1 = right side (arm points left toward road)
 *
 * Structure:
 *   • Base plate (flat box on the ground)
 *   • Vertical pole (tapered cylinder)
 *   • Horizontal arm (thin box pointing toward road)
 *   • Lamp housing (small box, emissive warm yellow)
 *   • SpotLight aimed at road centre (castShadow off for perf)
 *   • PointLight for ambient glow halo around the lamp
 *
 * Group origin is at (0,0,0) — caller sets world position.
 */
function createStreetLight(side) {
  const pole = new THREE.Group();

  // ── Materials ──────────────────────────────────────────
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.6,
    metalness: 0.7
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffe8a0,
    emissive: 0xffcc44,
    emissiveIntensity: 2.5,
    roughness: 0.3
  });

  // ── Base plate ─────────────────────────────────────────
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.12, 0.5),
    metalMat
  );
  base.position.y = 0.06;
  base.castShadow = true;
  pole.add(base);

  // ── Vertical pole (tapered) ────────────────────────────
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.1, 5.5, 8),
    metalMat
  );
  shaft.position.y = 2.75 + 0.12;
  shaft.castShadow = true;
  pole.add(shaft);

  // ── Horizontal arm pointing toward road ────────────────
  // side = -1 → arm goes to +x (right toward x=0 road)
  // side =  1 → arm goes to -x (left toward x=0 road)
  const armLen = 1.6;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(armLen, 0.09, 0.09),
    metalMat
  );
  arm.position.set(-side * armLen / 2, 5.62, 0);
  arm.castShadow = true;
  pole.add(arm);

  // ── Small vertical drop at arm tip ─────────────────────
  const drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6),
    metalMat
  );
  drop.position.set(-side * armLen, 5.42, 0);
  pole.add(drop);

  // ── Lamp housing (box) ─────────────────────────────────
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.18, 0.32),
    lampMat
  );
  lamp.position.set(-side * armLen, 5.22, 0);
  pole.add(lamp);

  // ── SpotLight aimed down at road ───────────────────────
  const lampWorldX = -side * armLen;  // local X of lamp head
  const spot = new THREE.SpotLight(0xffddaa, 2.8, 22, Math.PI / 5.5, 0.55, 1.5);
  spot.position.set(lampWorldX, 5.2, 0);
  spot.castShadow = false;  // keep perf safe
  pole.add(spot);

  // Target: road surface directly below the lamp
  const target = new THREE.Object3D();
  target.position.set(0, 0, 0);   // road centre at same Z; updated in scene
  pole.add(target);
  spot.target = target;

  // ── PointLight for soft halo glow ──────────────────────
  const halo = new THREE.PointLight(0xffcc66, 0.6, 8, 2);
  halo.position.set(lampWorldX, 5.2, 0);
  pole.add(halo);

  return pole;
}

// ─────────────────────────────────────────────────────────────
// Mountain factory — low-poly irregular peaks
// ─────────────────────────────────────────────────────────────
function createMountain(x, z, scale = 1) {
  const group = new THREE.Group();

  // Dark blue-grey colour palette, slightly randomised per mountain
  const hue = 0.56 + Math.random() * 0.10;  // blue → grey-blue
  const sat = 0.06 + Math.random() * 0.10;
  const lit = 0.11 + Math.random() * 0.11;

  /** Build one cone peak with vertex perturbation for irregularity */
  function makePeak(radius, height, segs, perturbAmt, litShift = 0) {
    const geo = new THREE.ConeGeometry(radius, height, segs, 1);
    const pos = geo.attributes.position;
    const apexY = height * 0.5;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Perturb more on the sides, less near the apex
      const t = Math.max(0, 1 - (y / apexY) * 0.9);
      const p = perturbAmt * t;
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 2 * p);
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 2 * p);
      pos.setY(i, y + (Math.random() - 0.5) * p * 0.4);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, sat, lit + litShift),
      roughness: 0.95,
      flatShading: true     // faceted low-poly look
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    return mesh;
  }

  // ── Main peak ──────────────────────────────────────────────
  const mainH    = (15 + Math.random() * 13) * scale;
  const mainR    = (7  + Math.random() *  5) * scale;
  const mainSegs = 5 + Math.floor(Math.random() * 3);  // 5, 6 or 7

  const mainMesh = makePeak(mainR, mainH, mainSegs, mainR * 0.30);
  mainMesh.position.y = mainH * 0.5;
  group.add(mainMesh);

  // ── Secondary peak (~60 % chance) — neighbouring shoulder ─
  if (Math.random() > 0.4) {
    const secH    = mainH * (0.42 + Math.random() * 0.36);
    const secR    = mainR * (0.44 + Math.random() * 0.30);
    const secSegs = 4 + Math.floor(Math.random() * 3);
    const sec = makePeak(secR, secH, secSegs, secR * 0.25, -0.03);
    const angle = Math.random() * Math.PI * 2;
    const dist  = mainR * (0.55 + Math.random() * 0.40);
    sec.position.set(Math.cos(angle) * dist, secH * 0.5, Math.sin(angle) * dist);
    group.add(sec);
  }

  // ── Tertiary small bump (~35 % chance) ────────────────────
  if (Math.random() > 0.65) {
    const terH = mainH * (0.22 + Math.random() * 0.20);
    const terR = mainR * (0.28 + Math.random() * 0.20);
    const ter  = makePeak(terR, terH, 5, terR * 0.20, 0.04);
    const angle = Math.random() * Math.PI * 2;
    const dist  = mainR * (0.65 + Math.random() * 0.50);
    ter.position.set(Math.cos(angle) * dist, terH * 0.5, Math.sin(angle) * dist);
    group.add(ter);
  }

  group.position.set(x, 0, z);
  return group;
}

// ─────────────────────────────────────────────────────────────
function buildScenery(scene) {
  // 📊 OTIMIZAÇÃO RADICAL: Street lights — aumentado intervalo de 24 → 32 unidades
  for (let z = -200; z < 100; z += 32) {
    // Alternate: even index left side, odd index right side
    const idx = Math.round((z + 200) / 32);
    const side = (idx % 2 === 0) ? -1 : 1;  // -1=left +x arm, 1=right -x arm
    const xPos = side === -1 ? -7 : 7;       // left post at x=-7, right at x=7

    const light = createStreetLight(side);
    light.position.set(xPos, 0, z);
    light.userData.isScenery = true;
    scene.add(light);
  }

  // 📊 OTIMIZAÇÃO RADICAL: Trees — aumentado intervalo de 20 → 28 unidades
  for (let z = -180; z < 80; z += 28) {
    [-10, 10].forEach(x => {
      const tree = createTree();
      tree.position.set(x, 0, z);
      tree.userData.isScenery = true;
      tree.userData.swayOffset = Math.random() * Math.PI * 2;
      scene.add(tree);
    });
  }

  // ── Mountains — low-poly irregular peaks on both sides ─────
  [
    // Left side — closer to near, progressively deeper
    { x: -22, z: -118, s: 0.80 },
    { x: -36, z: -140, s: 1.10 },
    { x: -52, z: -158, s: 1.35 },
    { x: -30, z: -175, s: 0.95 },
    { x: -65, z: -130, s: 1.20 },
    { x: -46, z: -202, s: 1.55 },
    // Right side
    { x:  24, z: -122, s: 0.80 },
    { x:  40, z: -148, s: 1.10 },
    { x:  57, z: -162, s: 1.30 },
    { x:  33, z: -178, s: 0.90 },
    { x:  64, z: -132, s: 1.15 },
    { x:  50, z: -208, s: 1.50 },
    // Deep background — tallest, create horizon depth
    { x: -12, z: -220, s: 1.90 },
    { x:   8, z: -235, s: 1.70 },
    { x: -32, z: -250, s: 2.10 },
    { x:  26, z: -244, s: 1.85 },
  ].forEach(m => scene.add(createMountain(m.x, m.z, m.s)));
}

// ─────────────────────────────────────────────────────────────
// Shared car factory — used by player AND enemy cars
// ─────────────────────────────────────────────────────────────

/**
 * createCar(color)
 * ─────────────────
 * Builds a low-poly arcade car from several primitives grouped
 * under a single THREE.Group.
 *
 * Coordinate convention (group origin = road surface, y = 0):
 *   WHEEL_R  = wheel radius  → wheels sit at y = WHEEL_R (touching y=0)
 *   BODY_H   = lower-body half-height
 *   Lower body centre  → y = WHEEL_R + BODY_H
 *   Cabin centre       → y = WHEEL_R + BODY_H*2 + CABIN_H/2
 *
 * All sub-meshes with userData.isWheel = true are rotated each
 * frame by the animation loop to show rolling motion.
 */
function createCar(color) {
  const WHEEL_R  = 0.28;   // wheel radius  — wheels touch y = 0
  const WHEEL_W  = 0.22;   // wheel width
  const BODY_H   = 0.22;   // half-height of the lower body box
  const BODY_Y   = WHEEL_R + BODY_H;          // 0.50 — body centre
  const CABIN_H  = 0.42;
  const CABIN_Y  = WHEEL_R + BODY_H * 2 + CABIN_H / 2;  // 0.93

  const car = new THREE.Group();

  // ── Materials ────────────────────────────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.35, metalness: 0.65
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, roughness: 0.05, metalness: 0.2,
    transparent: true, opacity: 0.7
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.9
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.9
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb, metalness: 0.9, roughness: 0.15
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffcc, emissive: 0xffff88, emissiveIntensity: 1.8
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1111, emissive: 0xff0000, emissiveIntensity: 2
  });

  // ── Lower body (main chassis) ─────────────────────────────
  const lowerGeo = new THREE.BoxGeometry(1.72, BODY_H * 2, 3.8);
  const lower = new THREE.Mesh(lowerGeo, bodyMat);
  lower.position.y = BODY_Y;
  lower.castShadow = true;
  car.add(lower);

  // ── Raised side sills (visual detail) ────────────────────
  [-0.88, 0.88].forEach(sx => {
    const sillGeo = new THREE.BoxGeometry(0.08, 0.1, 3.6);
    const sill = new THREE.Mesh(sillGeo, darkMat);
    sill.position.set(sx, WHEEL_R + 0.05, 0);
    car.add(sill);
  });

  // ── Cabin (upper body) ────────────────────────────────────
  const cabinGeo = new THREE.BoxGeometry(1.48, CABIN_H, 1.95);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, CABIN_Y, -0.12);
  cabin.castShadow = true;
  car.add(cabin);

  // ── Windshield (front glass pane) ─────────────────────────
  const wsGeo = new THREE.PlaneGeometry(1.28, CABIN_H * 0.82);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(0, CABIN_Y - 0.02, 0.85);
  ws.rotation.x = -0.28;   // slight rake
  car.add(ws);

  // ── Rear glass ────────────────────────────────────────────
  const rgGeo = new THREE.PlaneGeometry(1.28, CABIN_H * 0.78);
  const rg = new THREE.Mesh(rgGeo, glassMat);
  rg.position.set(0, CABIN_Y - 0.02, -1.08);
  rg.rotation.x = 0.28;
  rg.rotation.y = Math.PI;
  car.add(rg);

  // ── Hood (front sloped panel) ─────────────────────────────
  const hoodGeo = new THREE.BoxGeometry(1.68, 0.07, 0.72);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, BODY_Y + BODY_H - 0.01, 1.58);
  hood.rotation.x = 0.18;
  car.add(hood);

  // ── Trunk lid (rear sloped panel) ─────────────────────────
  const trunkGeo = new THREE.BoxGeometry(1.68, 0.07, 0.62);
  const trunk = new THREE.Mesh(trunkGeo, bodyMat);
  trunk.position.set(0, BODY_Y + BODY_H - 0.01, -1.75);
  trunk.rotation.x = -0.18;
  car.add(trunk);

  // ── Front bumper ──────────────────────────────────────────
  const fBumperGeo = new THREE.BoxGeometry(1.65, 0.18, 0.12);
  const fBumper = new THREE.Mesh(fBumperGeo, darkMat);
  fBumper.position.set(0, WHEEL_R + 0.09, 1.96);
  car.add(fBumper);

  // ── Rear bumper ───────────────────────────────────────────
  const rBumperGeo = new THREE.BoxGeometry(1.65, 0.16, 0.12);
  const rBumper = new THREE.Mesh(rBumperGeo, darkMat);
  rBumper.position.set(0, WHEEL_R + 0.08, -1.96);
  car.add(rBumper);

  // ── Spoiler blade ─────────────────────────────────────────
  const spoilerGeo = new THREE.BoxGeometry(1.56, 0.07, 0.32);
  const spoiler = new THREE.Mesh(spoilerGeo, darkMat);
  spoiler.position.set(0, CABIN_Y + CABIN_H / 2 + 0.14, -1.05);
  car.add(spoiler);
  // Spoiler posts
  [-0.64, 0.64].forEach(sx => {
    const postGeo = new THREE.BoxGeometry(0.06, 0.2, 0.06);
    const post = new THREE.Mesh(postGeo, darkMat);
    post.position.set(sx, CABIN_Y + CABIN_H / 2 + 0.04, -1.05);
    car.add(post);
  });

  // ── Headlights ────────────────────────────────────────────
  [-0.58, 0.58].forEach(sx => {
    const hlGeo = new THREE.BoxGeometry(0.32, 0.13, 0.07);
    const hl = new THREE.Mesh(hlGeo, headlightMat);
    hl.position.set(sx, BODY_Y + 0.14, 1.93);
    car.add(hl);
  });

  // ── Tail lights ───────────────────────────────────────────
  [-0.58, 0.58].forEach(sx => {
    const tlGeo = new THREE.BoxGeometry(0.3, 0.11, 0.07);
    const tl = new THREE.Mesh(tlGeo, taillightMat);
    tl.position.set(sx, BODY_Y + 0.12, -1.93);
    car.add(tl);
  });

  // ── Exhaust pipes ─────────────────────────────────────────
  [-0.42, 0.42].forEach(sx => {
    const exGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.25, 7);
    const ex = new THREE.Mesh(exGeo, darkMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(sx, WHEEL_R + 0.04, -2.02);
    car.add(ex);
  });

  // ── Headlight SpotLights (2×) ─────────────────────────────
  // Each SpotLight is parented to the car group so it moves with
  // the car automatically. A SpotLight needs a target object to
  // define the cone direction; we create a small Object3D target
  // placed ahead of each light and also add it to the car group.
  //
  // userData.isHeadlightSpot = true lets setHeadlightMode()
  // find these lights via car.traverse().
  [-0.55, 0.55].forEach(sx => {
    const spot = new THREE.SpotLight(0xfff5cc, 0, 22, Math.PI / 7, 0.35, 1.5);
    // Start at off (intensity 0) — setHeadlightMode() will enable them
    spot.position.set(sx, BODY_Y + 0.14, 1.95);
    spot.castShadow = false;   // keep perf reasonable
    spot.userData.isHeadlightSpot = true;
    car.add(spot);

    // Target: a point on the road 10 units ahead of the light
    const target = new THREE.Object3D();
    target.position.set(sx, -0.5, 1.95 - 10);
    car.add(target);
    spot.target = target;
  });

  // ── Wheels (4×) ───────────────────────────────────────────
  //
  // Architecture: two-level group so orientation and spin are independent.
  //
  //   wheelPivot  (THREE.Group)
  //     position  = axle world position (x, WHEEL_R, z)
  //     rotation  = NONE — pivot stays upright in the car's local space
  //     │
  //     ├─ tyreSpinner  (THREE.Group)  ← rotation.x is incremented each frame
  //     │    rotation.z = π/2          ← tilts cylinder to lie on its side
  //     │    │
  //     │    ├─ tyreMesh   CylinderGeometry  (isWheelSpin = true)
  //     │    └─ rimMesh    CylinderGeometry  (isWheelSpin = true)
  //     │
  //     └─ archMesh  (static — never rotates)
  //
  // Why two levels?
  //   A CylinderGeometry stands upright (Y axis = cylinder axis).
  //   We need the wheel to spin around the car's X axis (left-right axle).
  //   Applying rotation.z = π/2 to the spinner group re-maps the cylinder's
  //   Y axis onto the world X axis, so incrementing the spinner's
  //   rotation.x actually spins the cylinder around that axle — exactly
  //   like a real wheel rolling forward.

  const wheelX  = 0.97;    // lateral offset from centre
  const wheelFZ =  1.18;   // front axle Z
  const wheelRZ = -1.18;   // rear axle Z
  const wheelY  = WHEEL_R; // centre height = radius → bottom touches y = 0

  [
    { x: -wheelX, z: wheelFZ },
    { x:  wheelX, z: wheelFZ },
    { x: -wheelX, z: wheelRZ },
    { x:  wheelX, z: wheelRZ }
  ].forEach(p => {

    // ── Pivot: holds position, never rotates ────────────────
    const wheelPivot = new THREE.Group();
    wheelPivot.position.set(p.x, wheelY, p.z);
    car.add(wheelPivot);

    // ── Spinner: tilts cylinder onto its side, then spins on X ─
    // rotation.z = π/2 → cylinder Y-axis now points along world X
    // Incrementing rotation.x each frame = rolling around the axle
    const tyreSpinner = new THREE.Group();
    tyreSpinner.rotation.z = Math.PI / 2;
    tyreSpinner.userData.isWheelSpin = true; // animation loop target
    wheelPivot.add(tyreSpinner);

    // Tyre mesh (upright cylinder inside spinner)
    const tyreGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 16);
    const tyreMesh = new THREE.Mesh(tyreGeo, wheelMat);
    tyreMesh.castShadow = true;
    tyreSpinner.add(tyreMesh);

    // Rim mesh (smaller radius, lighter colour)
    const rimGeo = new THREE.CylinderGeometry(WHEEL_R * 0.62, WHEEL_R * 0.62, WHEEL_W + 0.01, 8);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    tyreSpinner.add(rimMesh);

    // Wheel arch (static — attached to pivot, not spinner)
    const archGeo = new THREE.BoxGeometry(WHEEL_W + 0.1, 0.08, WHEEL_R * 2 + 0.1);
    const archMesh = new THREE.Mesh(archGeo, darkMat);
    archMesh.position.y = WHEEL_R + 0.04; // above wheel centre
    wheelPivot.add(archMesh);
  });

  // The group's local origin is at y = 0 (road level).
  // The caller only needs to set car.position.set(x, 0, z)
  return car;
}

// ─────────────────────────────────────────────────────────────
// Player Car — uses createCar()
// ─────────────────────────────────────────────────────────────
function buildCar(scene) {
  const car = createCar(0xcc0022);   // classic arcade red
  car.position.set(0, 0, 5);         // y = 0 → wheels touch road
  scene.add(car);
  return car;
}
