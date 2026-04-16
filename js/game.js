// --- Global variables ---
var canvas;
var ctx;
var currentMode = "easy";
// Ball variables
var x;
var y;
var r = 10;
var WIDTH = 800;
var HEIGHT = 600;

var difficultySettings = {
    easy: { dx: 2, dy: 4, paddlew: 100, rows: 3, cols: 5, ballColor: "#ffff00" },   // Yellow
    medium: { dx: 4, dy: 6, paddlew: 75, rows: 5, cols: 5, ballColor: "#ffff00" }, // Yellow
    hard: { dx: 4, dy: 6, paddlew: 50, rows: 6, cols: 8, ballColor: "#808080" }    // Gray
};
var currentBallColor;
// Image Loading
var tankImgA = new Image();
tankImgA.src = 'img/green.png';
var tankImgB = new Image();
tankImgB.src = 'img/reed.png';
var background = new Image();
background.src = "img/back.jpg";
var paddleImg = new Image();
paddleImg.src = 'img/paddle.png';

// Paddle and input
var paddlex; 
var paddleh = 10;
var rightDown = false;
var leftDown = false;
var intervalId;
var dx, dy, paddlew, NROWS, NCOLS;

// Bricks
var bricks;
var BRICKWIDTH;
var BRICKHEIGHT = 32;
var PADDING = 1;

var paddlecolor = "#000000";

var tocke = 0;
var sekunde = 0;
var start = true;
var timerId;

function startGame(mode) {

    currentMode = mode;

    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('game-interface').style.display = 'flex';
    document.getElementById('game-controls').style.display = 'flex'; 
    document.getElementById('current-difficulty').innerHTML = mode.toUpperCase();
    
    var settings = difficultySettings[mode];
    dx = settings.dx;
    dy = settings.dy;
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

    // Reset ball and paddle to the center
    x = WIDTH / 2;
    y = HEIGHT / 2;
    paddlex = (WIDTH / 2) - (paddlew / 2);

    start = true;
    initbricks();
    updateTanksRemaining();

    // Reset scores and timer
    tocke = 0;
    sekunde = 0;
    document.getElementById("tocke").innerHTML = tocke;
    document.getElementById("cas").innerHTML = "00:00";

    intervalId = setInterval(draw, 10);
    timerId = setInterval(updateTimer, 1000);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function initbricks() {
    BRICKWIDTH = (WIDTH / NCOLS) - 1;
    bricks = new Array(NROWS);
    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = 2; // Keep the 2-hit system
        }
    }
}

function restartGame() {
    clearInterval(intervalId);
    clearInterval(timerId);
    startGame(currentMode); // Restart using the saved mode
}

function backToMenu() {
    start = false;
    clearInterval(intervalId);
    clearInterval(timerId);
    
    // Hide game + controls, show the main menu
    document.getElementById('game-interface').style.display = 'none';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'flex';
}

function updateTanksRemaining() {
    var count = 0;
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] > 0) {
                count++;
            }
        }
    }
    // Safety check in case the HTML element hasn't loaded
    var tanksLeftElement = document.getElementById("tanks-left");
    if (tanksLeftElement) {
        tanksLeftElement.innerHTML = count;
    }
    return count;
}

function draw() {
    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    // 1. Paddle movement
    if (rightDown) {
        if ((paddlex + paddlew) < WIDTH) paddlex += 5;
        else paddlex = WIDTH - paddlew;
    } else if (leftDown) {
        if (paddlex > 0) paddlex -= 5;
        else paddlex = 0;
    }

    // 2. Draw ball
    ctx.beginPath(); // Start a new shape
    ctx.fillStyle = currentBallColor; // Set the color based on difficulty
    ctx.arc(x, y, r, 0, Math.PI * 2, true); // Define the circle shape
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentBallColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Draw paddle
    ctx.drawImage(paddleImg, paddlex, HEIGHT - paddleh, paddlew, paddleh);

    // 4. Draw bricks (Two-Image Logic)
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] > 0) {
                var brickX = (j * (BRICKWIDTH + PADDING)) + PADDING;
                var brickY = (i * (BRICKHEIGHT + PADDING)) + PADDING;

                if (bricks[i][j] === 2) {
                    ctx.drawImage(tankImgA, brickX, brickY, BRICKWIDTH, BRICKHEIGHT);
                } else if (bricks[i][j] === 1) {
                    ctx.drawImage(tankImgB, brickX, brickY, BRICKWIDTH, BRICKHEIGHT);
                }
            }
        }
    }

    // 5. Updated Collision Logic (Added safety bounds to prevent crashes)
    var rowheight = BRICKHEIGHT + PADDING;
    var colwidth = BRICKWIDTH + PADDING;
    var row = Math.floor(y / rowheight);
    var col = Math.floor(x / colwidth);

    // Check if we hit a brick that has health (> 0) and we are within the array boundaries
    if (y < NROWS * rowheight && row >= 0 && col >= 0 && row < NROWS && col < NCOLS && bricks[row][col] > 0) {
        dy = -dy;

        // Point on every hit!
        tocke += 1;
        document.getElementById("tocke").innerHTML = tocke;

        bricks[row][col] -= 1; // Decrease health
        updateTanksRemaining(); // Update the counter
    }

    // 6. Wall & Paddle Collision
    if (x + dx > WIDTH - r || x + dx < r) dx = -dx;
    if (y + dy < r) dy = -dy;
    else if (y + dy > HEIGHT - r) {
        if (x > paddlex && x < paddlex + paddlew) {
            dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);
            dy = -dy;
        } else {
            start = false;
            clearInterval(intervalId);
            clearInterval(timerId);
            // Optional: You can add an alert("GAME OVER") here
        }
    }

    x += dx;
    y += dy;
}

// Controls and Timer
function onKeyDown(evt) { if (evt.keyCode == 39) rightDown = true; else if (evt.keyCode == 37) leftDown = true; }
function onKeyUp(evt) { if (evt.keyCode == 39) rightDown = false; else if (evt.keyCode == 37) leftDown = false; }

function updateTimer() {
    if (start) {
        sekunde++;
        var s = (sekunde % 60).toString().padStart(2, '0');
        var m = Math.floor(sekunde / 60).toString().padStart(2, '0');
        document.getElementById("cas").innerHTML = m + ":" + s;
    }
}