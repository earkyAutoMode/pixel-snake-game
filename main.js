/**
 * 像素复古贪吃蛇 (Pixel Snake)
 * 经典 8-bit 风格实现
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('current-score');
const highScoreDisplay = document.getElementById('high-score');
const finalScoreDisplay = document.getElementById('final-score');

// 游戏配置
const GRID_SIZE = 20; // 每个格子的像素
let canvasWidth, canvasHeight;
let tileCountX, tileCountY;

// 游戏状态
let score = 0;
let highScore = parseInt(localStorage.getItem('pixelSnakeHighScore')) || 0;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0; // x轴方向增量
let dy = 0; // y轴方向增量
let nextDx = 0;
let nextDy = 0;
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 150; // 毫秒
let lastTime = 0;

// UI 元素
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');

/**
 * 初始化画布大小
 */
function initCanvas() {
    // 动态调整画布以适配屏幕，保持正方形或 4:3 比例
    const containerSize = Math.min(window.innerWidth - 40, 400);
    canvasWidth = containerSize;
    canvasHeight = containerSize;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    tileCountX = Math.floor(canvasWidth / GRID_SIZE);
    tileCountY = Math.floor(canvasHeight / GRID_SIZE);
}

/**
 * 游戏初始化/重置
 */
function resetGame() {
    score = 0;
    gameSpeed = 150;
    scoreDisplay.textContent = '0000';
    highScoreDisplay.textContent = String(highScore).padStart(4, '0');
    
    // 初始位置在中央
    const startX = Math.floor(tileCountX / 2);
    const startY = Math.floor(tileCountY / 2);
    
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    
    // 初始移动方向
    dx = 1;
    dy = 0;
    nextDx = 1;
    nextDy = 0;
    
    createFood();
}

/**
 * 创建随机食物
 */
function createFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        // 检查食物是否在蛇身上
        let onSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y);
        if (!onSnake) break;
    }
    food = newFood;
}

/**
 * 游戏循环
 */
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    if (timestamp - lastTime >= gameSpeed) {
        if (!gamePaused) {
            update();
            draw();
        }
        lastTime = timestamp;
    }
    
    requestAnimationFrame(gameLoop);
}

/**
 * 逻辑更新
 */
function update() {
    // 应用排队的方向输入，防止快速按键导致的“自杀”
    dx = nextDx;
    dy = nextDy;

    // 计算蛇头新位置
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 碰撞检测：墙壁
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        endGame();
        return;
    }

    // 碰撞检测：自己
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
            return;
        }
    }

    // 将新头部推入数组
    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        createFood();
        // 随分数增加速度
        if (gameSpeed > 70) gameSpeed -= 1;
    } else {
        // 没吃到食物，移除尾部
        snake.pop();
    }
}

/**
 * 绘图
 */
function draw() {
    // 清空画布
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制格子线（可选，增强像素感）
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<=canvas.width; i+=GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let j=0; j<=canvas.height; j+=GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // 绘制食物
    ctx.fillStyle = '#FF00FF'; // 复古品红
    ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    // 食物光晕
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF00FF';
    ctx.strokeRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    ctx.shadowBlur = 0;

    // 绘制蛇
    snake.forEach((part, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#00FF00' : '#00CC00';
        
        // 稍微缩进一点点，制造间隙感
        const padding = 1;
        ctx.fillRect(
            part.x * GRID_SIZE + padding, 
            part.y * GRID_SIZE + padding, 
            GRID_SIZE - padding * 2, 
            GRID_SIZE - padding * 2
        );

        if (isHead) {
            // 给头加个小眼睛
            ctx.fillStyle = '#000';
            const eyeSize = 2;
            if (dx === 1) { // 向右
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 4, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
            } else if (dx === -1) { // 向左
                ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 4, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
            } else if (dy === -1) { // 向上
                ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 4, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 4, eyeSize, eyeSize);
            } else if (dy === 1) { // 向下
                ctx.fillRect(part.x * GRID_SIZE + 4, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
                ctx.fillRect(part.x * GRID_SIZE + 14, part.y * GRID_SIZE + 14, eyeSize, eyeSize);
            }
        }
    });
}

function updateScore() {
    scoreDisplay.textContent = String(score).padStart(4, '0');
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = String(highScore).padStart(4, '0');
        localStorage.setItem('pixelSnakeHighScore', highScore);
    }
}

function endGame() {
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
    }
}

// 按钮事件
document.getElementById('start-btn').onclick = () => {
    startScreen.classList.add('hidden');
    gameRunning = true;
    resetGame();
    requestAnimationFrame(gameLoop);
};

document.getElementById('restart-btn').onclick = () => {
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
    resetGame();
};

document.getElementById('resume-btn').onclick = () => {
    togglePause();
};

// 输入处理
function handleInput(key) {
    if (gamePaused && key !== ' ') return;

    switch(key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
        case ' ':
            togglePause();
            break;
    }
}

window.addEventListener('keydown', (e) => {
    handleInput(e.key);
});

// 移动端控制
document.querySelectorAll('.ctrl-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dir = btn.getAttribute('data-dir');
        const keyMap = { 'up': 'ArrowUp', 'down': 'ArrowDown', 'left': 'ArrowLeft', 'right': 'ArrowRight' };
        handleInput(keyMap[dir]);
    });
});

// 初始化
initCanvas();
window.addEventListener('resize', initCanvas);
highScoreDisplay.textContent = String(highScore).padStart(4, '0');
