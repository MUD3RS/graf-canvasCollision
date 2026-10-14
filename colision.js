
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Dimensiones del Canvas
const window_height = window.innerHeight;
const window_width = window.innerWidth;

canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#ff8";

// Clase Circle
class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;

        this.color = color;
        this.originalColor = color;
        this.text = text;
        this.speed = speed;

        this.dx = this.speed;
        this.dy = this.speed;

        this.isColliding = false;
    }

    // Dibujar el círculo
    draw(context) {
        context.beginPath();

        context.strokeStyle = this.isColliding
            ? "#0000FF"
            : this.originalColor;

        context.lineWidth = 2;

        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2
        );

        context.stroke();
        context.closePath();

        // Dibujar etiqueta
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "16px Arial";

        context.fillText(
            this.text,
            this.posX,
            this.posY
        );
    }

    // Actualizar movimiento
    update() {
        this.posX += this.dx;
        this.posY += this.dy;

        // Rebote en los bordes horizontales
        if (
            this.posX + this.radius >= window_width ||
            this.posX - this.radius <= 0
        ) {
            this.dx = -this.dx;
            this.posX = Math.max(
                this.radius,
                Math.min(
                    window_width - this.radius,
                    this.posX
                )
            );
        }

        // Rebote en los bordes verticales
        if (
            this.posY + this.radius >= window_height ||
            this.posY - this.radius <= 0
        ) {
            this.dy = -this.dy;
            this.posY = Math.max(
                this.radius,
                Math.min(
                    window_height - this.radius,
                    this.posY
                )
            );
        }
    }

    // Detectar colisión con otro círculo
    detectCollision(otherCircle) {
        const distanceX = this.posX - otherCircle.posX;
        const distanceY = this.posY - otherCircle.posY;

        const distance = Math.sqrt(
            distanceX ** 2 + distanceY ** 2
        );

        const sumRadius =
            this.radius + otherCircle.radius;

        return distance <= sumRadius;
    }
}

// Arreglo para almacenar los círculos
let circles = [];

// Generar círculos aleatorios
function generateCircles(n) {
    for (let i = 0; i < n; i++) {
        let radius = Math.random() * 30 + 20;

        let x = Math.random() *
            (window_width - radius * 2) + radius;

        let y = Math.random() *
            (window_height - radius * 2) + radius;

        let color = "#" + Math.floor(
            Math.random() * 16777215
        ).toString(16).padStart(6, "0");

        // Velocidad entre 1 y 5
        let speed = Math.random() * 4 + 1;

        let text = `C${i + 1}`;

        circles.push(
            new Circle(
                x, y, radius,
                color, text, speed
            )
        );
    }
}

// Revisar colisiones entre todos los círculos
function checkCollisions() {

    // Reiniciar estado de colisión
    circles.forEach(circle => {
        circle.isColliding = false;
    });

    // Comparar cada pareja de círculos
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {

            const circleA = circles[i];
            const circleB = circles[j];

            if (circleA.detectCollision(circleB)) {
                circleA.isColliding = true;
                circleB.isColliding = true;
            }
        }
    }
}

// Animación principal
function animate() {
    ctx.clearRect(
        0, 0,
        window_width,
        window_height
    );

    // Actualizar posiciones
    circles.forEach(circle => {
        circle.update();
    });

    // Detectar colisiones
    checkCollisions();

    // Dibujar círculos
    circles.forEach(circle => {
        circle.draw(ctx);
    });

    requestAnimationFrame(animate);
}

// Generar 20 círculos
generateCircles(20);

// Iniciar animación
animate();
