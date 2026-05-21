// --- Global variables ---
var canvas;
var ctx;
var currentMode = "easy";

var WIDTH = 800;
var HEIGHT = 600;


var records = {
    easy: { score: 0, time: Infinity },
    medium: { score: 0, time: Infinity },
    hard: { score: 0, time: Infinity }
};
var difficultySettings = {
    easy: { bulletSpeed: 8, fallingSpeed: 3, paddlew: 100, rows: 3, cols: 5, ballColor: "#ffff00" },
    medium: { bulletSpeed: 10, fallingSpeed: 5, paddlew: 75, rows: 5, cols: 5, ballColor: "#ffff00" },
    hard: { bulletSpeed: 12, fallingSpeed: 7, paddlew: 50, rows: 6, cols: 8, ballColor: "#808080" }
};
var currentBallColor;

// Image Loading
var background = new Image();
background.src = "img/back.jpg";

// Cannon and input
var paddlex;
var paddleh = 10;
var rightDown = false;
var leftDown = false;
var intervalId;
var fallingSpeed, paddlew, NROWS, NCOLS, bulletSpeed;

// Game Arrays (Bullets and Wreckage)
var bullets = [];
var fallingTanks = [];
var lastShotTime = 0; 

// Bricks (Enemy Tanks)
var bricks;
var BRICKWIDTH;
var BRICKHEIGHT = 32;
var PADDING = 15; 

var tocke = 0;
var sekunde = 0;
var start = true;
var timerId;

function startGame(mode) {
    currentMode = mode;
    loadRecords();
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('game-interface').style.display = 'flex';
    document.getElementById('game-controls').style.display = 'flex';
    document.getElementById('current-difficulty').innerHTML = mode.toUpperCase();

    var settings = difficultySettings[mode];
    bulletSpeed = settings.bulletSpeed;
    fallingSpeed = settings.fallingSpeed;
    paddlew = settings.paddlew;
    NROWS = settings.rows;
    NCOLS = settings.cols;
    currentBallColor = settings.ballColor;

    clearInterval(intervalId);
    clearInterval(timerId);
    init();
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    paddlex = (WIDTH / 2) - (paddlew / 2);
    bullets = [];
    fallingTanks = [];

    start = true;
    initbricks();
    updateTanksRemaining();

    tocke = 0;
    sekunde = 0;
    document.getElementById("tocke").innerHTML = tocke;
    document.getElementById("cas").innerHTML = "00:00";

    intervalId = setInterval(draw, 10);
    timerId = setInterval(updateTimer, 1000);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function initbricks() {
    BRICKWIDTH = (WIDTH - (PADDING * (NCOLS + 1))) / NCOLS; 
    bricks = new Array(NROWS);
    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = 2; 
        }
    }
}

function restartGame() {
    clearInterval(intervalId);
    clearInterval(timerId);
    startGame(currentMode);
}

function backToMenu() {
    start = false;
    clearInterval(intervalId);
    clearInterval(timerId);
    document.getElementById('game-interface').style.display = 'none';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'flex';
}

function drawEnemyTank(ctx, x, y, width, height, health) {
    const isHealthy = health === 2;
    const bodyColor = isHealthy ? "#d4c89a" : "#137000";  // sandy brown (full HP) / dark green (damaged)
    const trackColor = "#1a1a0a";
    const turretColor = "#1a1a0a";
    
    ctx.save();
    ctx.translate(x, y);
    
    // Disable anti-aliasing for crisp pixel look
    ctx.imageSmoothingEnabled = false;
    
    const pixel = Math.max(2, Math.floor(width / 16)); // Base pixel size
    
    // --- TRACKS (Left & Right) ---
    ctx.fillStyle = trackColor;
    ctx.fillRect(0, pixel * 2, pixel * 3, height - pixel * 4);           // Left track
    ctx.fillRect(width - pixel * 3, pixel * 2, pixel * 3, height - pixel * 4); // Right track
    
    // Track details (little squares)
    ctx.fillStyle = "#333333";
    for (let i = pixel * 3; i < height - pixel * 4; i += pixel * 2) {
        ctx.fillRect(pixel, i, pixel, pixel);
        ctx.fillRect(width - pixel * 2, i, pixel, pixel);
    }
    
    // Hull (main body — one flat color only)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(pixel * 3, pixel * 3, width - pixel * 6, height - pixel * 6);
    
    // --- TURRET ---
    ctx.fillStyle = turretColor;
    const turretSize = pixel * 4;
    const turretX = (width - turretSize) / 2;
    const turretY = (height - turretSize) / 2;
    ctx.fillRect(turretX, turretY, turretSize, turretSize);
    
    // --- BARREL ---
    ctx.fillStyle = turretColor;
    const barrelW = pixel * 2;
    const barrelH = pixel * 5;
    ctx.fillRect((width - barrelW) / 2, height - pixel * 2, barrelW, barrelH);
    
    // --- DAMAGE EFFECTS ---
    if (health === 1) {
        // Smoke pixels in sandy brown to indicate damage
        ctx.fillStyle = "#d4c89a";
        ctx.fillRect(width - pixel * 5, pixel, pixel * 2, pixel * 2);
        ctx.fillRect(width - pixel * 4, pixel * 2, pixel * 2, pixel * 2);
        ctx.fillRect(width - pixel * 3, 0, pixel * 2, pixel);
        ctx.fillRect(width - pixel * 2, -pixel, pixel * 2, pixel);
    }
    
    ctx.restore();
}

function updateTanksRemaining() {
    var count = 0;
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] > 0) count++;
        }
    }
    document.getElementById("tanks-left").innerHTML = count;
    return count;
}

function draw() {
    if (!start) return;

    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    if (rightDown && (paddlex + paddlew) < WIDTH) paddlex += 5;
    else if (leftDown && paddlex > 0) paddlex -= 5;

    var cx = paddlex + paddlew / 2;
    var baseY = HEIGHT - paddleh;
    ctx.fillStyle = '#d4c89a'; // sandy brown base — matches light text color
    ctx.fillRect(paddlex, baseY, paddlew, paddleh);
    ctx.fillStyle = '#137000'; // dark green dome — matches h3 header color
    ctx.beginPath();
    ctx.arc(cx, baseY - 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#137000'; // dark green barrel — matches h3 header color
    ctx.fillRect(cx - 5, baseY - 30, 10, 30);

    var tanksAlive = 0;
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] > 0) {
                tanksAlive++;
                var brickX = (j * (BRICKWIDTH + PADDING)) + PADDING;
                var brickY = (i * (BRICKHEIGHT + PADDING)) + PADDING;
                drawEnemyTank(ctx, brickX, brickY, BRICKWIDTH, BRICKHEIGHT, bricks[i][j]);
            }
        }
    }

    for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i];
        b.y -= bulletSpeed;
        ctx.beginPath();
        ctx.fillStyle = currentBallColor;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, true);
        ctx.fill();

        if (b.y < 0) {
            bullets.splice(i, 1);
            continue;
        }

        var rowheight = BRICKHEIGHT + PADDING;
        var colwidth = BRICKWIDTH + PADDING;
        var row = Math.floor(b.y / rowheight);
        var col = Math.floor(b.x / colwidth);

        if (row >= 0 && col >= 0 && row < NROWS && col < NCOLS && bricks[row][col] > 0) {
            var bx = col * colwidth + PADDING;
            var by = row * rowheight + PADDING;
            
            if (b.x > bx && b.x < bx + BRICKWIDTH && b.y > by && b.y < by + BRICKHEIGHT) {
                bricks[row][col] -= 1;
                tocke += 1;
                document.getElementById("tocke").innerHTML = tocke;

                if (bricks[row][col] === 0) {
                    fallingTanks.push({
                        x: bx,
                        y: by,
                        width: BRICKWIDTH,
                        height: BRICKHEIGHT
                    });
                    updateTanksRemaining();
                }
                bullets.splice(i, 1);
            }
        }
    }

    for (var i = fallingTanks.length - 1; i >= 0; i--) {
        var ft = fallingTanks[i];
        ft.y += fallingSpeed;
        drawEnemyTank(ctx, ft.x, ft.y, ft.width, ft.height, 1);

        var cannonTopY = HEIGHT - 40;
        if (ft.y + ft.height > cannonTopY && ft.y < HEIGHT &&
            ft.x + ft.width > paddlex && ft.x < paddlex + paddlew) {
            start = false;
            clearInterval(intervalId);
            clearInterval(timerId);
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = "white";
            ctx.font = "bold 45px Rajdhani";
            ctx.textAlign = "center";
            ctx.fillText("CRUSHED BY WRECKAGE!", WIDTH / 2, HEIGHT / 2);
            return;
        }
        if (ft.y > HEIGHT) fallingTanks.splice(i, 1);
    }

    if (tanksAlive === 0 && fallingTanks.length === 0) {
        start = false;
        clearInterval(intervalId);
        clearInterval(timerId);
        saveRecords();
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Rajdhani";
        ctx.textAlign = "center";
        ctx.fillText("BATTLE WON!", WIDTH / 2, HEIGHT / 2);
    }
}

function onKeyDown(evt) {
    if (evt.keyCode == 39) rightDown = true;
    else if (evt.keyCode == 37) leftDown = true;
    else if (evt.keyCode == 32) shoot();
}

function onKeyUp(evt) {
    if (evt.keyCode == 39) rightDown = false;
    else if (evt.keyCode == 37) leftDown = false;
}

function shoot() {
    if (!start) return;
    var now = Date.now();
    if (now - lastShotTime < 250) return;
    lastShotTime = now;
    bullets.push({ x: paddlex + paddlew / 2, y: HEIGHT - 44, r: 5 });
}

function updateTimer() {
    if (start) {
        sekunde++;
        var s = (sekunde % 60).toString().padStart(2, '0');
        var m = Math.floor(sekunde / 60).toString().padStart(2, '0');
        document.getElementById("cas").innerHTML = m + ":" + s;
    }
}

function loadRecords() {
    var saved = localStorage.getItem('battleFieldRecords');
    if (saved) {
        records = JSON.parse(saved);
    }
    updateRecordUI();
}

function updateRecordUI() {
    document.getElementById('record-mode').innerHTML = currentMode.toUpperCase();
    document.getElementById('hi-score').innerHTML = records[currentMode].score;
    
    var bestTime = records[currentMode].time;
    if (bestTime === Infinity) {
        document.getElementById('best-time').innerHTML = "--:--";
    } else {
        var s = (bestTime % 60).toString().padStart(2, '0');
        var m = Math.floor(bestTime / 60).toString().padStart(2, '0');
        document.getElementById('best-time').innerHTML = m + ":" + s;
    }
}

function saveRecords() {
    var isNewRecord = false;
    
    // Check if current score beats the high score
    if (tocke > records[currentMode].score) {
        records[currentMode].score = tocke;
        isNewRecord = true;
    }
    
    // Check if current time is faster than the best time
    if (sekunde < records[currentMode].time) {
        records[currentMode].time = sekunde;
        isNewRecord = true;
    }
    
    // If a record was broken, save to local storage and update the UI
    if (isNewRecord) {
        localStorage.setItem('battleFieldRecords', JSON.stringify(records));
        updateRecordUI();
    }
}