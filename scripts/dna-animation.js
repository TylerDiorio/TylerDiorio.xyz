import { createBackgroundAnimation, updateBackgroundParticles, drawBackgroundParticles } from './background-animation.js';

let canvas, ctx;
let radius, height, turns, basePairs, spheresPerTurn;
let scrollOffset = 0;
let dnaStructure = [];
let backgroundParticles = [];
let textBoxes = [];
let dnaCenter, dnaWidth;
let navButtonRect = { x: 0, y: 0, width: 0, height: 0 };
let displayRotationX = -1.35;
let displayRotationY = 5.5;
let dnaRotationZ = 0;
let dnaCenterX, dnaCenterY;
let mouseX = 0, mouseY = 0;

const INITIAL_DISPLAY_ROTATION_X = -1.35;
const INITIAL_DISPLAY_ROTATION_Y = 5.5;
const INITIAL_DNA_ROTATION_Z = 0;

const nucleotideColors = {
    'A': '#e85c43', 'C': '#45b7d1', 'T': '#ffa600', 'G': '#7c54a0'
};
const strandColor1 = [11, 64, 211];
const strandColor2 = [97, 192, 121];

const keyState = {
    w: false, a: false, s: false, d: false, q: false, e: false
};

const rotationSpeeds = { x: 0, y: 0, z: 1.5 };

const MAX_ROTATION_SPEED = Math.PI * 3;
const ACCELERATION = MAX_ROTATION_SPEED;

function initCanvas() {
    canvas = document.getElementById('dna-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 250));
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateDNAParameters();
    initDNAStructure();
    initBackgroundParticles();
    initTextBoxes();
}

function updateDNAParameters() {
    const minDimension = Math.min(canvas.width, canvas.height);
    radius = minDimension * 0.1;
    height = minDimension * 1.2;
    turns = 4;
    basePairs = 40;
    spheresPerTurn = 50;

    dnaCenterX = canvas.width * 0.75;
    dnaCenterY = canvas.height * 0.6;
    dnaWidth = minDimension * 0.3;
}

function initDNAStructure() {
    dnaStructure = [];
    const nucleotides = ['A', 'C', 'T', 'G'];
    for (let i = 0; i < turns * spheresPerTurn; i++) {
        const t = i / (turns * spheresPerTurn);
        const angle = t * turns * Math.PI;
        const y = height * (t - 0.5);
        
        dnaStructure.push({
            x: radius * Math.cos(angle),
            y: y,
            z: radius * Math.sin(angle),
            color: strandColor1,
            type: 'backbone',
            strand: 1
        });

        dnaStructure.push({
            x: radius * Math.cos(angle + Math.PI),
            y: y,
            z: radius * Math.sin(angle + Math.PI),
            color: strandColor2,
            type: 'backbone',
            strand: 2
        });

        if (i % 5 === 0) {
            const nucleotide1 = nucleotides[Math.floor(i / 5) % 4];
            const nucleotide2 = {A: 'T', T: 'A', C: 'G', G: 'C'}[nucleotide1];
            
            const nuc1 = {
                x: 0.75 * radius * Math.cos(angle),
                y: y,
                z: 0.75 * radius * Math.sin(angle),
                color: nucleotideColors[nucleotide1],
                type: 'nucleotide',
                symbol: nucleotide1,
                strand: 1
            };

            const nuc2 = {
                x: 0.75 * radius * Math.cos(angle + Math.PI),
                y: y,
                z: 0.75 * radius * Math.sin(angle + Math.PI),
                color: nucleotideColors[nucleotide2],
                type: 'nucleotide',
                symbol: nucleotide2,
                strand: 2
            };

            dnaStructure.push(nuc1, nuc2, {
                start: nuc1,
                end: nuc2,
                type: 'connection'
            });
        }
    }
}

function initBackgroundParticles() {
    backgroundParticles = createBackgroundAnimation(canvas.width, canvas.height);
}

function initTextBoxes() {
    const headerHeight = 80;
    const margin = 20;

    textBoxes = [
        { x: margin, y: headerHeight + margin, width: 150, height: 150 }, // Profile picture
        { x: margin + 180, y: headerHeight + margin, width: 200, height: 40 }, // Name
        { x: margin, y: headerHeight + margin + 330, width: 200, height: 30 }, // "Connect with me" text
    ];
}

function rotatePoint(x, y, z, angleX, angleY) {
    let ry = y * Math.cos(angleX) - z * Math.sin(angleX);
    let rz = y * Math.sin(angleX) + z * Math.cos(angleX);
    y = ry;
    z = rz;

    let rx = x * Math.cos(angleY) + z * Math.sin(angleY);
    rz = -x * Math.sin(angleY) + z * Math.cos(angleY);
    x = rx;
    z = rz;

    return [x, y, z];
}

function project(x, y, z) {
    let [rx, ry, rz] = rotatePoint(x, y, z, displayRotationX, displayRotationY);
    const factor = 1000 / (1000 + rz);
    return [rx * factor + dnaCenterX, ry * factor + dnaCenterY];
}

function drawSphere(x, y, z, radius, color) {
    const [px, py] = project(x, y, z);
    let projectedRadius = radius * 1500 / (1000 + z);
    
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, projectedRadius);
    gradient.addColorStop(0, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.arc(px, py, projectedRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
}

function drawNucleotide(x, y, z, symbol, color) {
    const [px, py] = project(x, y, z);
    ctx.font = '500 14px Arial';
    ctx.fillStyle = color;
    ctx.fillText(symbol, px - 5, py + 5);
}

function drawNucleotideConnection(start, end) {
    const [sx, sy, sz] = rotatePoint(start.x, start.y, start.z, displayRotationX, displayRotationY);
    const [ex, ey, ez] = rotatePoint(end.x, end.y, end.z, displayRotationX, displayRotationY);
    
    const [spx, spy] = project(sx, sy, sz);
    const [epx, epy] = project(ex, ey, ez);

    const dx = epx - spx;
    const dy = epy - spy;

    const startX = spx + 0.2 * dx;
    const startY = spy + 0.2 * dy;
    const endX = spx + 0.8 * dx;
    const endY = spy + 0.8 * dy;

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(11, 64, 211, 0.9)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    ctx.setLineDash([]);
}

function updateRotations(deltaTime) {
    if (keyState.q) rotationSpeeds.z = Math.max(-MAX_ROTATION_SPEED, rotationSpeeds.z - ACCELERATION * deltaTime);
    else if (keyState.e) rotationSpeeds.z = Math.min(MAX_ROTATION_SPEED, rotationSpeeds.z + ACCELERATION * deltaTime);

    if (keyState.w) rotationSpeeds.x = Math.max(-MAX_ROTATION_SPEED, rotationSpeeds.x - ACCELERATION * deltaTime);
    else if (keyState.s) rotationSpeeds.x = Math.min(MAX_ROTATION_SPEED, rotationSpeeds.x + ACCELERATION * deltaTime);
    else rotationSpeeds.x *= 0.95;

    if (keyState.d) rotationSpeeds.y = Math.max(-MAX_ROTATION_SPEED, rotationSpeeds.y - ACCELERATION * deltaTime);
    else if (keyState.a) rotationSpeeds.y = Math.min(MAX_ROTATION_SPEED, rotationSpeeds.y + ACCELERATION * deltaTime);
    else rotationSpeeds.y *= 0.95;

    dnaRotationZ += rotationSpeeds.z * deltaTime;
    displayRotationX += rotationSpeeds.x * deltaTime;
    displayRotationY += rotationSpeeds.y * deltaTime;
}

function drawDNA() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundParticles(ctx, backgroundParticles);

    const sortedStructure = [...dnaStructure].sort((a, b) => {
        const az = rotatePoint(a.x, a.y, a.z, displayRotationX, displayRotationY)[2];
        const bz = rotatePoint(b.x, b.y, b.z, displayRotationX, displayRotationY)[2];
        return bz - az;
    });

    sortedStructure.forEach(element => {
        let y = element.y + scrollOffset;
        y = (y + height / 2) % height - height / 2;
    
        const rotatedX = element.x * Math.cos(dnaRotationZ) - element.z * Math.sin(dnaRotationZ);
        const rotatedZ = element.x * Math.sin(dnaRotationZ) + element.z * Math.cos(dnaRotationZ);
    
        if (element.type === 'backbone') {
            const [rx, ry, rz] = rotatePoint(rotatedX, y, rotatedZ, displayRotationX, displayRotationY);
            drawSphere(rx, ry, rz, 3, element.color);
        } else if (element.type === 'nucleotide') {
            const [rx, ry, rz] = rotatePoint(rotatedX, y, rotatedZ, displayRotationX, displayRotationY);
            drawNucleotide(rx, ry, rz, element.symbol, element.color);
        } else if (element.type === 'connection') {
            const startRotated = {
                x: element.start.x * Math.cos(dnaRotationZ) - element.start.z * Math.sin(dnaRotationZ),
                y: (element.start.y + scrollOffset + height / 2) % height - height / 2,
                z: element.start.x * Math.sin(dnaRotationZ) + element.start.z * Math.cos(dnaRotationZ)
            };
    
            const endRotated = {
                x: element.end.x * Math.cos(dnaRotationZ) - element.end.z * Math.sin(dnaRotationZ),
                y: (element.end.y + scrollOffset + height / 2) % height - height / 2,
                z: element.end.x * Math.sin(dnaRotationZ) + element.end.z * Math.cos(dnaRotationZ)
            };
    
            drawNucleotideConnection(startRotated, endRotated);
        }
    });
}

export function updateMousePosition(x, y) {
    mouseX = x;
    mouseY = y;
}

let lastTimestamp = 0;
let animationFrameId;

function animate(timestamp) {
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    scrollOffset += 0.3;
    if (scrollOffset > height / turns) {
        scrollOffset -= height / turns;
    }

    updateRotations(deltaTime);
    updateBackgroundParticles(backgroundParticles, canvas.width, canvas.height, textBoxes, dnaCenterX, dnaWidth, mouseX, mouseY, navButtonRect);
    drawDNA();
    animationFrameId = requestAnimationFrame(animate);
}

function handleKeyDown(e) {
    if (keyState.hasOwnProperty(e.key.toLowerCase())) {
        keyState[e.key.toLowerCase()] = true;
    }
}

function handleKeyUp(e) {
    if (keyState.hasOwnProperty(e.key.toLowerCase())) {
        keyState[e.key.toLowerCase()] = false;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

export function init() {
    initCanvas();
    if (!canvas) return;
    updateDNAParameters();
    initDNAStructure();
    initBackgroundParticles();
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    const navButtons = document.querySelector('nav ul');
    if (navButtons) {
        const rect = navButtons.getBoundingClientRect();
        navButtonRect = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    canvas.tabIndex = 0;
    canvas.focus();

    animationFrameId = requestAnimationFrame(animate);
}

export function handleControlButtonInteraction(key, isPressed) {
    if (keyState.hasOwnProperty(key.toLowerCase())) {
        keyState[key.toLowerCase()] = isPressed;
    }
}

export function resetView() {
    displayRotationX = INITIAL_DISPLAY_ROTATION_X;
    displayRotationY = INITIAL_DISPLAY_ROTATION_Y;
    dnaRotationZ = INITIAL_DNA_ROTATION_Z;
    rotationSpeeds.x = 0;
    rotationSpeeds.y = 0;
    rotationSpeeds.z = 1.5;
    Object.keys(keyState).forEach(key => keyState[key] = false);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function cleanup() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('mousemove', handleMouseMove);
    cancelAnimationFrame(animationFrameId);
}