interface Position {
  x: number;
  y: number;
}

// Adicione isso nas interfaces
interface Obstacle extends Position {
  expiresAt: number; // Timestamp de quando a pedra deve sumir
}

// Atualize o Item
interface Item extends Position {
  type: 'food' | 'extra_points' | 'earth_fruit' | 'ice_fruit' | 'fire_fruit';
}

// Novo estado
let obstacles: Obstacle[] = [];

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreDisplay = document.getElementById('score') as HTMLElement;

// Configurações do Grid
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

// Estado do Jogo
let snake: Position[] = [{ x: 10, y: 10 }];
let direction: Position = { x: 0, y: 0 };
let currentItem: Item = { x: 5, y: 5, type: 'food' };
let score = 0;
let isGameOver = false;

// Controle de FPS (Velocidade do Jogo)
let lastRenderTime = 0;
let currentSpeed = 6; // Quadros por segundo
let iceEffectExpiration = 0; // Guarda quando o efeito deve acabar
let fireEffectExpiration = 0; // Guarda quando o efeito deve acabar

function main(currentTime: number) {
  if (isGameOver) {
    alert('Game Over! Pressione F5 para reiniciar.');
    return;
  }

  window.requestAnimationFrame(main);

  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / currentSpeed) return;

  lastRenderTime = currentTime;

  update();
  draw();
}

function update() {
  const now = Date.now();

  if (direction.x === 0 && direction.y === 0) return;

  // 1. Mover a cabeça
  const head: Position = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // 2. Colisão com paredes
  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    isGameOver = true;
    return;
  }

  if (iceEffectExpiration > 0 && now > iceEffectExpiration) {
    currentSpeed = 6; // Volta a velocidade ao normal
    iceEffectExpiration = 0; // Zera o contador
  }

  if (fireEffectExpiration > 0 && now > fireEffectExpiration) {
    currentSpeed = 6; // Volta a velocidade ao normal
    fireEffectExpiration = 0; // Zera o contador
  }


  obstacles = obstacles.filter(obs => obs.expiresAt > now);

  // NOVA LÓGICA: Colisão com Obstáculos
  for (let i = 0; i < obstacles.length; i++) {
    if (head.x === obstacles[i].x && head.y === obstacles[i].y) {
      isGameOver = true;
      return;
    }
  }

  // 3. Colisão com o próprio corpo
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      isGameOver = true;
      return;
    }
  }

  snake.unshift(head);

  // 4. Coleta de item
  if (head.x === currentItem.x && head.y === currentItem.y) {
    let pointsGained = 0;

    if (currentItem.type === 'earth_fruit') {
      score += 15;
      for (let i = 0; i < 6; i++) {
        obstacles.push({
          x: Math.floor(Math.random() * TILE_COUNT),
          y: Math.floor(Math.random() * TILE_COUNT),
          expiresAt: now + 5000
        });
      }
    } else if (currentItem.type === 'ice_fruit') {
      score += 15;
      currentSpeed = 3; // Deixa a cobrinha super lenta (metade da velocidade)
      iceEffectExpiration = now + 5000; // Dura 5 segundos (5000ms)
      fireEffectExpiration = 0;
    } else if (currentItem.type === 'fire_fruit') {
      score += 15;
      currentSpeed = 12; // Deixa a cobrinha super veloz (dobro da velocidade)
      fireEffectExpiration = now + 5000; // Dura 5 segundos (5000ms)
      iceEffectExpiration = 0;
    } else {
      score += currentItem.type === 'extra_points' ? 30 : 10;
    }

    if (fireEffectExpiration > now) {
      pointsGained *= 3;
    }

    score += pointsGained;
    scoreDisplay.innerText = score.toString();
    spawnItem();
  } else {
    snake.pop();
  }
}

function spawnItem() {
  const types: Item['type'][] = ['food', 'food', 'extra_points', 'earth_fruit', 'ice_fruit', 'fire_fruit'];
  const randomType = types[Math.floor(Math.random() * types.length)];

  currentItem = {
    x: Math.floor(Math.random() * TILE_COUNT),
    y: Math.floor(Math.random() * TILE_COUNT),
    type: randomType,
  };
}

function draw() {
  // Limpar tela
  ctx.fillStyle = '#202024';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar Cobrinha
  ctx.fillStyle = '#04d361';
  snake.forEach((segment) => {
    ctx.fillRect(
      segment.x * GRID_SIZE,
      segment.y * GRID_SIZE,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    );
  });

  ctx.fillStyle = '#737380'; // Cinza chumbo
  obstacles.forEach((obs) => {
    ctx.fillRect(
      obs.x * GRID_SIZE,
      obs.y * GRID_SIZE,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    );
  });

  // Desenhar Item / Power-up (Atualizado)
  if (currentItem.type === 'earth_fruit') {
    ctx.fillStyle = '#8B4513'; // Marrom (Terra)
  } else if (currentItem.type === 'ice_fruit') {
    ctx.fillStyle = '#00BFFF'; // Azul Claro (Gelo)
  } else if (currentItem.type === 'extra_points') {
    ctx.fillStyle = '#e1e1e6'; // Branco
  } else if (currentItem.type === 'fire_fruit') {
    ctx.fillStyle = '#ff8000'; // Vermelho padrão
  } else {
    ctx.fillStyle = '#ff0055';
  }

  ctx.fillRect(
    currentItem.x * GRID_SIZE,
    currentItem.y * GRID_SIZE,
    GRID_SIZE - 2,
    GRID_SIZE - 2
  );
}

// Captura de Teclado
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      if (direction.y !== 0) break;
      direction = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
      if (direction.y !== 0) break;
      direction = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
      if (direction.x !== 0) break;
      direction = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
      if (direction.x !== 0) break;
      direction = { x: 1, y: 0 };
      break;
  }
});

// Inicia o Game Loop
window.requestAnimationFrame(main);