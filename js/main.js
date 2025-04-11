import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { 
    createInstancedMaze, 
    generateMaze, 
    clearMaze, 
    addLights, 
    MAZE_WIDTH, 
    MAZE_HEIGHT 
} from './generation.js';

// Constantes
const MIN_MOVEMENTS = (MAZE_WIDTH + MAZE_HEIGHT) / 2;

// Initialisation
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-18, 47, -40);
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('div').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

addLights(scene);

// Variables de labyrinthe
let maze, startX, startY, endX, endY;
let shortestPath = [];

// ---------- FONCTIONS PRINCIPALES ----------

function generateValidMaze(width = MAZE_WIDTH, height = MAZE_HEIGHT) {
    let path;
    do {
        ({ maze, startX, startY, endX, endY } = generateMaze(width, height));
        path = findShortestPath(maze, startX, startY, endX, endY);
    } while (!path || path.length < MIN_MOVEMENTS);
    return path;
}

function handleGenerateClick(event) {
    event.preventDefault();
    clearMaze(scene);

    const width = parseInt(document.getElementById('widthInput').value);
    const height = parseInt(document.getElementById('heightInput').value);
    const wallColor = parseInt(document.getElementById('wallColor').value.replace('#', '0x'));
    const pathColor = parseInt(document.getElementById('pathColor').value.replace('#', '0x'));

    shortestPath = generateValidMaze(width, height);
    createInstancedMaze(maze, shortestPath, shortestPath, scene, wallColor, pathColor);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ---------- ÉVÈNEMENTS ----------
document.getElementById('generateButton').addEventListener('click', handleGenerateClick);

// ---------- LANCEMENT INITIAL ----------
shortestPath = generateValidMaze();
createInstancedMaze(maze, shortestPath, shortestPath, scene);
renderer.setAnimationLoop(animate);


// ---------- ALGORYTHME BFS ----------
export function findShortestPath(maze, startX, startY, endX, endY) {
    const rows = maze.length;
    const cols = maze[0].length;
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    const queue = [[startX, startY, []]];
    const visited = new Set([`${startX},${startY}`]);

    while (queue.length > 0) {
        const [x, y, path] = queue.shift();
        if (x === endX && y === endY) return [...path, [x, y]];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx >= 0 && nx < cols &&
                ny >= 0 && ny < rows &&
                maze[ny][nx] === 0 &&
                !visited.has(`${nx},${ny}`)
            ) {
                visited.add(`${nx},${ny}`);
                queue.push([nx, ny, [...path, [x, y]]]);
            }
        }
    }

    return null;
}
