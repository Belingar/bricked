// --- Global variables ---
var canvas;
var ctx;
var x = 150;
var y = 150;
var dx = 2;
var dy = 4;
var r = 10; 
var WIDTH = 800;
var HEIGHT = 600;

// Paddle and input
var paddlex;
var paddleh = 10;
var paddlew = 75;
var rightDown = false;
var leftDown = false;
var intervalId;

// Bricks
var bricks;
var NROWS = 5;
var NCOLS = 5;
var BRICKWIDTH;
var BRICKHEIGHT = 15;
var PADDING = 1;

// Colors
var rowcolors = ["#FF1C0A", "#FFFD0A", "#00A308", "#0008DB", "#EB0093"];
var paddlecolor = "#000000";
var ballcolor = "#333333";

// Game State (Timer and Score)
var tocke = 0;
var sekunde = 0;
var start = true;
var timerId;

// --- Initialization ---
function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    paddlex = WIDTH / 2;
    initbricks();
    
    // Reset score and UI
    tocke = 0;
    sekunde = 0;
    document.getElementById("tocke").innerHTML = tocke;
    document.getElementById("cas").innerHTML = "00:00";

    // Start loops
    intervalId = setInterval(draw, 10);
    timerId = setInterval(updateTimer, 1000); // Run timer every 1 second
    
    // Controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function initbricks() {
    BRICKWIDTH = (WIDTH / NCOLS) - 1;
    bricks = new Array(NROWS);
    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = 1;
        }
    }
}

// --- Controls ---
function onKeyDown(evt) {
    if (evt.keyCode == 39) rightDown = true;
    else if (evt.keyCode == 37) leftDown = true;
}

function onKeyUp(evt) {
    if (evt.keyCode == 39) rightDown = false;
    else if (evt.keyCode == 37) leftDown = false;
}

// --- Timer Logic ---
function updateTimer() {
    if (start == true) {
        sekunde++;
        var sekundeI = sekunde % 60;
        var minuteI = Math.floor(sekunde / 60);
        
        sekundeI = (sekundeI > 9) ? sekundeI : "0" + sekundeI;
        minuteI = (minuteI > 9) ? minuteI : "0" + minuteI;
        
        document.getElementById("cas").innerHTML = minuteI + ":" + sekundeI;
    }
}

// --- Main Loop ---
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 1. Paddle movement with bounds checking
    if (rightDown) {
        if ((paddlex + paddlew) < WIDTH) paddlex += 5;
        else paddlex = WIDTH - paddlew;
    } else if (leftDown) {
        if (paddlex > 0) paddlex -= 5;
        else paddlex = 0;
    }

    // 2. Draw ball
    ctx.fillStyle = ballcolor; 
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.fill();

    // 3. Draw paddle
    ctx.fillStyle = paddlecolor;
    ctx.fillRect(paddlex, HEIGHT - paddleh, paddlew, paddleh);

    // 4. Draw bricks
    for (var i = 0; i < NROWS; i++) {
        ctx.fillStyle = rowcolors[i];
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] == 1) {
                ctx.fillRect(
                    (j * (BRICKWIDTH + PADDING)) + PADDING,
                    (i * (BRICKHEIGHT + PADDING)) + PADDING,
                    BRICKWIDTH, BRICKHEIGHT
                );
            }
        }
    }

    // 5. Brick Collision Logic
    var rowheight = BRICKHEIGHT + PADDING;
    var colwidth = BRICKWIDTH + PADDING;
    var row = Math.floor(y / rowheight);
    var col = Math.floor(x / colwidth);

    if (y < NROWS * rowheight && row >= 0 && col >= 0 && bricks[row][col] == 1) {
        dy = -dy; 
        bricks[row][col] = 0; // Break brick
        tocke += 1; // Add score
        document.getElementById("tocke").innerHTML = tocke;
    }

    // 6. Wall & Paddle Collision Logic
    if (x + dx > WIDTH - r || x + dx < r) {
        dx = -dx;
    }
    
    if (y + dy < r) {
        dy = -dy;
    } else if (y + dy > HEIGHT - r) {
        start = false; // Pause timer
        
        if (x > paddlex && x < paddlex + paddlew) {
            // Dynamic bounce angle based on where it hit the paddle
            dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);
            dy = -dy;
            start = true; // Resume timer
        } else {
            clearInterval(intervalId); // Game over
            clearInterval(timerId);
        }
    }

    x += dx;
    y += dy;
}

window.onload = init;