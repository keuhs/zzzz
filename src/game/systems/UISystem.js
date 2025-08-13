// UI 시스템 - 게임 UI 관리
class UISystem {
    constructor() {
        this.elements = new Map();
        this.healthBars = new Map();
        this.kiBars = new Map();
        this.timer = null;
        this.score = { player1: 0, player2: 0 };
        this.combo = { player1: 0, player2: 0 };

        // UI 요소들 캐시
        this.cacheUIElements();

        // 애니메이션 상태
        this.animations = new Map();
    }

    cacheUIElements() {
        // HTML 요소들 캐시
        this.elements.set('player1Health', document.querySelector('#player1Health .health-fill'));
        this.elements.set('player1Ki', document.querySelector('#player1Ki .ki-fill'));
        this.elements.set('player2Health', document.querySelector('#player2Health .health-fill'));
        this.elements.set('player2Ki', document.querySelector('#player2Ki .ki-fill'));
        this.elements.set('gameTitle', document.querySelector('#gameTitle'));

        // 플레이어 이름
        this.elements.set('player1Name', document.querySelector('#player1Health .character-name'));
        this.elements.set('player2Name', document.querySelector('#player2Health .character-name'));
    }

    // 플레이어 정보 업데이트
    updatePlayer(playerId, playerData) {
        const healthBar = this.elements.get(`player${playerId}Health`);
        const kiBar = this.elements.get(`player${playerId}Ki`);
        const nameElement = this.elements.get(`player${playerId}Name`);

        if (healthBar && playerData.health !== undefined) {
            const healthPercent = (playerData.health / playerData.maxHealth) * 100;
            this.animateBar(healthBar, healthPercent);

            // 체력에 따른 색상 변화
            this.updateHealthBarColor(healthBar, healthPercent);
        }

        if (kiBar && playerData.ki !== undefined) {
            const kiPercent = (playerData.ki / playerData.maxKi) * 100;
            this.animateBar(kiBar, kiPercent);
        }

        if (nameElement && playerData.name) {
            nameElement.textContent = playerData.name;
        }

        // 상태에 따른 특수 효과
        this.updatePlayerStatusEffects(playerId, playerData);
    }

    // 바 애니메이션
    animateBar(barElement, targetPercent) {
        if (!barElement) return;

        const currentPercent = parseFloat(barElement.style.width) || 0;
        const difference = targetPercent - currentPercent;

        if (Math.abs(difference) < 0.1) {
            barElement.style.width = targetPercent + '%';
            return;
        }

        // 부드러운 애니메이션
        const animationDuration = 300; // 0.3초
        const steps = 20;
        const stepSize = difference / steps;
        const stepDuration = animationDuration / steps;

        let currentStep = 0;

        const animate = () => {
            if (currentStep < steps) {
                const newPercent = currentPercent + (stepSize * currentStep);
                barElement.style.width = newPercent + '%';
                currentStep++;
                setTimeout(animate, stepDuration);
            } else {
                barElement.style.width = targetPercent + '%';
            }
        };

        animate();
    }

    // 체력바 색상 업데이트
    updateHealthBarColor(healthBar, healthPercent) {
        if (healthPercent > 60) {
            healthBar.style.background = 'linear-gradient(90deg, #00ff00 0%, #ffff00 100%)';
        } else if (healthPercent > 30) {
            healthBar.style.background = 'linear-gradient(90deg, #ffff00 0%, #ff8800 100%)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #ff0000 0%, #aa0000 100%)';
        }

        // 위험 상태 깜빡임
        if (healthPercent < 20) {
            healthBar.style.animation = 'blink 0.5s infinite';
        } else {
            healthBar.style.animation = 'none';
        }
    }

    // 플레이어 상태 효과
    updatePlayerStatusEffects(playerId, playerData) {
        const healthContainer = document.querySelector(`#player${playerId}Health`);

        if (!healthContainer) return;

        // 파워업 상태
        if (playerData.superSaiyan || playerData.poweringUp) {
            healthContainer.classList.add('power-up');
        } else {
            healthContainer.classList.remove('power-up');
        }

        // 스턴 상태
        if (playerData.stunned) {
            healthContainer.style.filter = 'hue-rotate(180deg)';
        } else {
            healthContainer.style.filter = 'none';
        }

        // 무적 상태
        if (playerData.invulnerable) {
            healthContainer.style.opacity = '0.7';
        } else {
            healthContainer.style.opacity = '1.0';
        }
    }

    // 타이머 업데이트
    updateTimer(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.elements.get('gameTitle')) {
            this.elements.get('gameTitle').textContent = timeString;
        }

        // 시간 부족 경고
        if (timeLeft < 10) {
            this.showTimeWarning();
        }
    }

    // 시간 경고
    showTimeWarning() {
        const titleElement = this.elements.get('gameTitle');
        if (titleElement) {
            titleElement.style.color = '#ff0000';
            titleElement.style.animation = 'blink 0.5s infinite';
        }
    }

    // 콤보 표시
    showCombo(playerId, comboCount) {
        if (comboCount < 2) return; // 2연타부터 표시

        this.combo[`player${playerId}`] = comboCount;

        // 콤보 텍스트 생성/업데이트
        let comboElement = document.querySelector(`#combo${playerId}`);

        if (!comboElement) {
            comboElement = document.createElement('div');
            comboElement.id = `combo${playerId}`;
            comboElement.style.cssText = `
                position: absolute;
                top: 100px;
                ${playerId === 1 ? 'left: 50px;' : 'right: 50px;'}
                color: #ffff00;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                pointer-events: none;
                z-index: 20;
                animation: comboShow 0.3s ease-out;
            `;
            document.getElementById('gameUI').appendChild(comboElement);
        }

        comboElement.textContent = `${comboCount} HIT COMBO!`;
        comboElement.style.animation = 'comboShow 0.3s ease-out';

        // 콤보 사라지는 타이머
        clearTimeout(comboElement.hideTimer);
        comboElement.hideTimer = setTimeout(() => {
            if (comboElement.parentNode) {
                comboElement.style.animation = 'comboHide 0.5s ease-in forwards';
                setTimeout(() => {
                    if (comboElement.parentNode) {
                        comboElement.parentNode.removeChild(comboElement);
                    }
                }, 500);
            }
        }, 2000);
    }

    // 데미지 숫자 표시
    showDamageNumber(position, damage, isCritical = false) {
        const damageElement = document.createElement('div');
        damageElement.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            color: ${isCritical ? '#ff0000' : '#ffffff'};
            font-size: ${isCritical ? '28px' : '20px'};
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            z-index: 25;
            animation: damageNumber 1.5s ease-out forwards;
        `;
        damageElement.textContent = `-${Math.floor(damage)}`;

        if (isCritical) {
            damageElement.textContent += '!';
        }

        document.getElementById('gameUI').appendChild(damageElement);

        // 자동 제거
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 1500);
    }

    // 특수 메시지 표시
    showMessage(text, duration = 2000, style = {}) {
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${style.color || '#ffff00'};
            font-size: ${style.fontSize || '36px'};
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            text-align: center;
            pointer-events: none;
            z-index: 30;
            animation: messageShow 0.5s ease-out;
        `;
        messageElement.textContent = text;

        document.getElementById('gameUI').appendChild(messageElement);

        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'messageHide 0.5s ease-in forwards';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 500);
            }
        }, duration);
    }

    // 라운드 시작 카운트다운
    showCountdown(callback) {
        let count = 3;

        const showNumber = () => {
            if (count > 0) {
                this.showMessage(count.toString(), 1000, {
                    fontSize: '72px',
                    color: '#ff6600'
                });
                count--;
                setTimeout(showNumber, 1000);
            } else {
                this.showMessage('FIGHT!', 1000, {
                    fontSize: '48px',
                    color: '#ff0000'
                });
                setTimeout(() => {
                    if (callback) callback();
                }, 1000);
            }
        };

        showNumber();
    }

    // 승리/패배 화면
    showResult(winner, loser) {
        const resultContainer = document.createElement('div');
        resultContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 40;
            animation: resultShow 1s ease-out;
        `;

        const winnerText = document.createElement('div');
        winnerText.style.cssText = `
            color: #ffff00;
            font-size: 48px;
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            margin-bottom: 20px;
        `;
        winnerText.textContent = `${winner.name} WINS!`;

        const quote = document.createElement('div');
        quote.style.cssText = `
            color: #ffffff;
            font-size: 24px;
            text-align: center;
            max-width: 600px;
            line-height: 1.4;
        `;
        quote.textContent = winner.getVictoryQuote ? winner.getVictoryQuote() : '승리했다!';

        const restartButton = document.createElement('button');
        restartButton.style.cssText = `
            margin-top: 40px;
            padding: 15px 30px;
            font-size: 20px;
            background: #ff6600;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        restartButton.textContent = 'REMATCH';
        restartButton.onclick = () => {
            resultContainer.remove();
            // 게임 재시작 로직 (게임 엔진에서 처리)
            if (window.gameEngine) {
                window.gameEngine.restart();
            }
        };

        resultContainer.appendChild(winnerText);
        resultContainer.appendChild(quote);
        resultContainer.appendChild(restartButton);

        document.getElementById('gameUI').appendChild(resultContainer);
    }

    // 일시정지 메뉴
    showPauseMenu() {
        const pauseContainer = document.createElement('div');
        pauseContainer.id = 'pauseMenu';
        pauseContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 50;
        `;

        const title = document.createElement('div');
        title.textContent = 'PAUSED';
        title.style.cssText = `
            color: #ffff00;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 40px;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;

        const buttons = [
            { text: 'RESUME', action: 'resume' },
            { text: 'SETTINGS', action: 'settings' },
            { text: 'MAIN MENU', action: 'mainMenu' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 15px 40px;
                font-size: 18px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                min-width: 200px;
            `;

            button.onclick = () => {
                if (btn.action === 'resume') {
                    this.hidePauseMenu();
                }
                // 다른 액션들은 게임 엔진에서 처리
            };

            buttonContainer.appendChild(button);
        });

        pauseContainer.appendChild(title);
        pauseContainer.appendChild(buttonContainer);
        document.getElementById('gameUI').appendChild(pauseContainer);
    }

    hidePauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
    }

    // CSS 애니메이션 추가
    addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }

            @keyframes comboShow {
                0% { transform: scale(0.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes comboHide {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(0.8); opacity: 0; }
            }

            @keyframes damageNumber {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-50px); opacity: 0; }
            }

            @keyframes messageShow {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            @keyframes messageHide {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
            }

            @keyframes resultShow {
                0% { opacity: 0; backdrop-filter: blur(0px); }
                100% { opacity: 1; backdrop-filter: blur(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    // 초기화
    initialize() {
        this.addCustomStyles();
        console.log('UI System initialized');
    }
}
