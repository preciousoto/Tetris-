document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const CELL_SIZE = 30;
    
    // Game variables
    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    let score = 0;
    let lines = 0;
    let level = 1;
    let animationFrameId;
    let isPaused = false;
    let gameOver = false;
    let lastDropTime;
    let currentSpeed = 1000;
    
    // Cache DOM elements and create cell references
    const gameBoard = document.getElementById('game-board');
    const nextPieceDisplay = document.getElementById('next-piece');
    const scoreDisplay = document.getElementById('score');
    const linesDisplay = document.getElementById('lines');
    const levelDisplay = document.getElementById('level');
    const gameOverDisplay = document.getElementById('game-over');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    
    // Create cell cache
    const boardCells = [];
    const nextPieceCells = [];
    
    // Tetromino shapes
    const SHAPES = {
        I: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        O: [
            [1, 1],
            [1, 1]
        ],
        T: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        S: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        Z: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        J: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        L: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    };
    
    const COLORS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    
    // Current and next piece
    let currentPiece = {
        shape: null,
        color: null,
        x: 0,
        y: 0
    };
    
    let nextPiece = {
        shape: null,
        color: null
    };
    
    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    // Initialize the game
    function init() {
        // Create the game board
        createBoard();
        
        // Add event listeners
        document.addEventListener('keydown', control);
        restartButton.addEventListener('click', resetGame);
        
        // Generate the first pieces
        generateNextPiece();
        getNewPiece();
        
        // Start the game
        animationFrameId = requestAnimationFrame(gameLoop);

        // Touch controls
        gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            e.preventDefault(); // Prevent scrolling
        });

        gameBoard.addEventListener('touchmove', (e) => {
            if (gameOver || isPaused) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Horizontal movement
            if (Math.abs(deltaX) > 30) {
                movePiece(deltaX > 0 ? 1 : -1, 0);
                touchStartX = touchX;
            }
            
            // Vertical movement
            if (Math.abs(deltaY) > 30) {
                movePiece(0, deltaY > 0 ? 1 : -1);
                touchStartY = touchY;
            }
            
            e.preventDefault(); // Prevent scrolling
        });

        gameBoard.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // Quick tap for rotation
            if (touchDuration < 200) {
                rotatePiece();
            }
            
            // Long press for hard drop
            if (touchDuration > 500) {
                hardDrop();
            }
            
            e.preventDefault(); // Prevent scrolling
        });

        // Prevent default behavior for arrow keys
        document.addEventListener('keydown', (e) => {
            if ([37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        });
    }
    
    // Create the game board
    function createBoard() {
        // Clear the game board
        gameBoard.innerHTML = '';
        boardCells.length = 0;
        
        // Create cells for the game board
        const fragment = document.createDocumentFragment();
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            const rowCells = [];
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);
                fragment.appendChild(cell);
                rowCells.push(cell);
            }
            boardCells.push(rowCells);
        }
        gameBoard.appendChild(fragment);
        
        // Create cells for the next piece display
        nextPieceDisplay.innerHTML = '';
        const nextFragment = document.createDocumentFragment();
        for (let row = 0; row < 4; row++) {
            const rowCells = [];
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                nextFragment.appendChild(cell);
                rowCells.push(cell);
            }
            nextPieceCells.push(rowCells);
        }
        nextPieceDisplay.appendChild(nextFragment);
    }
    
    // Generate a random piece
    function generateRandomPiece() {
        const pieces = 'IOTSZJL';
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            shape: SHAPES[randomPiece],
            type: randomPiece,
            x: randomPiece === 'O' ? 4 : 3,
            y: 0
        };
    }
    
    // Generate the next piece
    function generateNextPiece() {
        nextPiece = generateRandomPiece();
        
        // Display the next piece
        const cells = nextPieceDisplay.querySelectorAll('.cell');
        cells.forEach(cell => cell.className = 'cell');
        
        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    const index = row * 4 + col;
                    cells[index].className = `cell tetromino ${nextPiece.type}`;
                }
            }
        }
    }
    
    // Get a new piece
    function getNewPiece() {
        currentPiece = nextPiece;
        generateNextPiece();
        
        // Check for game over
        if (collision(0, 0)) {
            gameOver = true;
            cancelAnimationFrame(animationFrameId);
            finalScoreDisplay.textContent = score;
            gameOverDisplay.style.display = 'block';
        }
    }
    
    // Draw the current piece on the board
    function drawPiece() {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.y + row;
                    const boardCol = currentPiece.x + col;
                    
                    if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
                        boardCells[boardRow][boardCol].className = `cell tetromino ${currentPiece.type}`;
                    }
                }
            }
        }
    }
    
    // Clear the board
    function clearBoard() {
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                boardCells[row][col].className = 'cell';
            }
        }
    }
    
    // Draw the locked pieces on the board
    function drawBoard() {
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                if (board[row][col]) {
                    boardCells[row][col].className = `cell tetromino ${board[row][col]}`;
                }
            }
        }
    }
    
    // Check for collision
    function collision(offsetX, offsetY, newShape = currentPiece.shape) {
        for (let row = 0; row < newShape.length; row++) {
            for (let col = 0; col < newShape[row].length; col++) {
                if (newShape[row][col]) {
                    const newX = currentPiece.x + col + offsetX;
                    const newY = currentPiece.y + row + offsetY;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Skip if above the board
                    if (newY < 0) {
                        continue;
                    }
                    
                    // Check for collision with locked pieces
                    if (board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Lock the piece in place
    function lockPiece() {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (!currentPiece.shape[row][col]) continue;
                
                if (currentPiece.y + row < 0) {
                    gameOver = true;
                    cancelAnimationFrame(animationFrameId);
                    finalScoreDisplay.textContent = score;
                    gameOverDisplay.style.display = 'block';
                    return;
                }
                
                board[currentPiece.y + row][currentPiece.x + col] = currentPiece.type;
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Get a new piece
        getNewPiece();
    }
    
    // Check for completed lines
    function checkLines() {
        let linesCleared = 0;
        
        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            let isLineComplete = true;
            
            for (let col = 0; col < BOARD_WIDTH; col++) {
                if (!board[row][col]) {
                    isLineComplete = false;
                    break;
                }
            }
            
            if (isLineComplete) {
                // Remove the line
                for (let r = row; r > 0; r--) {
                    for (let c = 0; c < BOARD_WIDTH; c++) {
                        board[r][c] = board[r-1][c];
                    }
                }
                
                // Clear the top line
                for (let c = 0; c < BOARD_WIDTH; c++) {
                    board[0][c] = 0;
                }
                
                linesCleared++;
                row++; // Check the same row again
            }
        }
        
        // Update score and level
        if (linesCleared > 0) {
            // Scoring: 100 points for 1 line, 300 for 2, 500 for 3, 800 for 4
            const points = [0, 100, 300, 500, 800];
            score += points[linesCleared] * level;
            lines += linesCleared;
            
            // Level up every 10 lines
            level = Math.floor(lines / 10) + 1;
            
            // Update speed
            currentSpeed = Math.max(100, 1000 - (level - 1) * 100);
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(gameLoop);
            
            // Update display
            scoreDisplay.textContent = score;
            linesDisplay.textContent = lines;
            levelDisplay.textContent = level;
        }
    }
    
    // Move the piece down
    function gameLoop(timestamp) {
        if (gameOver || isPaused) {
            return;
        }

        if (!lastDropTime) lastDropTime = timestamp;
        const delta = timestamp - lastDropTime;

        if (delta > currentSpeed) {
            movePiece(0, 1);
            lastDropTime = timestamp;
        }

        // Redraw the board
        clearBoard();
        drawBoard();
        drawPiece();

        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Move the piece
    function movePiece(offsetX, offsetY) {
        if (collision(offsetX, offsetY)) {
            if (offsetY > 0) {
                lockPiece();
            }
            return false;
        }
        
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        return true;
    }
    
    // Rotate the piece
    function rotatePiece() {
        const rotated = [];
        const shape = currentPiece.shape;
        
        // Create a new rotated shape
        for (let col = 0; col < shape[0].length; col++) {
            const newRow = [];
            for (let row = shape.length - 1; row >= 0; row--) {
                newRow.push(shape[row][col]);
            }
            rotated.push(newRow);
        }
        
        // Check if rotation is possible
        if (!collision(0, 0, rotated)) {
            currentPiece.shape = rotated;
        }
    }
    
    // Hard drop the piece
    function hardDrop() {
        while (movePiece(0, 1)) {
            // Keep moving down
        }
    }
    
    // Control the piece
    function control(e) {
        if (gameOver) return;
        
        if (e.keyCode === 80) { // P key
            togglePause();
            return;
        }
        
        if (isPaused) return;
        
        switch (e.keyCode) {
            case 37: // Left arrow
                movePiece(-1, 0);
                break;
            case 39: // Right arrow
                movePiece(1, 0);
                break;
            case 40: // Down arrow
                movePiece(0, 1);
                break;
            case 38: // Up arrow
                rotatePiece();
                break;
            case 32: // Space bar
                hardDrop();
                break;
        }
        
        // Redraw the board immediately after input
        clearBoard();
        drawBoard();
        drawPiece();
    }
    
    // Toggle pause
    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(animationFrameId);
        } else {
            lastDropTime = null;
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Reset the game
    function resetGame() {
        // Cancel existing animation frame
        cancelAnimationFrame(animationFrameId);
        
        // Reset variables
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        score = 0;
        lines = 0;
        level = 1;
        gameOver = false;
        isPaused = false;
        currentSpeed = 1000;
        lastDropTime = null;
        
        // Update display
        scoreDisplay.textContent = score;
        linesDisplay.textContent = lines;
        levelDisplay.textContent = level;
        gameOverDisplay.style.display = 'none';
        
        // Generate new pieces
        generateNextPiece();
        getNewPiece();
        
        // Restart the game
        animationFrameId = requestAnimationFrame(gameLoop);
        
        // Redraw the board
        clearBoard();
        drawBoard();
        drawPiece();
    }
    
    // Initialize the game
    init();
}); 