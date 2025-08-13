// 메인 게임 엔진 - 모든 시스템을 통합 관리
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 게임 상태
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.deltaTime = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;

        // 시스템들 초기화
        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.animationSystem = new AnimationSystem();
        this.particleSystem = new ParticleSystem();
        this.combatSystem = new CombatSystem();
        this.uiSystem = new UISystem();

        // 플레이어들
        this.player1 = null;
        this.player2 = null;

        // 게임 오브젝트들
        this.gameObjects = [];
        this.attacks = [];

        // 배경과 스테이지
        this.background = null;
        this.stage = {
            width: 1200,
            height: 600,
            groundLevel: 500
        };

        // 카메라 (간단한 구현)
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            shake: 0,
            shakeDecay: 0.9
        };

        // 성능 모니터링
        this.performance = {
            updateTime: 0,
            renderTime: 0,
            frameTime: 0
        };

        // 디버그 모드
        this.debugMode = false;

        // 게임 루프 바인딩
        this.gameLoop = this.gameLoop.bind(this);

        this.initialize();
    }

    initialize() {
        console.log('Game Engine initializing...');

        // 시스템 초기화
        this.uiSystem.initialize();

        // 오디오 재개 (사용자 상호작용 후)
        document.addEventListener('click', () => {
            this.audioManager.resumeAudioContext();
        }, { once: true });

        // 키보드 단축키
        this.setupKeyboardShortcuts();

        // 게임 초기화
        this.initializeGame();

        console.log('Game Engine initialized');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Escape':
                    this.togglePause();
                    break;
                case 'F1':
                    this.toggleDebugMode();
                    break;
                case 'F5':
                    this.restart();
                    break;
            }
        });
    }

    initializeGame() {
        // 플레이어 생성
        this.player1 = new Goku(200, 400, 'player1');
        this.player2 = new Vegeta(1000, 400, 'player2');

        // 전투 시스템에 플레이어 추가
        this.combatSystem.addPlayer(this.player1);
        this.combatSystem.addPlayer(this.player2);

        // 배경 생성
        this.createBackground();

        // 게임 상태를 플레이로 변경
        this.gameState = 'playing';

        // UI 카운트다운 시작
        this.uiSystem.showCountdown(() => {
            this.combatSystem.startMatch();
            this.start();
        });
    }

    createBackground() {
        // 간단한 배경 (그라데이션)
        this.background = {
            draw: (ctx) => {
                // 하늘 그라데이션
                const gradient = ctx.createLinearGradient(0, 0, 0, this.stage.height);
                gradient.addColorStop(0, '#87CEEB'); // 하늘색
                gradient.addColorStop(0.7, '#98FB98'); // 연한 초록
                gradient.addColorStop(1, '#90EE90'); // 초록

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, this.stage.width, this.stage.height);

                // 구름들
                this.drawClouds(ctx);

                // 지면
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, this.stage.groundLevel, this.stage.width, this.stage.height - this.stage.groundLevel);

                // 무대 테두리
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 5;
                ctx.strokeRect(50, 50, this.stage.width - 100, this.stage.height - 100);
            }
        };
    }

    drawClouds(ctx) {
        const clouds = [
            { x: 100, y: 80, size: 40 },
            { x: 300, y: 120, size: 60 },
            { x: 700, y: 90, size: 50 },
            { x: 950, y: 110, size: 45 },
            { x: 1100, y: 70, size: 35 }
        ];

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        clouds.forEach(cloud => {
            // 구름 모양 (여러 원으로 구성)
            for (let i = 0; i < 5; i++) {
                const offsetX = (i - 2) * cloud.size * 0.3;
                const offsetY = Math.sin(i) * cloud.size * 0.2;
                const radius = cloud.size * (0.7 + Math.sin(i) * 0.3);

                ctx.beginPath();
                ctx.arc(cloud.x + offsetX, cloud.y + offsetY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();

        console.log('Game started');
    }

    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }

    pause() {
        this.isPaused = true;
        this.uiSystem.showPauseMenu();
    }

    resume() {
        this.isPaused = false;
        this.uiSystem.hidePauseMenu();
        this.lastTime = performance.now(); // 시간 재설정
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    restart() {
        this.stop();

        // 모든 시스템 리셋
        this.combatSystem = new CombatSystem();
        this.particleSystem.clear();
        this.animationSystem.clear();

        // 플레이어 재생성
        this.initializeGame();
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        window.DEBUG_MODE = this.debugMode;
        console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // 최대 33ms (30fps)
        this.lastTime = currentTime;

        // FPS 계산
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / this.deltaTime);
        }

        if (!this.isPaused) {
            const updateStart = performance.now();
            this.update();
            this.performance.updateTime = performance.now() - updateStart;
        }

        const renderStart = performance.now();
        this.render();
        this.performance.renderTime = performance.now() - renderStart;
        this.performance.frameTime = performance.now() - currentTime;

        requestAnimationFrame(this.gameLoop);
    }

    update() {
        // 입력 처리
        this.handleInput();

        // 시스템 업데이트
        this.animationSystem.updateAll(this.deltaTime);
        this.particleSystem.update(this.deltaTime);
        this.combatSystem.update(this.deltaTime);

        // 카메라 업데이트
        this.updateCamera();

        // UI 업데이트
        this.updateUI();

        // 게임 상태 체크
        this.checkGameState();
    }

    handleInput() {
        this.inputManager.update();

        // 플레이어 입력 처리
        if (this.player1 && this.player1.active) {
            this.handlePlayerInput(this.player1, 'player1');
        }

        if (this.player2 && this.player2.active) {
            this.handlePlayerInput(this.player2, 'player2');
        }
    }

    handlePlayerInput(player, playerId) {
        const input = this.inputManager.getPlayerInput(playerId);
        if (!input) return;

        // 이동 입력
        if (input.left) {
            player.moveLeft(this.deltaTime);
        } else if (input.right) {
            player.moveRight(this.deltaTime);
        } else if (player.state === 'walk') {
            player.setState('idle');
        }

        // 점프
        if (input.up) {
            player.jump();
        }

        // 가드
        player.guard(input.guard);

        // 공격
        if (input.punch) {
            const success = player.punch();
            if (success) {
                this.audioManager.playSound('punch');
                this.camera.shake = 5;
            }
        }

        if (input.kick) {
            const success = player.kick();
            if (success) {
                this.audioManager.playSound('kick');
                this.camera.shake = 7;
            }
        }

        if (input.ki) {
            const kiAttack = player.kiBlast();
            if (kiAttack) {
                this.combatSystem.createSpecialAttack(kiAttack);
                this.audioManager.playSound('ki_blast');
            }
        }

        // 특수 공격 처리
        const specialInput = player.handleSpecialInput ? player.handleSpecialInput(input) : null;
        if (specialInput) {
            this.handleSpecialAttack(player, specialInput);
        }
    }

    handleSpecialAttack(player, attackData) {
        if (attackData.type === 'kamehameha') {
            this.combatSystem.createSpecialAttack(attackData);
            this.audioManager.playSound('kamehameha');
            this.camera.shake = 15;
            this.particleSystem.createEffect('explosion', attackData.position);
        } else if (attackData.type === 'galickGun') {
            this.combatSystem.createSpecialAttack(attackData);
            this.audioManager.playSound('galick_gun');
            this.camera.shake = 12;
        } else if (attackData.type === 'kiCharge') {
            this.particleSystem.createEffect('kiCharge', attackData.position);
            this.audioManager.playSound('charge');
        }
    }

    updateCamera() {
        // 플레이어들 중점을 따라가는 카메라
        if (this.player1 && this.player2) {
            const centerX = (this.player1.position.x + this.player2.position.x) / 2;
            const targetCameraX = centerX - this.stage.width / 2;

            this.camera.x += (targetCameraX - this.camera.x) * 0.1;
            this.camera.x = Math.max(-100, Math.min(100, this.camera.x));
        }

        // 카메라 흔들림 감소
        if (this.camera.shake > 0) {
            this.camera.shake *= this.camera.shakeDecay;
            if (this.camera.shake < 0.5) {
                this.camera.shake = 0;
            }
        }
    }

    updateUI() {
        // 플레이어 정보 업데이트
        if (this.player1) {
            this.uiSystem.updatePlayer(1, {
                health: this.player1.health,
                maxHealth: this.player1.maxHealth,
                ki: this.player1.ki,
                maxKi: this.player1.maxKi,
                name: this.player1.name,
                superSaiyan: this.player1.superSaiyan,
                stunned: this.player1.stunned,
                invulnerable: this.player1.invulnerable
            });

            // 콤보 표시
            if (this.player1.comboCount > 1) {
                this.uiSystem.showCombo(1, this.player1.comboCount);
            }
        }

        if (this.player2) {
            this.uiSystem.updatePlayer(2, {
                health: this.player2.health,
                maxHealth: this.player2.maxHealth,
                ki: this.player2.ki,
                maxKi: this.player2.maxKi,
                name: this.player2.name,
                superSaiyan: this.player2.superSaiyan,
                stunned: this.player2.stunned,
                invulnerable: this.player2.invulnerable
            });

            // 콤보 표시
            if (this.player2.comboCount > 1) {
                this.uiSystem.showCombo(2, this.player2.comboCount);
            }
        }

        // 타이머 업데이트
        if (this.combatSystem.matchStarted && !this.combatSystem.matchEnded) {
            this.uiSystem.updateTimer(this.combatSystem.matchTime);
        }
    }

    checkGameState() {
        // 매치 종료 체크
        if (this.combatSystem.matchEnded && this.gameState === 'playing') {
            this.gameState = 'gameOver';

            const winner = this.combatSystem.winner;
            const loser = winner === this.player1 ? this.player2 : this.player1;

            this.uiSystem.showResult(winner, loser);
            this.audioManager.playMusic('victory_theme');
        }
    }

    render() {
        // 화면 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // 카메라 변환 적용
        this.applyCameraTransform();

        // 배경 렌더링
        if (this.background) {
            this.background.draw(this.ctx);
        }

        // 플레이어들 렌더링
        if (this.player1) {
            this.player1.render(this.ctx);
        }

        if (this.player2) {
            this.player2.render(this.ctx);
        }

        // 공격들 렌더링
        this.combatSystem.attacks.forEach(attack => {
            attack.render(this.ctx);
        });

        // 파티클 렌더링
        this.particleSystem.render(this.ctx);

        // 히트 이펙트 렌더링
        this.renderHitEffects();

        this.ctx.restore();

        // 디버그 정보 렌더링
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }

    applyCameraTransform() {
        // 카메라 흔들림
        if (this.camera.shake > 0) {
            const shakeX = (Math.random() - 0.5) * this.camera.shake;
            const shakeY = (Math.random() - 0.5) * this.camera.shake;
            this.ctx.translate(shakeX, shakeY);
        }

        // 카메라 이동
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 줌 (필요시)
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
    }

    renderHitEffects() {
        this.combatSystem.hitEffects.forEach(effect => {
            this.ctx.save();

            const alpha = effect.lifetime / effect.maxLifetime;
            this.ctx.globalAlpha = alpha;

            // 히트 이펙트 파티클들
            effect.particles.forEach(particle => {
                const particleAlpha = particle.life / particle.maxLife;
                this.ctx.globalAlpha = alpha * particleAlpha;

                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.restore();
        });
    }

    renderDebugInfo() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 카메라 변환 무시

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 150);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';

        const debugInfo = [
            `FPS: ${this.fps}`,
            `Frame Time: ${this.performance.frameTime.toFixed(2)}ms`,
            `Update Time: ${this.performance.updateTime.toFixed(2)}ms`,
            `Render Time: ${this.performance.renderTime.toFixed(2)}ms`,
            `Particles: ${this.particleSystem.getDebugInfo().particles}`,
            `Attacks: ${this.combatSystem.attacks.length}`,
            `Game State: ${this.gameState}`,
            `Camera Shake: ${this.camera.shake.toFixed(1)}`,
            `P1 Health: ${this.player1 ? this.player1.health.toFixed(0) : 'N/A'}`,
            `P2 Health: ${this.player2 ? this.player2.health.toFixed(0) : 'N/A'}`
        ];

        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 20, 30 + index * 14);
        });

        this.ctx.restore();
    }

    // 외부 인터페이스
    getPlayer(playerId) {
        return playerId === 1 ? this.player1 : this.player2;
    }

    // 게임 상태 정보
    getGameState() {
        return {
            state: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fps: this.fps,
            matchTime: this.combatSystem.matchTime,
            winner: this.combatSystem.winner
        };
    }
}

// 전역 접근을 위해 window에 할당
window.GameEngine = GameEngine;
