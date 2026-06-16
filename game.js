const grid = document.getElementById('grid');
const width = 8;
const candyColors = [
    'color-0', // Red
    'color-1', // Orange
    'color-2', // Yellow
    'color-3', // Green
    'color-4', // Blue
    'color-5'  // Purple
];

let squares = [];
window.score = 0;
let level = 1;
let moves = 15;
let targetScore = 1000;
let isAnimating = false;

// UI Elements
const scoreDisplay = document.getElementById('score-display');
const movesDisplay = document.getElementById('moves-display');
const levelDisplay = document.getElementById('level-display');
const targetDisplay = document.getElementById('target-display');
const gameOverModal = document.getElementById('game-over-modal');
const goTitle = document.getElementById('go-title');
const goMessage = document.getElementById('go-message');
const nextLevelBtn = document.getElementById('next-level-btn');
const restartBtn = document.getElementById('restart-btn');
const gameSubmitScoreBtn = document.getElementById('submit-score-btn');

// Dragging Logic Variables
let colorBeingDragged;
let colorBeingReplaced;
let squareIdBeingDragged;
let squareIdBeingReplaced;

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;

function createBoard() {
    try {
        grid.innerHTML = '';
        squares = [];
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            let randomColor = Math.floor(Math.random() * candyColors.length);
            square.classList.add('tile');
            square.classList.add(candyColors[randomColor]);
            square.setAttribute('id', i);
            
            // Mouse Events
            square.setAttribute('draggable', true);
            square.addEventListener('dragstart', dragStart);
            square.addEventListener('dragover', dragOver);
            square.addEventListener('dragenter', dragEnter);
            square.addEventListener('dragleave', dragLeave);
            square.addEventListener('drop', dragDrop);
            square.addEventListener('dragend', dragEnd);

            // Touch Events
            square.addEventListener('touchstart', touchStart, {passive: false});
            square.addEventListener('touchend', touchEnd, {passive: false});

            grid.appendChild(square);
            squares.push(square);
        }
        
        // Ensure no pre-existing matches
        checkMatchesOnStart();
    } catch (error) {
        alert("Error creating board: " + error.message);
        console.error(error);
    }
}

function checkMatchesOnStart() {
    let hasMatch = true;
    while(hasMatch) {
        hasMatch = false;
        // Check rows
        for (let i = 0; i < 64; i++) {
            let rowOfThree = [i, i+1, i+2];
            let decidedColor = squares[i].classList[1];
            const isBlank = !decidedColor;
            const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
            if (notValid.includes(i)) continue;

            if (rowOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
                hasMatch = true;
                squares[i].className = 'tile ' + candyColors[Math.floor(Math.random() * candyColors.length)];
            }
        }
        // Check columns
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i+width, i+width*2];
            let decidedColor = squares[i].classList[1];
            const isBlank = !decidedColor;
            if (columnOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
                hasMatch = true;
                squares[i].className = 'tile ' + candyColors[Math.floor(Math.random() * candyColors.length)];
            }
        }
    }
}

// Drag functions
function dragStart() {
    if(isAnimating) return;
    colorBeingDragged = this.className;
    squareIdBeingDragged = parseInt(this.id);
}

function dragOver(e) { e.preventDefault(); }
function dragEnter(e) { e.preventDefault(); }
function dragLeave() {}

function dragDrop() {
    if(isAnimating) return;
    colorBeingReplaced = this.className;
    squareIdBeingReplaced = parseInt(this.id);
}

function dragEnd() {
    if(isAnimating || moves <= 0) return;
    
    let validMoves = [
        squareIdBeingDragged - 1,
        squareIdBeingDragged - width,
        squareIdBeingDragged + 1,
        squareIdBeingDragged + width
    ];

    // Handle edge cases
    if (squareIdBeingDragged % width === 0) validMoves = validMoves.filter(m => m !== squareIdBeingDragged - 1);
    if (squareIdBeingDragged % width === width - 1) validMoves = validMoves.filter(m => m !== squareIdBeingDragged + 1);

    let validMove = validMoves.includes(squareIdBeingReplaced);

    if (squareIdBeingReplaced >= 0 && validMove) {
        // Swap
        squares[squareIdBeingDragged].className = colorBeingReplaced;
        squares[squareIdBeingReplaced].className = colorBeingDragged;
        
        // Check if swap creates a match
        let isMatch = checkMatches();
        
        if (isMatch) {
            squareIdBeingReplaced = null;
            moves--;
            movesDisplay.innerText = moves;
            updateGame();
        } else {
            // Swap back
            squares[squareIdBeingDragged].className = colorBeingDragged;
            squares[squareIdBeingReplaced].className = colorBeingReplaced;
            if(window.playSwapSound) window.playSwapSound();
        }
    }
}

// Touch Support
function touchStart(e) {
    if(isAnimating) return;
    if (e.cancelable) e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    squareIdBeingDragged = parseInt(this.id);
    colorBeingDragged = this.className;
}

function touchEnd(e) {
    if(isAnimating || moves <= 0) return;
    if (e.cancelable) e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) return; // Tap, not swipe
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0) squareIdBeingReplaced = squareIdBeingDragged + 1;
        else squareIdBeingReplaced = squareIdBeingDragged - 1;
    } else {
        // Vertical swipe
        if (diffY > 0) squareIdBeingReplaced = squareIdBeingDragged + width;
        else squareIdBeingReplaced = squareIdBeingDragged - width;
    }
    
    // Bounds check
    if (squareIdBeingReplaced < 0 || squareIdBeingReplaced > 63) return;
    
    colorBeingReplaced = squares[squareIdBeingReplaced].className;
    dragEnd();
}

function checkMatches() {
    let hasMatch = false;
    
    // Rows
    for (let i = 0; i < 64; i++) {
        let rowOfThree = [i, i+1, i+2];
        let decidedColor = squares[i].classList[1];
        const isBlank = !decidedColor;
        const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
        if (notValid.includes(i)) continue;

        if (rowOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
            hasMatch = true;
            window.score += 30;
            if(window.playPopSound) window.playPopSound();
            rowOfThree.forEach(index => {
                squares[index].classList.add('popping');
                setTimeout(() => {
                    squares[index].className = 'tile'; // Clear
                }, 300);
            });
        }
    }
    
    // Columns
    for (let i = 0; i < 48; i++) {
        let columnOfThree = [i, i+width, i+width*2];
        let decidedColor = squares[i].classList[1];
        const isBlank = !decidedColor;
        
        if (columnOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
            hasMatch = true;
            window.score += 30;
            if(window.playPopSound) window.playPopSound();
            columnOfThree.forEach(index => {
                squares[index].classList.add('popping');
                setTimeout(() => {
                    squares[index].className = 'tile'; // Clear
                }, 300);
            });
        }
    }
    
    scoreDisplay.innerText = window.score;
    return hasMatch;
}

function moveDown() {
    for (let i = 0; i < 56; i++) {
        if (!squares[i + width].classList[1]) {
            squares[i + width].className = squares[i].className;
            squares[i].className = 'tile';
            const firstRow = [0, 1, 2, 3, 4, 5, 6, 7];
            const isFirstRow = firstRow.includes(i);
            if (isFirstRow && !squares[i].classList[1]) {
                let randomColor = Math.floor(Math.random() * candyColors.length);
                squares[i].className = 'tile ' + candyColors[randomColor];
            }
        }
    }
    // Refill top row
    for(let i = 0; i < 8; i++) {
        if(!squares[i].classList[1]) {
            let randomColor = Math.floor(Math.random() * candyColors.length);
            squares[i].className = 'tile ' + candyColors[randomColor];
        }
    }
}

function updateGame() {
    isAnimating = true;
    
    let intervalId = setInterval(() => {
        moveDown();
        let matchMade = checkMatches();
        
        // If grid is full and no matches made this tick, stop.
        let isGridFull = true;
        for(let i=0; i<64; i++){
            if(!squares[i].classList[1]) {
                isGridFull = false;
                break;
            }
        }
        
        if (isGridFull && !matchMade) {
            clearInterval(intervalId);
            isAnimating = false;
            checkWinCondition();
        }
    }, 150);
}

function checkWinCondition() {
    if (window.score >= targetScore) {
        // Level cleared!
        if(window.playWinSound) window.playWinSound();
        gameOverModal.classList.remove('hidden');
        goTitle.innerText = "Level Cleared!";
        goMessage.innerText = `You scored ${window.score} points!`;
        gameSubmitScoreBtn.classList.remove('hidden');
        nextLevelBtn.classList.remove('hidden');
        restartBtn.classList.add('hidden');
    } else if (moves <= 0) {
        // Game over
        if(window.playLoseSound) window.playLoseSound();
        gameOverModal.classList.remove('hidden');
        goTitle.innerText = "Out of Moves!";
        goMessage.innerText = `Target was ${targetScore}. You scored ${window.score}.`;
        gameSubmitScoreBtn.classList.add('hidden');
        nextLevelBtn.classList.add('hidden');
        restartBtn.classList.remove('hidden');
    }
}

// Next level logic
nextLevelBtn.addEventListener('click', () => {
    level++;
    startLevel();
});

restartBtn.addEventListener('click', () => {
    startLevel();
});

function startLevel() {
    moves = 15 + Math.floor(level / 2);
    targetScore = level * 1000;
    window.score = 0;
    
    levelDisplay.innerText = level;
    movesDisplay.innerText = moves;
    targetDisplay.innerText = targetScore;
    scoreDisplay.innerText = window.score;
    
    gameOverModal.classList.add('hidden');
    createBoard();
}

// Initialize
// We don't call startLevel() here; it is called from web3.js when Start Game is clicked.
window.startGameLoop = startLevel;
