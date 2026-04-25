const DOM = {
    playerCount: document.getElementById('player-count'),
    playerCountDisplay: document.getElementById('player-count-display'),
    generateBtn: document.getElementById('generate-btn'),
    topNodes: document.getElementById('top-nodes'),
    bottomNodes: document.getElementById('bottom-nodes'),
    canvas: document.getElementById('ladder-canvas'),
    playAllBtn: document.getElementById('play-all-btn'),
    gameBoardInner: document.getElementById('game-board-inner'),
    resetBtn: document.getElementById('reset-btn'),
};

const CTX = DOM.canvas.getContext('2d');
const OPTIONS = ["대표님", "사모님", "선생님", "실장님", "기승", "성찬", "장헌"];

let state = {
    numPlayers: 5,
    ladderData: [], // {x, y1, y2} for horizontal lines
    verticalLines: [], // x coordinates
    selections: Array(8).fill(""),
    results: Array(8).fill("꽝"),
    isGenerated: false,
    isAnimating: false,
    colors: ['#ff0055', '#00ffaa', '#ffaa00', '#00aaff', '#aa00ff', '#ffff00', '#ff00aa', '#00ffff']
};

function init() {
    DOM.playerCount.addEventListener('input', (e) => {
        state.numPlayers = parseInt(e.target.value);
        DOM.playerCountDisplay.textContent = state.numPlayers;
        renderNodes();
        clearCanvas();
        state.isGenerated = false;
        DOM.playAllBtn.disabled = true;
        checkWinnerSelected();
    });

    DOM.generateBtn.addEventListener('click', generateLadder);
    DOM.playAllBtn.addEventListener('click', playAllAnimations);
    DOM.resetBtn.addEventListener('click', resetGame);

    window.addEventListener('resize', () => {
        if (state.isGenerated) {
            drawLadder();
        } else {
            clearCanvas();
        }
    });

    renderNodes();
    clearCanvas();
}

function resetGame() {
    state.selections = Array(8).fill("");
    state.results = Array(8).fill("꽝");
    state.isGenerated = false;
    state.isAnimating = false;
    
    // UI 초기화
    DOM.playerCount.value = 5;
    state.numPlayers = 5;
    DOM.playerCountDisplay.textContent = 5;
    
    renderNodes();
    clearCanvas();
    DOM.playAllBtn.disabled = true;
}

function renderNodes() {
    DOM.gameBoardInner.style.minWidth = '100%'; // 한 화면에 꽉 차게 변경

    DOM.topNodes.innerHTML = '';
    DOM.bottomNodes.innerHTML = '';

    for (let i = 0; i < state.numPlayers; i++) {
        // Top Node
        const topWrapper = document.createElement('div');
        topWrapper.className = 'node-wrapper';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'node-input-container';

        const select = document.createElement('select');
        select.className = 'node-select';
        select.dataset.index = i;
        
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = "선택";
        select.appendChild(defaultOpt);

        OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });

        const customOpt = document.createElement('option');
        customOpt.value = "직접작성";
        customOpt.textContent = "직접작성";
        select.appendChild(customOpt);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'node-text hidden';
        input.dataset.index = i;
        input.placeholder = '이름';

        // Set previous selection if valid
        if (state.selections[i] && OPTIONS.includes(state.selections[i])) {
            select.value = state.selections[i];
        } else if (state.selections[i] && state.selections[i] !== "직접작성") {
            select.value = "직접작성";
            select.classList.add('hidden');
            input.classList.remove('hidden');
            input.value = state.selections[i];
        }

        select.addEventListener('change', handleSelectChange);
        input.addEventListener('blur', handleInputChange);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
        });

        inputContainer.appendChild(select);
        inputContainer.appendChild(input);

        const startBtn = document.createElement('button');
        startBtn.className = 'start-btn';
        startBtn.textContent = '시작';
        startBtn.onclick = () => playAnimation(i);

        topWrapper.appendChild(inputContainer);
        topWrapper.appendChild(startBtn);
        DOM.topNodes.appendChild(topWrapper);

        // Bottom Node
        const bottomNode = document.createElement('div');
        bottomNode.className = 'bottom-node';
        bottomNode.dataset.index = i;
        bottomNode.textContent = state.results[i] || "꽝";
        if (state.results[i] === "당첨") {
            bottomNode.classList.add('winner');
        }

        bottomNode.addEventListener('click', () => {
            if (state.isGenerated) return; // 사다리가 생성된 후에는 결과 변경 불가
            
            if (state.results[i] === "당첨") {
                state.results[i] = "꽝";
                bottomNode.classList.remove('winner');
                bottomNode.textContent = "꽝";
            } else {
                state.results[i] = "당첨";
                bottomNode.classList.add('winner');
                bottomNode.textContent = "당첨";
            }
            checkWinnerSelected();
        });

        DOM.bottomNodes.appendChild(bottomNode);
    }
    updateSelectOptions();
    checkWinnerSelected();
}

function checkWinnerSelected() {
    const hasWinner = state.results.slice(0, state.numPlayers).some(res => res === "당첨");
    const allNamesEntered = state.selections.slice(0, state.numPlayers).every(name => name && name.trim() !== "");
    DOM.generateBtn.disabled = !(hasWinner && allNamesEntered);
}

function handleSelectChange(e) {
    const index = e.target.dataset.index;
    const val = e.target.value;
    
    if (val === "직접작성") {
        const input = e.target.nextElementSibling;
        e.target.classList.add('hidden');
        input.classList.remove('hidden');
        input.focus();
        state.selections[index] = "";
    } else {
        state.selections[index] = val;
    }
    updateSelectOptions();
    checkWinnerSelected();
}

function handleInputChange(e) {
    const index = e.target.dataset.index;
    const val = e.target.value.trim();
    if (val === "") {
        // Revert to select
        const select = e.target.previousElementSibling;
        select.classList.remove('hidden');
        select.value = "";
        e.target.classList.add('hidden');
        state.selections[index] = "";
    } else {
        state.selections[index] = val;
    }
    updateSelectOptions();
    checkWinnerSelected();
}

function updateSelectOptions() {
    const selects = document.querySelectorAll('.node-select');
    selects.forEach(select => {
        const currentIndex = select.dataset.index;
        const currentValue = select.value;
        
        Array.from(select.options).forEach(option => {
            if (option.value === "" || option.value === "직접작성") return;
            
            // If another select has this value, disable it
            const isUsed = state.selections.some((sel, idx) => sel === option.value && idx != currentIndex);
            if (isUsed) {
                option.disabled = true;
                option.style.color = '#555';
            } else {
                option.disabled = false;
                option.style.color = '#fff';
            }
        });
    });
}

function resizeCanvas() {
    const rect = DOM.canvas.parentElement.getBoundingClientRect();
    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;
}

function clearCanvas() {
    resizeCanvas();
    CTX.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
}

function generateLadder() {
    if (state.isAnimating) return;
    
    resizeCanvas();
    const width = DOM.canvas.width;
    const height = DOM.canvas.height;
    
    // Calculate vertical line positions
    state.verticalLines = [];
    const spacing = width / state.numPlayers;
    for (let i = 0; i < state.numPlayers; i++) {
        state.verticalLines.push(spacing * i + spacing / 2);
    }

    // Generate random horizontal lines
    state.ladderData = [];
    const minH = 40;
    const maxH = height - 40;
    const minGapY = 30; // 가로줄 간의 최소 높이 차이 (겹침 방지)
    
    for (let i = 0; i < state.numPlayers - 1; i++) {
        let linesInColumn = Math.floor(Math.random() * 3) + 2; // 2 to 4 lines per gap
        for (let j = 0; j < linesInColumn; j++) {
            let y;
            let isValid = false;
            let attempts = 0;

            while (!isValid && attempts < 100) {
                y = minH + Math.random() * (maxH - minH);
                isValid = true;

                // 같은 컬럼 또는 인접한 컬럼에 비슷한 높이의 가로줄이 있는지 확인하여 겹침 방지
                for (let k = 0; k < state.ladderData.length; k++) {
                    const existingLine = state.ladderData[k];
                    if (Math.abs(existingLine.col - i) <= 1) {
                        if (Math.abs(existingLine.y - y) < minGapY) {
                            isValid = false;
                            break;
                        }
                    }
                }
                attempts++;
            }

            if (isValid) {
                state.ladderData.push({
                    col: i,
                    x1: state.verticalLines[i],
                    x2: state.verticalLines[i+1],
                    y: y
                });
            }
        }
    }

    // Sort ladder data by Y
    state.ladderData.sort((a, b) => a.y - b.y);

    state.isGenerated = true;
    DOM.playAllBtn.disabled = false;
    drawLadder();
}

function drawLadder() {
    clearCanvas();
    CTX.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    CTX.lineWidth = 4;
    CTX.lineCap = 'round';

    const height = DOM.canvas.height;

    // Draw vertical lines
    state.verticalLines.forEach(x => {
        CTX.beginPath();
        CTX.moveTo(x, 0);
        CTX.lineTo(x, height);
        CTX.stroke();
    });

    // Draw horizontal lines
    state.ladderData.forEach(line => {
        CTX.beginPath();
        CTX.moveTo(line.x1, line.y);
        CTX.lineTo(line.x2, line.y);
        CTX.stroke();
    });
}

function playAnimation(startIndex) {
    if (!state.isGenerated || state.isAnimating) return;
    
    drawLadder(); // Reset board
    animatePath(startIndex, state.colors[startIndex % state.colors.length]);
}

function playAllAnimations() {
    if (!state.isGenerated || state.isAnimating) return;
    drawLadder();
    
    let delay = 0;
    for (let i = 0; i < state.numPlayers; i++) {
        setTimeout(() => {
            animatePath(i, state.colors[i % state.colors.length], i === state.numPlayers - 1);
        }, delay);
        delay += 2000; // 2 seconds between starts
    }
}

function animatePath(startIndex, color, isLast = false) {
    state.isAnimating = true;
    
    // Calculate path
    let currentCol = startIndex;
    let path = [{x: state.verticalLines[currentCol], y: 0}];
    
    const height = DOM.canvas.height;
    
    // Find all intersections
    let currentY = 0;
    
    while (currentY < height) {
        // Find next horizontal line in current col or adjacent cols
        const nextLine = state.ladderData.find(l => 
            l.y > currentY && (l.col === currentCol || l.col === currentCol - 1)
        );

        if (nextLine) {
            path.push({x: state.verticalLines[currentCol], y: nextLine.y});
            
            if (nextLine.col === currentCol) {
                // Move right
                currentCol++;
            } else {
                // Move left
                currentCol--;
            }
            path.push({x: state.verticalLines[currentCol], y: nextLine.y});
            currentY = nextLine.y + 1;
        } else {
            path.push({x: state.verticalLines[currentCol], y: height});
            currentY = height;
        }
    }

    // Animate
    let progress = 0;
    const speed = 5;
    let pathIndex = 0;
    let currentPos = { ...path[0] };

    function drawFrame() {
        if (pathIndex >= path.length - 1) {
            state.isAnimating = false;
            // Highlight result
            const bottomNodes = DOM.bottomNodes.children;
            const originalBg = bottomNodes[currentCol].style.background;
            bottomNodes[currentCol].style.background = 'rgba(0, 243, 255, 0.4)';
            bottomNodes[currentCol].style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.6)';
            
            // "당첨" 결과인 경우 참가자 이름과 함께 표시
            if (state.results[currentCol] === "당첨") {
                const winnerName = state.selections[startIndex] || `참가자 ${startIndex + 1}`;
                bottomNodes[currentCol].innerHTML = `${winnerName}<br>당첨`;
            }

            setTimeout(() => {
                bottomNodes[currentCol].style.background = originalBg;
                bottomNodes[currentCol].style.boxShadow = 'none';
            }, 1000);
            return;
        }

        const target = path[pathIndex + 1];
        const dx = target.x - currentPos.x;
        const dy = target.y - currentPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < speed) {
            currentPos = { ...target };
            pathIndex++;
        } else {
            currentPos.x += (dx / dist) * speed;
            currentPos.y += (dy / dist) * speed;
        }

        CTX.strokeStyle = color;
        CTX.lineWidth = 6;
        CTX.shadowColor = color;
        CTX.shadowBlur = 10;
        
        CTX.beginPath();
        CTX.moveTo(path[pathIndex].x, path[pathIndex].y);
        CTX.lineTo(currentPos.x, currentPos.y);
        CTX.stroke();
        
        CTX.shadowBlur = 0; // reset

        requestAnimationFrame(drawFrame);
    }

    drawFrame();
}

// Start
init();
