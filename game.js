// 获取游戏画布
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏参数
let WIDTH = window.innerWidth * 0.9; // 自动调整画布宽度为浏览器宽度的90%
let HEIGHT = window.innerHeight * 0.6; // 设置画布高度为屏幕高度的60%
const FPS = 30;
let score = 0;
let timeLeft = 60; // 游戏倒计时
let startTime = Date.now();
const font = '40px Arial'; // 使用系统字体

// 颜色
const BACKGROUND_COLOR = 'rgb(230, 230, 255)';
const WHITE = 'rgb(255, 255, 255)';
const BLACK = 'rgb(0, 0, 0)';
const GREEN = 'rgb(34, 177, 76)';

// 初始化画布尺寸
canvas.width = WIDTH;
canvas.height = HEIGHT;

// 加载图片（假设你已准备好相应的图片）
const baseImages = {
    A: 'base_A.png',
    T: 'base_T.png',
    C: 'base_C.png',
    G: 'base_G.png',
    U: 'base_U.png'
};

let images = {};
let components = [];

// 核苷酸配对（目标核苷酸结构，包含碱基配对方式）
const NUCLEOTIDES = {
    'A-T': [['A', 'T']],
    'C-G': [['C', 'G']],
    'A-U': [['A', 'U']],
    'G-C': [['G', 'C']]
};

// 组件类
class DraggableComponent {
    constructor(image, x, y, name) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.name = name;
        this.width = 100;
        this.height = 100;
        this.dragging = false;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    startDrag() {
        this.dragging = true;
    }

    stopDrag() {
        this.dragging = false;
    }

    updatePosition(mouseX, mouseY) {
        if (this.dragging) {
            this.x = mouseX - this.width / 2;
            this.y = mouseY - this.height / 2;
        }
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }
}

// 加载图像
function loadImages() {
    const promises = [];
    for (let key in baseImages) {
        promises.push(new Promise((resolve) => {
            const img = new Image();
            img.src = baseImages[key];
            img.onload = () => {
                images[key] = img;
                resolve();
            };
        }));
    }
    return Promise.all(promises);
}

// 初始化组件
function initComponents() {
    let x = 50;
    let y = 150;
    components.push(new DraggableComponent(images.A, x, y, 'A'));
    components.push(new DraggableComponent(images.T, x + 120, y, 'T'));
    components.push(new DraggableComponent(images.C, x + 240, y, 'C'));
    components.push(new DraggableComponent(images.G, x + 360, y, 'G'));
    components.push(new DraggableComponent(images.U, x + 480, y, 'U'));
}

// 游戏循环
function gameLoop() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timeLeft = 60 - elapsedTime;

    if (timeLeft <= 0) {
        endGame('游戏结束!');
        return;
    }

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 绘制拼装区域
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH / 2 - 200, HEIGHT / 2 + 50, 400, 200);

    // 显示剩余时间
    ctx.fillStyle = BLACK;
    ctx.font = font;
    ctx.fillText(`时间: ${timeLeft}秒`, 10, 40);

    // 显示分数
    ctx.fillText(`分数: ${score}`, WIDTH - 150, 40);

    // 显示目标核苷酸
    const targetText = getNewTargetText();
    ctx.fillText(`目标: ${targetText}`, WIDTH / 2 - ctx.measureText(targetText).width / 2, 50);

    // 绘制组件
    components.forEach((component) => component.draw());

    requestAnimationFrame(gameLoop);
}

// 获取新的目标核苷酸
function getNewTargetText() {
    const allTargets = Object.keys(NUCLEOTIDES);
    const randomTarget = allTargets[Math.floor(Math.random() * allTargets.length)];
    return randomTarget;
}

// 判断拼装是否正确
function checkAssembly(component, targetComponents) {
    for (let target of targetComponents) {
        if (component.name === target[0]) {
            return true;
        }
    }
    return false;
}

// 结束游戏处理
function endGame(message) {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = BLACK;
    ctx.font = '50px Arial';
    ctx.fillText(message, WIDTH / 2 - ctx.measureText(message).width / 2, HEIGHT / 2);
}

// 处理鼠标事件
let isMouseDown = false;
let draggedComponent = null;

canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    components.forEach((component) => {
        if (component.contains(mouseX, mouseY)) {
            draggedComponent = component;
            component.startDrag();
        }
    });
});

canvas.addEventListener('mousemove', (event) => {
    if (draggedComponent && isMouseDown) {
        draggedComponent.updatePosition(event.offsetX, event.offsetY);
    }
});

canvas.addEventListener('mouseup', () =>
