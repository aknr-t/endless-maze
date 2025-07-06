const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズをウィンドウに合わせる
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ゲーム設定
const TILE_SIZE = 40; // 迷路の1マスのサイズ
const PLAYER_SIZE = TILE_SIZE * 0.6; // プレイヤーのサイズ
const MONSTER_SIZE = TILE_SIZE * 0.7; // モンスターのサイズ
const WALL_COLOR = 'yellow';
const PATH_COLOR = '#000';
const PLAYER_COLOR = 'blue';
const MONSTER_COLOR = 'red';

// ゲームの状態
let gameRunning = false;
let maze = [];
let player = { x: 0, y: 0, hp: 100 };
let monster = { x: 0, y: 0, active: false };

// 迷路生成 (シンプルなランダムウォーク)
function generateMaze() {
    const cols = Math.floor(canvas.width / TILE_SIZE);
    const rows = Math.floor(canvas.height / TILE_SIZE);
    maze = Array(rows).fill(0).map(() => Array(cols).fill(1)); // 1: 壁, 0: 道

    // プレイヤーの初期位置
    player.x = Math.floor(cols / 2);
    player.y = Math.floor(rows / 2);
    maze[player.y][player.x] = 0; // プレイヤーの初期位置は道

    // ランダムウォークで道を生成
    let currentX = player.x;
    let currentY = player.y;
    for (let i = 0; i < 500; i++) { // 適当な回数道を掘る
        const direction = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
        let nextX = currentX;
        let nextY = currentY;

        if (direction === 0) nextY--;
        else if (direction === 1) nextX++;
        else if (direction === 2) nextY++;
        else if (direction === 3) nextX--;

        if (nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows) {
            currentX = nextX;
            currentY = nextY;
            maze[currentY][currentX] = 0;
        }
    }
}

// 描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 迷路の描画
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = WALL_COLOR;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // プレイヤーの描画
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(player.x * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2,
                 player.y * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2,
                 PLAYER_SIZE, PLAYER_SIZE);

    // モンスターの描画
    if (monster.active) {
        ctx.fillStyle = MONSTER_COLOR;
        ctx.fillRect(monster.x * TILE_SIZE + (TILE_SIZE - MONSTER_SIZE) / 2,
                     monster.y * TILE_SIZE + (TILE_SIZE - MONSTER_SIZE) / 2,
                     MONSTER_SIZE, MONSTER_SIZE);
    }

    // HP表示
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('HP: ' + player.hp, 10, 25);
}

// プレイヤー移動
function movePlayer(dx, dy) {
    if (!gameRunning) return; // ゲームオーバー中は移動させない

    const newX = player.x + dx;
    const newY = player.y + dy;

    const cols = Math.floor(canvas.width / TILE_SIZE);
    const rows = Math.floor(canvas.height / TILE_SIZE);

    if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;
    }
}

// モンスターの行動
function moveMonster() {
    if (!gameRunning || !monster.active) return; // ゲームオーバー中は移動させない

    // プレイヤーを追跡 (簡易版)
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;

    let nextX = monster.x;
    let nextY = monster.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        nextX += (dx > 0 ? 1 : -1);
    } else {
        nextY += (dy > 0 ? 1 : -1);
    }

    const cols = Math.floor(canvas.width / TILE_SIZE);
    const rows = Math.floor(canvas.height / TILE_SIZE);

    if (nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows && maze[nextY][nextX] === 0) {
        monster.x = nextX;
        monster.y = nextY;
    } else { // 壁にぶつかったらランダムに動く
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        nextX = monster.x + randomDir[0];
        nextY = monster.y + randomDir[1];
        if (nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows && maze[nextY][nextX] === 0) {
            monster.x = nextX;
            monster.y = nextY;
        }
    }

    // 衝突判定
    if (player.x === monster.x && player.y === monster.y) {
        player.hp -= 10; // ダメージ
        if (player.hp <= 0) {
            gameRunning = false; // ゲームオーバー
            drawGameOver();
        }
        // モンスターを非アクティブにするか、別の場所に移動させる
        monster.active = false;
    }
}

// モンスター出現
function spawnMonster() {
    if (!gameRunning) return; // ゲームオーバー中は出現させない
    if (Math.random() < 0.05 && !monster.active) { // 5%の確率で出現 (確率を少し下げた)
        const cols = Math.floor(canvas.width / TILE_SIZE);
        const rows = Math.floor(canvas.height / TILE_SIZE);
        let spawnX, spawnY;
        do {
            spawnX = Math.floor(Math.random() * cols);
            spawnY = Math.floor(Math.random() * rows);
        } while (maze[spawnY][spawnX] === 1 || (spawnX === player.x && spawnY === player.y)); // 壁やプレイヤーの位置には出現しない
        monster.x = spawnX;
        monster.y = spawnY;
        monster.active = true;
    }
}

// ゲームオーバー表示
function drawGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 20);
}

// ゲームループ
let lastMonsterMoveTime = 0;
const monsterMoveInterval = 300; // モンスターの移動間隔 (ms)

function gameLoop(currentTime) {
    if (!gameRunning) {
        draw(); // ゲームオーバー画面を表示するために描画は続ける
        return;
    }

    draw();

    if (currentTime - lastMonsterMoveTime > monsterMoveInterval) {
        moveMonster();
        spawnMonster();
        lastMonsterMoveTime = currentTime;
    }

    requestAnimationFrame(gameLoop);
}

// キーボードイベント
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (!gameRunning) {
            initGame(); // ゲームオーバー中にスペースキーで再開
        }
    }

    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
            movePlayer(1, 0);
            break;
    }
});

// ゲーム初期化
function initGame() {
    gameRunning = true;
    generateMaze();
    player.hp = 100;
    monster.active = false;
    // プレイヤーとモンスターの位置をリセット
    const cols = Math.floor(canvas.width / TILE_SIZE);
    const rows = Math.floor(canvas.height / TILE_SIZE);
    player.x = Math.floor(cols / 2);
    player.y = Math.floor(rows / 2);
    monster.x = 0; // 初期位置は適当に
    monster.y = 0;

    requestAnimationFrame(gameLoop); // ゲームループを開始
}

// ゲーム開始時の表示
function drawStartScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('迷路ゲーム', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2 + 20);
}

// 初期画面表示
drawStartScreen();

// ゲーム開始待機状態
document.addEventListener('keydown', function onFirstSpace(event) {
    if (event.code === 'Space') {
        document.removeEventListener('keydown', onFirstSpace);
        initGame();
    }
});