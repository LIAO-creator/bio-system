<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>核苷酸拼装游戏</title>
    <style>
        body { margin: 0; padding: 0; }
        canvas { display: block; background-color: #e6e6ff; }
    </style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const WIDTH = 1000, HEIGHT = 700;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const FPS = 30;
    const font = "40px Arial";

    const GREEN = "rgb(34, 177, 76)";
    const BLACK = "rgb(0, 0, 0)";
    const WHITE = "rgb(255, 255, 255)";

    // 图像加载
    const BASE_A = new Image();
    const BASE_T = new Image();
    const BASE_C = new Image();
    const BASE_G = new Image();
    const BASE_U = new Image();

    BASE_A.src = "base_A.png";
    BASE_T.src = "base_T.png";
    BASE_C.src = "base_C.png";
    BASE_G.src = "base_G.png";
    BASE_U.src = "base_U.png";

    const NUCLEOTIDES = {
        "A-T": [{ name: "A", img: BASE_A }, { name: "T", img: BASE_T }],
        "C-G": [{ name: "C", img: BASE_C }, { name: "G", img: BASE_G }],
        "A-U": [{ name: "A", img: BASE_A }, { name: "U", img: BASE_U }],
        "G-C": [{ name: "G", img: BASE_G }, { name: "C", img: BASE_C }]
    };

    let score = 0;
    let timeLeft = 60;
    let startTime = Date.now();
    let components = [];
    let assemblyRect = { x: WIDTH / 2 - 200, y: HEIGHT - 250, width: 400, height: 150 };
    let draggingComponent = null;

    const assemblyText = "拼装区域";
    let targetNucleotide = getNewTarget([]);
    let targetComponents = NUCLEOTIDES[targetNucleotide];
    let assembledComponents = []; // 存储已正确拼装的核苷酸
    let showSuccessMessage = false;
    let successMessageTime = 0;
    let showErrorMessage = false;
    let errorMessageTime = 0;
    let gameOver = false;  // 游戏是否结束

    function initComponents() {
        const x = (WIDTH - 5 * 120) / 2;
        components = [
            new DraggableComponent(BASE_A, x, 150, "A"),
            new DraggableComponent(BASE_T, x + 120, 150, "T"),
            new DraggableComponent(BASE_C, x + 240, 150, "C"),
            new DraggableComponent(BASE_G, x + 360, 150, "G"),
            new DraggableComponent(BASE_U, x + 480, 150, "U")
        ];
    }

    class DraggableComponent {
        constructor(img, x, y, name) {
            this.img = img;
            this.x = x;
            this.y = y;
            this.width = 100;
            this.height = 100;
            this.name = name;
            this.dragging = false;
            this.movable = true;
            this.initX = x;
            this.initY = y;
        }

        draw() {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }

        updatePosition(mouseX, mouseY) {
            if (this.dragging && this.movable) {
                this.x = mouseX - this.width / 2;
                this.y = mouseY - this.height / 2;
            }
        }

        startDrag() {
            if (this.movable) this.dragging = true;
        }

        stopDrag() {
            this.dragging = false;
        }

        resetPosition() {
            this.x = this.initX;
            this.y = this.initY;
        }

        lockPosition() {
            this.movable = false;
        }

        unlockPosition() {
            this.movable = true;
        }

        isInside(x, y) {
            return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
        }
    }

    function gameLoop() {
        setInterval(() => {
            if (!gameOver) {
                update();
            }
            draw();
        }, 1000 / FPS);
    }

    function update() {
        // 更新剩余时间
        timeLeft = 60 - Math.floor((Date.now() - startTime) / 1000);
        if (timeLeft <= 0) {
            endGame("时间到！游戏结束！");
        }
    }

    function draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // 绘制拼装区域
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.strokeRect(assemblyRect.x, assemblyRect.y, assemblyRect.width, assemblyRect.height);

        // 绘制目标核苷酸
        ctx.fillStyle = BLACK;
        ctx.font = font;
        ctx.fillText(`目标: ${targetNucleotide}`, WIDTH / 2 - ctx.measureText(`目标: ${targetNucleotide}`).width / 2, 50);

        // 显示时间
        ctx.fillText(`时间: ${timeLeft}秒`, 10, 40);

        // 显示分数
        ctx.fillText(`分数: ${score}`, WIDTH - 150, 40);

        // 绘制组件
        components.forEach(component => component.draw());

        // 显示拼装区域文字
        ctx.fillText(assemblyText, WIDTH / 2 - ctx.measureText(assemblyText).width / 2, HEIGHT-50);

        // 显示成功消息
        if (showSuccessMessage) {
            ctx.fillText("拼装成功！", WIDTH / 2 - ctx.measureText("拼装成功！").width / 2, HEIGHT / 2 + 120);
            if (Date.now() - successMessageTime > 1000) {
                showSuccessMessage = false;
                resetComponents();  // 拼装成功后重置所有组件的位置并恢复拖动
            }
        }

        // 显示错误消息
        if (showErrorMessage) {
            ctx.fillText("拼装错误！", WIDTH / 2 - ctx.measureText("拼装错误！").width / 2, HEIGHT / 2 + 120);
            if (Date.now() - errorMessageTime > 1000) {
                showErrorMessage = false;
                resetComponents();  // 拼装失败后重置所有组件的位置并恢复拖动
            }
        }

        // 游戏结束时不显示“重新开始”按钮
        if (gameOver) {
            ctx.fillText("游戏结束！", WIDTH / 2 - ctx.measureText("游戏结束！").width / 2, HEIGHT / 2);
        }
    }

    function resetComponents() {
        components.forEach(component => {
            if (!component.movable) {
                component.unlockPosition();
            }
            component.resetPosition();  // 在拼装成功或失败后重置位置
        });
    }

    function getNewTarget(excludeTargets) {
        const allTargets = Object.keys(NUCLEOTIDES);
        const availableTargets = allTargets.filter(target => !excludeTargets.includes(target));
        return availableTargets[Math.floor(Math.random() * availableTargets.length)];
    }

    function endGame(message) {
        gameOver = true;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = BLACK;
        ctx.font = font;
        ctx.fillText(message, WIDTH / 2 - ctx.measureText(message).width / 2, HEIGHT / 2);
    }

    function isInAssemblyArea(component) {
        return component.x >= assemblyRect.x && component.x + component.width <= assemblyRect.x + assemblyRect.width &&
            component.y >= assemblyRect.y && component.y + component.height <= assemblyRect.y + assemblyRect.height;
    }

    function checkAssembly(component, targetComponents) {
        return targetComponents.some(target => component.name === target.name);
    }

    canvas.addEventListener("mousedown", (e) => {
        if (gameOver) return; // 游戏结束时禁用其他功能
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        components.forEach(component => {
            if (component.isInside(mouseX, mouseY) && component.movable) {
                draggingComponent = component;
                component.startDrag();
            }
        });
    });

    canvas.addEventListener("mousemove", (e) => {
        if (draggingComponent) {
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            draggingComponent.updatePosition(mouseX, mouseY);
        }
    });

    canvas.addEventListener("mouseup", () => {
        if (draggingComponent) {
            draggingComponent.stopDrag();
            if (isInAssemblyArea(draggingComponent)) {
                if (checkAssembly(draggingComponent, targetComponents)) {
                    draggingComponent.lockPosition();
                    assembledComponents.push(draggingComponent);
                    if (assembledComponents.length === 2) {
                        score += 1;
                        assembledComponents = [];
                        targetNucleotide = getNewTarget([targetNucleotide]);
                        targetComponents = NUCLEOTIDES[targetNucleotide];
                        showSuccessMessage = true;
                        successMessageTime = Date.now();
                    }
                } else {
                    score -= 1;
                    showErrorMessage = true;
                    errorMessageTime = Date.now();
                    if (score < 0) {
                        endGame("你失败了！");
                    }
                }
            }
            draggingComponent = null;
        }
    });

    // 初始化游戏
    initComponents();
    gameLoop();
</script>
</body>
</html>
