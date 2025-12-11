const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverElement = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop;

highScoreElement.textContent = highScore;

function drawGame() {
    clearCanvas();
    moveSnake();

    if (checkCollision()) {
        endGame();
        return;
    }

    if (checkFoodCollision()) {
        score++;
        scoreElement.textContent = score;
        generateFood();

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
    } else {
        snake.pop();
    }

    drawFood();
    drawSnake();
}

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#4ade80';
        } else {
            ctx.fillStyle = '#22c55e';
        }

        ctx.fillRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize - 2,
            gridSize - 2
        );

        ctx.strokeStyle = '#16a34a';
        ctx.strokeRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize - 2,
            gridSize - 2
        );
    });
}

function drawFood() {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
}

function checkCollision() {
    const head = snake[0];

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function checkFoodCollision() {
    return snake[0].x === food.x && snake[0].y === food.y;
}

function generateFood() {
    let newFood;
    let validPosition = false;

    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };

        validPosition = !snake.some(segment =>
            segment.x === newFood.x && segment.y === newFood.y
        );
    }

    food = newFood;
}

function changeDirection(event) {
    const key = event.key.toLowerCase();
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if ((key === 'arrowup' || key === 'w') && !goingDown) {
        dx = 0;
        dy = -1;
        if (!gameRunning) startGame();
    }

    if ((key === 'arrowdown' || key === 's') && !goingUp) {
        dx = 0;
        dy = 1;
        if (!gameRunning) startGame();
    }

    if ((key === 'arrowleft' || key === 'a') && !goingRight) {
        dx = -1;
        dy = 0;
        if (!gameRunning) startGame();
    }

    if ((key === 'arrowright' || key === 'd') && !goingLeft) {
        dx = 1;
        dy = 0;
        if (!gameRunning) startGame();
    }
}

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    gameLoop = setInterval(drawGame, 100);
}

function endGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
    clearCanvas();
    drawFood();
    drawSnake();
}

document.addEventListener('keydown', changeDirection);
restartBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

drawFood();
drawSnake();
