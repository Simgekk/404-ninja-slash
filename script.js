const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const BASE_WIDTH = 800;
const BASE_HEIGHT = 400;

function setupHiDPI() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = BASE_WIDTH * dpr;
    canvas.height = BASE_HEIGHT * dpr;
    ctx.scale(dpr, dpr);
}
setupHiDPI();

let state = 'RUN';
let frame = 0;
let shakeTime = 0;
let waitTimer = 0;

let timeScale = 1.0;
let targetTimeScale = 1.0;

let mousePos = { x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2 };

const stars = Array.from({ length: 45 }, () => ({
    x: Math.random() * BASE_WIDTH,
    y: Math.random() * (BASE_HEIGHT - 60),
    size: 2,
    alpha: Math.random()
}));

const ninja = {
    x: -80, y: 275, speed: 5.5, vy: 0,
    gravity: 0.85, jumpPower: -16.5, trail: []
};

const text404 = {
    x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2,
    top: { x: 0, y: 0, vx: -2.2, vy: -3.5, rot: 0, vRot: -0.04 },
    bottom: { x: 0, y: 0, vx: 1.8, vy: 1.2, rot: 0, vRot: 0.03 },
    isSliced: false
};

let particles = [];
let mouseTrail = [];
let isDragging = false;

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (BASE_WIDTH / rect.width),
        y: (clientY - rect.top) * (BASE_HEIGHT / rect.height)
    };
}

function handleStart(e) {
    isDragging = true;
    mouseTrail = [];
    const pos = getCanvasPos(e);
    mousePos = pos;
}

function handleMove(e) {
    const pos = getCanvasPos(e);
    mousePos = pos;
    if (!isDragging) return;

    mouseTrail.push({ x: pos.x, y: pos.y, alpha: 1 });
    createSparkles(pos.x, pos.y, 2);
    if (mouseTrail.length > 4) shakeTime = 2;
}

function handleEnd() { isDragging = false; }

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', (e) => { handleStart(e); e.preventDefault(); });
canvas.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); });
canvas.addEventListener('touchend', handleEnd);

function createSparkles(x, y, count = 40) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#ffffff' : '#38bdf8'),
            life: 25
        });
    }
}

function update() {
    frame++;
    timeScale += (targetTimeScale - timeScale) * 0.15;
    let dt = timeScale;

    if (state === 'RUN') {
        ninja.x += ninja.speed * dt;
        if (ninja.x >= 200) { state = 'JUMP'; ninja.vy = ninja.jumpPower; }
    } else if (state === 'JUMP') {
        ninja.x += ninja.speed * 0.85 * dt;
        ninja.y += ninja.vy * dt;
        ninja.vy += ninja.gravity * dt;

        if (ninja.x >= 280 && ninja.x < 330) targetTimeScale = 0.2;

        if (ninja.x >= 330 && !text404.isSliced) {
            state = 'SLASH';
            text404.isSliced = true;
            shakeTime = 12;
            createSparkles(text404.x, text404.y);
        }
    } else if (state === 'SLASH') {
        ninja.x += ninja.speed * 0.7 * dt;
        ninja.y += ninja.vy * dt;
        ninja.vy += ninja.gravity * dt;
        ninja.trail.push({ x: ninja.x, y: ninja.y, alpha: 1 });

        if (ninja.x > 360) targetTimeScale = 1.25;
        if (ninja.y >= 275) { ninja.y = 275; state = 'LAND_RUN'; }
    } else if (state === 'LAND_RUN') {
        ninja.x += ninja.speed * 1.1 * dt;
        
        if (ninja.x > BASE_WIDTH + 80) {
            waitTimer += dt;
            if (waitTimer >= 150) { 
                resetAnimation();
            }
        }
    }

    if (text404.isSliced) {
        text404.top.x += text404.top.vx * dt; 
        text404.top.y += text404.top.vy * dt;
        text404.top.vy += 0.08 * dt;
        text404.top.rot += text404.top.vRot * dt;

        text404.bottom.x += text404.bottom.vx * dt; 
        text404.bottom.y += text404.bottom.vy * dt;
        text404.bottom.vy += 0.10 * dt; 
        text404.bottom.rot += text404.bottom.vRot * dt;
    }

    ninja.trail.forEach((t, i) => { t.alpha -= 0.1 * dt; if (t.alpha <= 0) ninja.trail.splice(i, 1); });
    particles.forEach((p, i) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) particles.splice(i, 1); });
    mouseTrail.forEach((t, i) => { t.alpha -= 0.12; if (t.alpha <= 0) mouseTrail.splice(i, 1); });
}

function resetAnimation() {
    ninja.x = -80; ninja.y = 275; ninja.vy = 0; ninja.trail = [];
    waitTimer = 0;
    targetTimeScale = 1.0; timeScale = 1.0; text404.isSliced = false;
    text404.top = { x: 0, y: 0, vx: -2.2, vy: -3.5, rot: 0, vRot: -0.04 };
    text404.bottom = { x: 0, y: 0, vx: 1.8, vy: 1.2, rot: 0, vRot: 0.03 };
    state = 'RUN';
}

function drawBackground() {
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 320, BASE_WIDTH, 2);
}

function drawPixelNinja() {
    const p = 5.5;
    ctx.save();
    ctx.translate(Math.round(ninja.x), Math.round(ninja.y));

    let runFrame = (state === 'RUN' || state === 'LAND_RUN') ? Math.floor(frame / 4) % 2 : 0;

    ctx.fillStyle = '#ef4444';
    let scarfWave = Math.sin(frame * 0.3) * p;
    ctx.fillRect(-6 * p, -10 * p + scarfWave, 4 * p, 2.5 * p);
    ctx.fillRect(-9 * p, -9 * p + scarfWave, 4 * p, 2.5 * p);

    ctx.fillStyle = '#0f172a';
    if (runFrame === 0) {
        ctx.fillRect(-3 * p, -2 * p, 2 * p, 3 * p); ctx.fillRect(1 * p, -2 * p, 2 * p, 3 * p);
    } else {
        ctx.fillRect(-4 * p, -2 * p, 2 * p, 3 * p); ctx.fillRect(2 * p, -2 * p, 2 * p, 3 * p);
    }

    ctx.fillStyle = '#1e293b'; ctx.fillRect(-3.5 * p, -7 * p, 7 * p, 5 * p);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-3.5 * p, -4.5 * p, 7 * p, 1.5 * p);

    ctx.fillStyle = '#1e293b'; ctx.fillRect(-5 * p, -15 * p, 10 * p, 8 * p);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(-3.5 * p, -13 * p, 7 * p, 3.5 * p);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-3 * p, -10.8 * p, 1.5 * p, 1 * p);
    ctx.fillRect(1.5 * p, -10.8 * p, 1.5 * p, 1 * p);

    let eyeOffsetX = (mousePos.x > ninja.x) ? 0.4 * p : -0.4 * p;
    let eyeOffsetY = (mousePos.y > ninja.y) ? 0.3 * p : -0.3 * p;

    ctx.fillStyle = '#020617';
    ctx.fillRect(-2 * p + eyeOffsetX, -12.5 * p + eyeOffsetY, 1.5 * p, 2 * p);
    ctx.fillRect(0.5 * p + eyeOffsetX, -12.5 * p + eyeOffsetY, 1.5 * p, 2 * p);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2 * p + eyeOffsetX, -12.5 * p + eyeOffsetY, 0.8 * p, 0.8 * p);
    ctx.fillRect(0.5 * p + eyeOffsetX, -12.5 * p + eyeOffsetY, 0.8 * p, 0.8 * p);

    ctx.fillStyle = '#e2e8f0';
    if (state === 'SLASH') {
        ctx.fillRect(3.5 * p, -9 * p, 7 * p, 2.5 * p);
        ctx.fillRect(9 * p, -13 * p, 2.5 * p, 6 * p);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(6 * p, -16 * p, 9 * p, 3 * p);
        ctx.fillRect(10 * p, -13 * p, 7 * p, 3 * p);
    } else {
        ctx.fillRect(3.5 * p, -11 * p, 2.5 * p, 7 * p);
        ctx.fillRect(4.5 * p, -16 * p, 2.5 * p, 6 * p);
    }

    ctx.restore();
}

function draw404Text() {
    ctx.save();
    ctx.save();
    ctx.translate(text404.x + text404.top.x, text404.y + text404.top.y);
    ctx.rotate(text404.top.rot);
    ctx.beginPath(); ctx.moveTo(-250, -120); ctx.lineTo(250, -120); ctx.lineTo(120, 10); ctx.lineTo(-250, -20); ctx.closePath(); ctx.clip();
    renderText();
    ctx.restore();

    ctx.save();
    ctx.translate(text404.x + text404.bottom.x, text404.y + text404.bottom.y);
    ctx.rotate(text404.bottom.rot);
    ctx.beginPath(); ctx.moveTo(-250, -20); ctx.lineTo(120, 10); ctx.lineTo(250, 120); ctx.lineTo(-250, 120); ctx.closePath(); ctx.clip();
    renderText();
    ctx.restore();
    ctx.restore();
}

function renderText() {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#020617'; ctx.lineWidth = 16;
    ctx.font = '900 115px -apple-system, Arial, sans-serif';
    ctx.strokeText('404', 0, -25); ctx.fillStyle = '#ef4444'; ctx.fillText('404', 0, -25);
    ctx.font = '900 38px -apple-system, Arial, sans-serif';
    ctx.strokeText('ERROR', 0, 50); ctx.fillStyle = '#f8fafc'; ctx.fillText('ERROR', 0, 50);
}

function drawUserSlices() {
    if (mouseTrail.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
    for (let i = 1; i < mouseTrail.length; i++) {
        ctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
    }
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.stroke();
}

function loop() {
    ctx.save();
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        shakeTime--;
    }

    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    drawBackground();
    draw404Text();
    drawPixelNinja();
    drawUserSlices();

    particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });

    ctx.restore();
    update();
    requestAnimationFrame(loop);
}

document.getElementById('replayBtn').addEventListener('click', resetAnimation);
loop();