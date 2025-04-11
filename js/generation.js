import * as THREE from 'three';

// Taille par défaut du labyrinthe
export let MAZE_WIDTH = 50;
export let MAZE_HEIGHT = 50;

// Coordonnées de départ et d’arrivée
let startX = 2;
let startY = 2;
let endX, endY;

const directions = [
  [0, 1], [0, -1],
  [1, 0], [-1, 0],
];

// Génération du labyrinthe par backtracking récursif
export function generateMaze(width = MAZE_WIDTH, height = MAZE_HEIGHT) {
  MAZE_WIDTH = width;
  MAZE_HEIGHT = height;

  const maze = Array.from({ length: MAZE_HEIGHT }, () => Array(MAZE_WIDTH).fill(1));
  const stack = [];
  startX = 2;
  startY = 2;

  maze[startY][startX] = 0;
  stack.push([startX, startY]);

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = getValidNeighbors(cx, cy, maze);

    if (neighbors.length > 0) {
      shuffleArray(neighbors);
      const [nx, ny, dx, dy] = neighbors[0];

      maze[ny][nx] = 0;
      maze[cy + dy][cx + dx] = 0;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }

  endX = MAZE_WIDTH - 2;
  endY = MAZE_HEIGHT - 2;
  maze[endY][endX] = 0;

  return { maze, startX, startY, endX, endY };
}

// Supprime les objets du labyrinthe de la scène
export function clearMaze(scene) {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (obj.isMesh || obj.isInstancedMesh || obj.isLine) {
      scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
  }
}

// Crée et affiche le labyrinthe avec les chemins
export function createInstancedMaze(
  maze,
  path = [],
  altPath = [],
  scene,
  wallColor = 0xfee9fe,
  pathColor = 0xa535f9
) {
  const wallMaterial = new THREE.MeshPhongMaterial({ color: wallColor, shininess: 100 });
  const pathMaterial = new THREE.MeshStandardMaterial({ color: pathColor, side: THREE.DoubleSide });
  const altPathMaterial = new THREE.MeshStandardMaterial({ color: wallColor, side: THREE.DoubleSide });

  const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
  const planeGeometry = new THREE.PlaneGeometry(1, 1);
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const wireGeometry = new THREE.EdgesGeometry(wallGeometry);

  const wallMesh = new THREE.InstancedMesh(wallGeometry, wallMaterial, maze.length * maze[0].length);
  const pathMesh = new THREE.InstancedMesh(planeGeometry, pathMaterial, path.length);
  const altPathMesh = new THREE.InstancedMesh(planeGeometry, altPathMaterial, altPath.length);

  let wallIndex = 0;
  let pathIndex = 0;
  let altPathIndex = 0;

  const offsetX = maze[0].length / 2;
  const offsetY = maze.length / 2;

  // Génère les murs
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 1) {
        const matrix = new THREE.Matrix4().setPosition(x - offsetX, 0, y - offsetY);
        wallMesh.setMatrixAt(wallIndex++, matrix);

        const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
        wireframe.position.set(x - offsetX, 0, y - offsetY);
        scene.add(wireframe);
      }
    }
  }

  // Génère les chemins
  path.forEach(([x, y]) => {
    const matrix = new THREE.Matrix4()
      .makeRotationX(-Math.PI / 2)
      .setPosition(x - offsetX, -0.5, y - offsetY);
    pathMesh.setMatrixAt(pathIndex++, matrix);
  });

  altPath.forEach(([x, y]) => {
    const matrix = new THREE.Matrix4()
      .makeRotationX(-Math.PI / 2)
      .setPosition(x - offsetX, -0.5, y - offsetY);
    altPathMesh.setMatrixAt(altPathIndex++, matrix);
  });

  scene.add(wallMesh);
  scene.add(pathMesh);
  // scene.add(altPathMesh); // Uncomment if needed
}

// Ajoute des lumières à la scène
export function addLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.1);
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
  dirLight1.position.set(5, 10, 5);
  dirLight1.castShadow = true;

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight2.position.set(-5, 10, -5);

  scene.add(ambient, dirLight1, dirLight2);
}

// -------------------
// Fonctions utilitaires
// -------------------

function getValidNeighbors(x, y, maze) {
  const neighbors = [];
  for (const [dx, dy] of directions) {
    const nx = x + dx * 2;
    const ny = y + dy * 2;
    if (
      nx > 0 && nx < MAZE_WIDTH - 1 &&
      ny > 0 && ny < MAZE_HEIGHT - 1 &&
      maze[ny][nx] === 1
    ) {
      neighbors.push([nx, ny, dx, dy]);
    }
  }
  return neighbors;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
