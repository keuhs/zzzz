// 메인 진입점 - 게임 시작
let gameEngine;

// DOM 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐉 드래곤볼 파이터 - 2D 격투 게임 시작!');

    // 게임 엔진 초기화
    gameEngine = new GameEngine('gameCanvas');

    // 전역 접근을 위해 window에 할당
    window.gameEngine = gameEngine;

    // 사운드 사전 로드 (실제 파일이 없으므로 더미 사운드 생성)
    const soundsToLoad = [
        'punch', 'kick', 'ki_blast', 'kamehameha', 'galick_gun',
        'hit', 'guard', 'jump', 'power_up', 'explosion', 'charge'
    ];

    Promise.all(soundsToLoad.map(sound => gameEngine.audioManager.loadSound(sound)))
        .then(() => {
            console.log('🎵 오디오 시스템 준비 완료');
        })
        .catch(error => {
            console.warn('오디오 로드 중 일부 오류 발생:', error);
        });

    // 게임 시작 메시지
    displayWelcomeMessage();

    // 키보드 도움말 표시
    displayControlsInfo();

    // 성능 모니터링 (개발용)
    if (window.location.hash === '#debug') {
        gameEngine.toggleDebugMode();
        startPerformanceMonitoring();
    }

    console.log('✨ 게임 초기화 완료! 준비되면 카운트다운이 시작됩니다.');
});

// 환영 메시지 표시
function displayWelcomeMessage() {
    const title = document.querySelector('#gameTitle');
    if (title) {
        title.style.animation = 'glow 2s ease-in-out infinite alternate';
        title.style.textShadow = '0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ffd700';
    }

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glow {
            from {
                text-shadow: 0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ffd700;
            }
            to {
                text-shadow: 0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ffd700, 0 0 50px #ffd700, 0 0 60px #ffd700;
            }
        }

        .control-group {
            transition: all 0.3s ease;
        }

        .control-group:hover {
            background: rgba(255, 215, 0, 0.1);
            transform: scale(1.05);
        }

        #gameContainer:hover {
            transform: scale(1.02);
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// 컨트롤 정보 개선
function displayControlsInfo() {
    const controlsDiv = document.querySelector('#controls');
    if (controlsDiv) {
        controlsDiv.innerHTML = `
            <div class="control-group">
                <strong>🥊 Player 1 (고쿠):</strong><br>
                WASD - 이동 | F - 펀치 | G - 킥 | H - 기공파 | Space - 가드<br>
                <small>H 길게 누르기 - 카메하메하 차징</small>
            </div>
            <div class="control-group">
                <strong>👑 Player 2 (베지터):</strong><br>
                방향키 - 이동 | 1 - 펀치 | 2 - 킥 | 3 - 갤릭포 | Enter - 가드<br>
                <small>1+2 동시 - 빅뱅 어택</small>
            </div>
            <div class="control-group">
                <strong>⚡ 특수 조작:</strong><br>
                Esc - 일시정지 | F1 - 디버그 모드 | F5 - 재시작
            </div>
            <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
                💡 팁: 기를 모아서 더 강한 공격을 사용하세요! 가드로 데미지를 줄일 수 있습니다.
            </div>
        `;
    }
}

// 성능 모니터링 (개발용)
function startPerformanceMonitoring() {
    setInterval(() => {
        if (gameEngine) {
            const state = gameEngine.getGameState();
            const performance = gameEngine.performance;

            console.log(`🔧 Performance - FPS: ${state.fps}, Frame: ${performance.frameTime.toFixed(2)}ms, Update: ${performance.updateTime.toFixed(2)}ms, Render: ${performance.renderTime.toFixed(2)}ms`);
        }
    }, 5000); // 5초마다 로그
}

// 전역 함수들 (콘솔에서 사용 가능)
window.restartGame = function() {
    if (gameEngine) {
        gameEngine.restart();
        console.log('🔄 게임 재시작');
    }
};

window.toggleDebug = function() {
    if (gameEngine) {
        gameEngine.toggleDebugMode();
        console.log('🐛 디버그 모드 토글');
    }
};

window.getGameInfo = function() {
    if (gameEngine) {
        const state = gameEngine.getGameState();
        const p1 = gameEngine.getPlayer(1);
        const p2 = gameEngine.getPlayer(2);

        console.log('🎮 게임 정보:');
        console.log('상태:', state);
        console.log('Player 1:', p1 ? {
            name: p1.name,
            health: p1.health,
            ki: p1.ki,
            position: p1.position,
            state: p1.state
        } : 'None');
        console.log('Player 2:', p2 ? {
            name: p2.name,
            health: p2.health,
            ki: p2.ki,
            position: p2.position,
            state: p2.state
        } : 'None');

        return { state, p1, p2 };
    }
};

// 브라우저 가시성 변경 시 일시정지
document.addEventListener('visibilitychange', function() {
    if (gameEngine && gameEngine.isRunning) {
        if (document.hidden) {
            console.log('⏸️ 브라우저가 숨겨져서 게임 일시정지');
            gameEngine.pause();
        }
    }
});

// 창 크기 변경 시 캔버스 조정 (선택사항)
window.addEventListener('resize', function() {
    // 반응형 디자인을 위한 캔버스 조정 로직
    // 현재는 고정 크기이므로 생략
});

// 에러 핸들링
window.addEventListener('error', function(event) {
    console.error('💥 게임 에러:', event.error);

    // 게임이 실행 중이면 일시정지
    if (gameEngine && gameEngine.isRunning) {
        gameEngine.pause();
    }
});

// 개발자 콘솔 메시지
console.log(`
🐉 드래곤볼 파이터 - 개발자 콘솔
================================

사용 가능한 명령어:
- restartGame()     : 게임 재시작
- toggleDebug()     : 디버그 모드 토글
- getGameInfo()     : 현재 게임 상태 조회
- gameEngine        : 게임 엔진 직접 접근

디버그 모드는 URL에 #debug를 추가하거나 F1 키로 활성화하세요.

즐거운 게임 되세요! 🥊
`);

// 게임 팁 표시 (일정 시간 후)
setTimeout(() => {
    if (gameEngine && gameEngine.gameState === 'playing') {
        console.log('💡 게임 팁: 상대방의 공격 패턴을 파악하고 적절한 타이밍에 가드와 반격을 활용하세요!');
    }
}, 30000); // 30초 후
