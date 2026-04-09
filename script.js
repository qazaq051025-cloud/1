let currentGameType = '';
let currentTopicId = '';
let winScore = 10; // Негізгі жеңіс ұпайы

let scores = { left: 0, right: 0 };
let currentQ = { left: null, right: null };
let currentOptions = { left: [], right: [] }; // Stores shuffled mapped options

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    generateTopicButtons();
});

// Menus
function selectGameType(type) {
    currentGameType = type;
    
    // Set specific win scores based on game type
    if (type === 'tarik-tambang') winScore = 5; // difference needed to win
    if (type === 'panjat-pinang') winScore = 7;
    if (type === 'balap-karung') winScore = 10;

    document.getElementById('gameTypeMenu').style.display = 'none';
    document.getElementById('topicMenu').style.display = 'flex';
}

function generateTopicButtons() {
    const container = document.getElementById('topicButtons');
    container.innerHTML = '';
    
    gameConfig.topics.forEach(topic => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.innerHTML = `${topic.icon} ${topic.name}`;
        btn.onclick = () => startGame(topic.id);
        container.appendChild(btn);
    });
}

function backToGameTypeMenu() {
    document.getElementById('topicMenu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('winnerModal').style.display = 'none';
    document.getElementById('gameTypeMenu').style.display = 'flex';
}

function startGame(topicId) {
    currentTopicId = topicId;
    scores = { left: 0, right: 0 };
    
    document.getElementById('topicMenu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    
    // Setup UI for Game
    const topic = gameConfig.topics.find(t => t.id === currentTopicId);
    document.getElementById('gameTitle').innerText = topic.icon + " " + topic.name;
    
    // Update Score UI
    updateScoreUI();

    // Hide all scenes, show current
    document.querySelectorAll('.game-scene').forEach(el => el.style.display = 'none');
    document.getElementById(`scene-${currentGameType}`).style.display = 'flex';
    
    // Reset Character positions
    resetAnimations();
    
    // Generate first questions
    nextQuestion('left');
    nextQuestion('right');
}

function nextQuestion(player) {
    const topic = gameConfig.topics.find(t => t.id === currentTopicId);
    if (!topic || !topic.questions.length) return;
    
    // Pick random question
    const randomIndex = Math.floor(Math.random() * topic.questions.length);
    const q = topic.questions[randomIndex];
    
    currentQ[player] = q;
    
    // Update Question Text
    document.getElementById(`q-${player}`).innerText = q.q;
    
    const container = document.getElementById(`input-${player}`);
    container.innerHTML = ''; // reset previous input
    
    if (topic.inputType === 'numpad') {
        const numpadHtml = `
            <div class="numpad-display-box" id="display-${player}"></div>
            <div class="numpad-grid">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="num-btn" onclick="typeNum('${player}', ${n})">${n}</button>`).join('')}
                <button class="num-btn clear-btn" onclick="clearNum('${player}')">C</button>
                <button class="num-btn" onclick="typeNum('${player}', 0)">0</button>
                <button class="num-btn enter-btn" onclick="checkNumpad('${player}')">✓</button>
            </div>
        `;
        container.innerHTML = numpadHtml;
        currentOptions[player] = q.answerText;
    } 
    else {
        // Test, cards, or true_false
        let optionsMap = q.options.map((optText, index) => ({
            text: optText,
            isCorrect: (index === q.answer)
        }));
        
        // Shuffle options if not true/false
        if (topic.inputType !== 'true_false') {
            optionsMap.sort(() => Math.random() - 0.5);
        }
        currentOptions[player] = optionsMap;
        
        if (topic.inputType === 'test') {
            container.className = "input-container multiple-choice-pad";
            optionsMap.forEach((opt, idx) => {
                let btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerText = opt.text;
                btn.onclick = () => checkAnswer(player, idx, btn);
                container.appendChild(btn);
            });
        } 
        else if (topic.inputType === 'cards') {
            container.className = "input-container cards-pad";
            optionsMap.forEach((opt, idx) => {
                let btn = document.createElement('button');
                btn.className = 'card-btn';
                btn.innerText = opt.text;
                btn.onclick = () => checkAnswer(player, idx, btn);
                container.appendChild(btn);
            });
        } 
        else if (topic.inputType === 'true_false') {
            container.className = "input-container tf-pad";
            optionsMap.forEach((opt, idx) => {
                let btn = document.createElement('button');
                btn.className = 'tf-btn';
                btn.innerText = opt.text;
                btn.onclick = () => checkAnswer(player, idx, btn);
                container.appendChild(btn);
            });
        }
    }
}

// Numpad Functions
function typeNum(player, n) {
    const display = document.getElementById(`display-${player}`);
    display.innerText += n;
}

function clearNum(player) {
    document.getElementById(`display-${player}`).innerText = '';
}

function checkNumpad(player) {
    const display = document.getElementById(`display-${player}`);
    const typedValue = display.innerText.trim();
    const correctAnswer = currentOptions[player];
    
    if (typedValue === correctAnswer) {
        display.classList.add('correct');
        // Disable numpad
        const buttons = document.getElementById(`input-${player}`).querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        processCorrect(player);
    } else {
        display.classList.add('wrong');
        setTimeout(() => {
            display.classList.remove('wrong');
            display.innerText = '';
        }, 500);
    }
}

function checkAnswer(player, index, buttonElement) {
    const selectedOption = currentOptions[player][index];
    
    if (selectedOption.isCorrect) {
        buttonElement.classList.add('correct');
        const buttons = document.getElementById(`input-${player}`).querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        processCorrect(player);
    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
    }
}

function processCorrect(player) {
    scores[player]++;
    triggerAnimation(player);
    updateScoreUI();
    
    if (checkWin()) {
        return;
    }
    
    setTimeout(() => {
        nextQuestion(player);
    }, 500);
}

function updateScoreUI() {
    if (currentGameType === 'tarik-tambang') {
         document.getElementById('score-left').innerText = scores.left;
         document.getElementById('score-right').innerText = scores.right;
    } else {
         document.getElementById('score-left').innerText = `${scores.left}/${winScore}`;
         document.getElementById('score-right').innerText = `${scores.right}/${winScore}`;
    }
}

function triggerAnimation(player) {
    if (currentGameType === 'tarik-tambang') {
        const rope = document.getElementById('rope');
        // Left goes positive X (wait, if Left is winning, rope goes left so translateX should be negative)
        // Wait, Left player is flex start (left side). If rope goes left, translateX is negative.
        let diff = scores.right - scores.left; 
        rope.style.transform = `translateX(${diff * 30}px)`; // 30px per point
    } 
    else if (currentGameType === 'panjat-pinang') {
        const climber = document.getElementById(`climber-${player}`);
        let percent = (scores[player] / winScore) * 85; // 85% is top
        climber.style.bottom = `${percent}%`;
        
        toggleActionImage(climber, 'stand', 'climb');
    }
    else if (currentGameType === 'balap-karung') {
        const racer = document.getElementById(`racer-${player}`);
        let percent = (scores[player] / winScore) * 90;
        racer.style.left = `${percent}%`;
        
        toggleActionImage(racer, 'stand', 'hop');
    }
}

function toggleActionImage(container, standClass, actionClass) {
    if (currentGameType === 'panjat-pinang') {
        container.classList.add('climbing');
        setTimeout(() => container.classList.remove('climbing'), 300);
    } else if (currentGameType === 'balap-karung') {
        container.classList.add('hopping');
        setTimeout(() => container.classList.remove('hopping'), 300);
    }
}

function resetAnimations() {
    if (currentGameType === 'tarik-tambang') {
         document.getElementById('rope').style.transform = `translateX(0px)`;
    }
    else if (currentGameType === 'panjat-pinang') {
         document.getElementById('climber-left').style.bottom = '0%';
         document.getElementById('climber-right').style.bottom = '0%';
    }
    else if (currentGameType === 'balap-karung') {
         document.getElementById('racer-left').style.left = '0%';
         document.getElementById('racer-right').style.left = '0%';
    }
}

function checkWin() {
    if (currentGameType === 'tarik-tambang') {
        let diff = scores.left - scores.right;
        if (diff >= winScore) return showWinner('Сол жақ ойыншы');
        if (diff <= -winScore) return showWinner('Оң жақ ойыншы');
    } else {
        if (scores.left >= winScore) return showWinner('Сол жақ ойыншы');
        if (scores.right >= winScore) return showWinner('Оң жақ ойыншы');
    }
    return false;
}

function showWinner(name) {
    document.getElementById('winnerText').innerText = `🎉 ${name} Жеңіске Жетті! 🎉`;
    document.getElementById('winnerMessage').innerText = `Ұпай: ${scores.left} - ${scores.right}`;
    document.getElementById('winnerModal').style.display = 'flex';
    return true;
}
