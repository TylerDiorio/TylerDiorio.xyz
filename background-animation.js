let interactiveElements = [];
let isReducedMotion = false;
let easterEggState = 0;
let easterEggTime = 0;
let galaxyCenter = { x: 0, y: 0 };
let blackHolePosition = { x: 0, y: 0 };
let fireworksTimers = [];
let flockCenter = { x: 0, y: 0 };
let flockStartTime = 0;
let particles = [];
let fireworks = [];

function createBackgroundParticle(width, height) {
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        affectedByDNA: true,
        brownianAngle: Math.random() * Math.PI * 2,
        color: 'rgba(255, 255, 255, 0.5)',
    };
}

export function createBackgroundAnimation(width, height) {
    particles = [];
    const numParticles = Math.floor(width * height / 8000);
    for (let i = 0; i < numParticles; i++) {
        particles.push(createBackgroundParticle(width, height));
    }
    return particles;
}

function applyBrownianMotion(particle) {
    const brownianForce = 0.015;
    particle.vx += (Math.random() - 0.5) * brownianForce;
    particle.vy += (Math.random() - 0.5) * brownianForce;

    const constantBrownianForce = 0.000825;
    particle.vx += Math.cos(particle.brownianAngle) * constantBrownianForce;
    particle.vy += Math.sin(particle.brownianAngle) * constantBrownianForce;

    if (Math.random() < 0.01) {
        particle.brownianAngle = Math.random() * Math.PI * 2;
    }
}

function calculateDistanceToRectangle(px, py, rect) {
    const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.width));
    const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.height));
    return Math.sqrt(dx * dx + dy * dy);
}

export function updateBackgroundParticles(particles, width, height, textBoxes, dnaCenter, dnaWidth, mouseX, mouseY, navButtonRect) {
    easterEggTime += 0.016;

    if (easterEggState === 6) {
        updateFireworks(width, height);
        return; // Skip particle updates for case 6
    }

    particles.forEach(p => {
        if (isReducedMotion) {
            return;
        }

        applyBrownianMotion(p);

        textBoxes.forEach(box => {
            const dx = p.x - (box.x + box.width / 2);
            const dy = p.y - (box.y + box.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const repulsionRadius = Math.max(box.width, box.height) / 2.1;

            if (distance < repulsionRadius) {
                const force = (1 - distance / repulsionRadius) * 0.0002;
                p.vx += dx * force;
                p.vy += dy * force;
            }
        });

        const expandedNavRect = {
            x: navButtonRect.x - navButtonRect.width * 0.1,
            y: navButtonRect.y - navButtonRect.height * 0.1,
            width: navButtonRect.width * 1.4,
            height: navButtonRect.height * 1.4
        };
        const distanceToNav = calculateDistanceToRectangle(p.x, p.y, expandedNavRect);
        const navRepulsionRadius = Math.max(navButtonRect.width, navButtonRect.height) * 0.2;

        if (distanceToNav < navRepulsionRadius) {
            const force = (1 - distanceToNav / navRepulsionRadius) * 0.001;
            const dx = p.x - (navButtonRect.x + navButtonRect.width / 2);
            const dy = p.y - (navButtonRect.y + navButtonRect.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            p.vx += (dx / distance) * force;
            p.vy += (dy / distance) * force;
        }

        const mouseRepulsionRadius = 50;
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);
        if (mouseDistance < mouseRepulsionRadius) {
            const force = (1 - mouseDistance / mouseRepulsionRadius) * 0.001;
            p.vx += dx * force;
            p.vy += dy * force;
        }

        interactiveElements.forEach(element => {
            const dx = p.x - (element.x + element.width / 2);
            const dy = p.y - (element.y + element.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const interactionRadius = Math.max(element.width, element.height) * 2;

            if (distance < interactionRadius) {
                let force;
                if (element.isClicked) {
                    force = (1 - distance / interactionRadius) * 0.002;
                    p.vx -= dx * force;
                    p.vy -= dy * force;
                } else if (element.isHovered) {
                    force = (1 - distance / interactionRadius) * 0.0002;
                    p.vx += dx * force;
                    p.vy += dy * force;
                }
            }
        });

        switch (easterEggState) {
            case 1: // "RGB" - Colorful Ripples
                const distanceFromCenter = Math.sqrt((p.x - width / 2) ** 2 + (p.y - height / 2) ** 2);
                const ripplePhase = (distanceFromCenter / 50) - easterEggTime;
                p.color = `rgb(
                    ${Math.sin(ripplePhase) * 127 + 128},
                    ${Math.sin(ripplePhase + 2) * 127 + 128},
                    ${Math.sin(ripplePhase + 4) * 127 + 128}
                )`;
                break;
            case 2: // "WAVE" - Sine Wave Pattern
                const waveY = Math.sin((p.x / width) * Math.PI * 2 + easterEggTime) * height / 6;
                p.vy += (waveY - p.y) * 0.05;
                p.color = `hsl(${(p.y / height) * 360}, 100%, 50%)`;
                break;
            case 3: // "GALAXY" - Spiral Galaxy Effect
                const angleToCenter = Math.atan2(p.y - galaxyCenter.y, p.x - galaxyCenter.x);
                const distanceToCenter = Math.sqrt((p.x - galaxyCenter.x) ** 2 + (p.y - galaxyCenter.y) ** 2);
                const spiralForce = 0.02;
                p.vx += (Math.cos(angleToCenter + distanceToCenter / 50) - (p.x - galaxyCenter.x) / distanceToCenter) * spiralForce;
                p.vy += (Math.sin(angleToCenter + distanceToCenter / 50) - (p.y - galaxyCenter.y) / distanceToCenter) * spiralForce;
                p.color = `rgba(${100 + Math.floor(155 * (1 - distanceToCenter / Math.max(width, height)))}, 100, 255, 0.5)`;
                break;
            case 4: // "BH" - Black Hole with particle jets
                const dxBH = p.x - blackHolePosition.x;
                const dyBH = p.y - blackHolePosition.y;
                const distanceToBH = Math.sqrt(dxBH * dxBH + dyBH * dyBH);
            
                if (easterEggTime <= 2) {
                    const bhForce = 0.1 / (distanceToBH + 1);
                    p.vx -= dxBH * bhForce;
                    p.vy -= dyBH * bhForce;
            
                    const jetAngle = Math.atan2(dyBH, dxBH);
                    const jetForce = 0.05 / (distanceToBH + 1);
                    const jetDirection = Math.sin(jetAngle * 4) > 0 ? 1 : -1;
                    p.vx += Math.cos(jetAngle + Math.PI / 2 * jetDirection) * jetForce;
                    p.vy += Math.sin(jetAngle + Math.PI / 2 * jetDirection) * jetForce;
            
                    const hue = (distanceToBH / Math.max(width, height)) * 360;
                    const saturation = Math.min(100, 100 * (1 - distanceToBH / Math.max(width, height)));
                    p.color = `hsla(${hue}, ${saturation}%, 50%, ${Math.min(1, 5 / distanceToBH)})`;
                }
                break;
            case 5: // "FIREWORKS" - Particles explode periodically
                if (fireworksTimers.some(timer => timer <= 0)) {
                    const explosionX = Math.random() * width;
                    const explosionY = Math.random() * height;
                    const dxFirework = p.x - explosionX;
                    const dyFirework = p.y - explosionY;
                    const distanceToFirework = Math.sqrt(dxFirework * dxFirework + dyFirework * dyFirework);
                    if (distanceToFirework < 100) {
                        const angle = Math.atan2(dyFirework, dxFirework);
                        const force = (100 - distanceToFirework) / 100;
                        p.vx += Math.cos(angle) * force * 5;
                        p.vy += Math.sin(angle) * force * 5;
                        p.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    }
                }
                fireworksTimers = fireworksTimers.map(timer => timer - 0.016);
                if (fireworksTimers.every(timer => timer <= 0)) {
                    fireworksTimers.push(Math.random() * 2 + 1);
                }
                break;
            case 6: // "FIREWORKS" - Persistent fireworks effect
                updateFireworks(width, height);
                fireworks = [];
                particles = []; // Clear existing particles
                break;
            case 99: // "FLOCK" - Particles contract then rapidly expand once
                const flockTime = easterEggTime - flockStartTime;
                if (flockTime < 2.5) {
                    const contractionForce = 0.025 * (2.5 - flockTime) / 2.5;
                    p.vx += (flockCenter.x - p.x) * contractionForce;
                    p.vy += (flockCenter.y - p.y) * contractionForce;
                } else if (flockTime < 3) {
                    const expansionForce = 2 * (flockTime - 2.5) / 0.5;
                    const angle = Math.atan2(p.y - flockCenter.y, p.x - flockCenter.x);
                    p.vx += Math.cos(angle) * expansionForce;
                    p.vy += Math.sin(angle) * expansionForce;
                }
                p.color = `rgba(255, 255, 255, 0.5)`;
                break;               
            default:
                const normalColor = 'rgba(255, 255, 255, 0.5)';
                if (p.color !== normalColor) {
                    const currentColor = p.color.match(/\d+/g);
                    const targetColor = [255, 255, 255];
                    const newColor = currentColor.map((c, i) => {
                        return Math.round(Number(c) + (targetColor[i] - Number(c)) * 0.1);
                    });
                    p.color = `rgba(${newColor[0]}, ${newColor[1]}, ${newColor[2]}, 0.5)`;
                }
        }
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x = (p.x + width) % width;
        p.y = (p.y + height) % height;
    });
}

export function toggleEasterEgg(state, width, height) {
    easterEggState = state;
    easterEggTime = 0;
    
    switch (state) {
        case 1: // RGB
            break;
        case 2: // WAVE
            break;
        case 3: // GALAXY
            galaxyCenter = { x: width / 2, y: height / 2 };
            break;
        case 4: // BH (Black Hole)
            blackHolePosition = { x: width / 2, y: height / 2 };
            break;
        case 5: // FIREWORKS
            fireworksTimers = [0];
            break;
        case 6: // PERSISTENT FIREWORKS
            fireworks = [];
            break;
        case 99: // FLOCK
            flockCenter = { x: width / 2, y: height / 2 };
            flockStartTime = easterEggTime;
            break;
        default:
            easterEggState = 0;
            particles.forEach(p => {
                p.color = 'rgba(255, 255, 255, 0.5)';
            });
            break;
    }
}

export function drawBackgroundParticles(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (easterEggState === 6) {
        drawFireworks(ctx);
        return; // Skip drawing regular particles for case 6
    }

    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        particles.forEach(p2 => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p.color.replace('0.5)', '0.05)');
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });
    });

    if (easterEggState === 4) {
        ctx.beginPath();
        ctx.arc(blackHolePosition.x, blackHolePosition.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    if (easterEggState === 6) {
        drawFireworks(ctx);
    }
}

function createFirework(x, y, width, height) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const particles = [];

    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
        });
    }

    return { x, y, particles, color };
}

function updateFireworks(width, height) {
    if (Math.random() < 0.15) { // Reduced frequency of new fireworks
        const x = Math.random() * width;
        const y = Math.random() * (height * 0.5);
        fireworks.push(createFirework(x, y, width, height));
    }

    fireworks.forEach((firework, index) => {
        firework.particles.forEach((particle, i) => {
            particle.x += particle.vx * 0.2; // Slowed down particle movement
            particle.y += particle.vy * 0.2; // Slowed down particle movement
            particle.vy += 0.02; // Reduced gravity effect
            particle.alpha -= 0.005; // Slowed down fading

            if (particle.alpha <= 0) {
                firework.particles.splice(i, 1);
            }
        });

        if (firework.particles.length === 0) {
            fireworks.splice(index, 1);
        }
    });
}

function drawFireworks(ctx) {
    fireworks.forEach(firework => {
        firework.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(firework.x + particle.x, firework.y + particle.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(firework.color)}, ${particle.alpha})`;
            ctx.fill();
        });
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

export function initInteractiveElements() {
    const socialButtons = document.querySelectorAll('.social-links a');
    socialButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        const interactiveElement = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            isHovered: false,
            isClicked: false
        };
        interactiveElements.push(interactiveElement);

        button.addEventListener('mouseenter', () => { 
            interactiveElement.isHovered = true; 
        });
        button.addEventListener('mouseleave', () => { 
            interactiveElement.isHovered = false; 
            interactiveElement.isClicked = false;
        });
        button.addEventListener('mousedown', () => { 
            interactiveElement.isClicked = true; 
        });
        button.addEventListener('mouseup', () => { 
            interactiveElement.isClicked = false; 
        });
    });
}

export function updateElementPositions() {
    interactiveElements.forEach((element, index) => {
        const button = document.querySelectorAll('.social-links a')[index];
        const rect = button.getBoundingClientRect();
        element.x = rect.left;
        element.y = rect.top;
        element.width = rect.width;
        element.height = rect.height;
    });
}

export function initAccessibility() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener('change', () => {
        isReducedMotion = mediaQuery.matches;
    });
}

export function init() {
    initInteractiveElements();
    updateElementPositions();
    initAccessibility();

    window.addEventListener('resize', () => {
        setTimeout(updateElementPositions, 250);
    });
}

export function getParticles(width, height) {
    return createBackgroundAnimation(width, height);
}