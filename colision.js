
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const collisionCountElement =
    document.getElementById("collisionCount");
const circleCountElement =
    document.getElementById("circleCount");
const systemState =
    document.getElementById("systemState");
const statusText =
    document.getElementById("statusText");

let canvasWidth = 0;
let canvasHeight = 0;

let circles = [];
let collisionCount = 0;
let activeCollisions = new Set();
let isPaused = false;

// Ajustar dimensiones del Canvas
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Mantener círculos dentro del área visible
    circles.forEach(circle => {
        circle.posX = Math.max(
            circle.radius,
            Math.min(canvasWidth - circle.radius, circle.posX)
        );

        circle.posY = Math.max(
            circle.radius,
            Math.min(canvasHeight - circle.radius, circle.posY)
        );
    });
}

class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;

        this.originalColor = color;
        this.text = text;
        this.speed = speed;

        const angle = Math.random() * Math.PI * 2;

        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;

        this.isColliding = false;
        this.flashFrames = 0;
    }

    draw(context) {
        const active = this.isColliding ||
            this.flashFrames > 0;

        const color = active
            ? "#0000FF"
            : this.originalColor;

        context.save();

        context.beginPath();
        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2
        );

        // Efecto de brillo RGB
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.shadowColor = color;
        context.shadowBlur = 18;
        context.stroke();

        context.closePath();

        // Texto central
        context.shadowBlur = 0;
        context.fillStyle = "#e5f4ff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 13px Rajdhani, Arial";

        context.fillText(
            this.text,
            this.posX,
            this.posY
        );

        context.restore();
    }

    update() {
        this.posX += this.dx;
        this.posY += this.dy;

        // Rebote horizontal
        if (this.posX + this.radius >= canvasWidth) {
            this.posX = canvasWidth - this.radius;
            this.dx = -Math.abs(this.dx);
        }

        if (this.posX - this.radius <= 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        // Rebote vertical
        if (this.posY + this.radius >= canvasHeight) {
            this.posY = canvasHeight - this.radius;
            this.dy = -Math.abs(this.dy);
        }

        if (this.posY - this.radius <= 0) {
            this.posY = this.radius;
            this.dy = Math.abs(this.dy);
        }

        if (this.flashFrames > 0) {
            this.flashFrames--;
        }
    }

    getDistance(otherCircle) {
        return Math.hypot(
            this.posX - otherCircle.posX,
            this.posY - otherCircle.posY
        );
    }

    detectCollision(otherCircle) {
        return this.getDistance(otherCircle) <=
            this.radius + otherCircle.radius;
    }

    resolveCollision(otherCircle) {
        let distanceX = otherCircle.posX - this.posX;
        let distanceY = otherCircle.posY - this.posY;

        let distance = Math.hypot(
            distanceX,
            distanceY
        );

        if (distance === 0) {
            distanceX = 1;
            distanceY = 0;
            distance = 1;
        }

        const nx = distanceX / distance;
        const ny = distanceY / distance;

        // Corregir superposición
        const overlap =
            this.radius + otherCircle.radius - distance;

        if (overlap > 0) {
            const correction = overlap / 2 + 0.01;

            this.posX -= nx * correction;
            this.posY -= ny * correction;

            otherCircle.posX += nx * correction;
            otherCircle.posY += ny * correction;
        }

        const relativeVX = otherCircle.dx - this.dx;
        const relativeVY = otherCircle.dy - this.dy;

        const velocityAlongNormal =
            relativeVX * nx + relativeVY * ny;

        if (velocityAlongNormal >= 0) {
            return false;
        }

        // Rebote elástico con masas iguales
        const impulse = -velocityAlongNormal;

        this.dx -= impulse * nx;
        this.dy -= impulse * ny;

        otherCircle.dx += impulse * nx;
        otherCircle.dy += impulse * ny;

        this.flashFrames = 8;
        otherCircle.flashFrames = 8;

        return true;
    }
}

// Generar 20 círculos
function generateCircles(n) {
    circles = [];

    for (let i = 0; i < n; i++) {
        const radius = Math.min(
            28,
            Math.max(12, canvasWidth / 35)
        );

        let x = radius;
        let y = radius;
        let validPosition = false;

        for (let attempt = 0; attempt < 1000; attempt++) {
            x = radius + Math.random() *
                Math.max(0, canvasWidth - radius * 2);

            y = radius + Math.random() *
                Math.max(0, canvasHeight - radius * 2);

            validPosition = circles.every(circle => {
                return Math.hypot(
                    x - circle.posX,
                    y - circle.posY
                ) >= radius + circle.radius + 4;
            });

            if (validPosition) break;
        }

        const hue = (i * 137.5) % 360;
        const color = `hsl(${hue}, 100%, 60%)`;

        const speed = Math.random() * 4 + 1;

        circles.push(
            new Circle(
                x, y, radius,
                color, `C${i + 1}`, speed
            )
        );
    }

    circleCountElement.textContent = circles.length;
}

// Detectar colisiones
function checkCollisions() {
    const currentCollisions = new Set();

    circles.forEach(circle => {
        circle.isColliding = false;
    });

    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const circleA = circles[i];
            const circleB = circles[j];

            if (circleA.detectCollision(circleB)) {
                circleA.isColliding = true;
                circleB.isColliding = true;

                const pairId = `${i}-${j}`;
                currentCollisions.add(pairId);

                if (!activeCollisions.has(pairId)) {
                    collisionCount++;
                }

                circleA.resolveCollision(circleB);
            }
        }
    }

    activeCollisions = currentCollisions;
    collisionCountElement.textContent = collisionCount;
}

// Dibujar cuadrícula futurista
function drawGrid() {
    ctx.save();

    ctx.strokeStyle = "rgba(0, 245, 255, 0.055)";
    ctx.lineWidth = 1;

    const gridSize = 35;

    for (let x = 0; x < canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    for (let y = 0; y < canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }

    ctx.restore();
}

// Animación
function animate() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawGrid();

    if (!isPaused) {
        circles.forEach(circle => circle.update());
        checkCollisions();
    }

    circles.forEach(circle => circle.draw(ctx));

    requestAnimationFrame(animate);
}

// Pausar o reanudar
pauseBtn.addEventListener("click", () => {
    isPaused = !isPaused;

    pauseBtn.textContent = isPaused
        ? "▶ REANUDAR"
        : "⏸ PAUSAR";

    systemState.textContent = isPaused
        ? "PAUSED"
        : "ACTIVE";

    statusText.textContent = isPaused
        ? "SYSTEM PAUSED"
        : "SYSTEM ONLINE";
});

// Reiniciar simulación
resetBtn.addEventListener("click", () => {
    collisionCount = 0;
    activeCollisions.clear();

    collisionCountElement.textContent = 0;

    generateCircles(20);

    isPaused = false;
    pauseBtn.textContent = "⏸ PAUSAR";
    systemState.textContent = "ACTIVE";
    statusText.textContent = "SYSTEM ONLINE";
});

// Ajustar al cambiar tamaño de ventana
window.addEventListener("resize", resizeCanvas);

// Iniciar aplicación
resizeCanvas();
generateCircles(20);
animate();
