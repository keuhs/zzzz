// 입력 관리자 - 키보드와 게임패드 입력 처리
class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        this.mousePosition = new Vector2(0, 0);
        this.mouseButtons = {};
        this.previousMouseButtons = {};

        // 게임패드 지원
        this.gamepads = {};

        // 키 매핑
        this.keyMappings = {
            // Player 1
            player1: {
                left: 'KeyA',
                right: 'KeyD',
                up: 'KeyW',
                down: 'KeyS',
                punch: 'KeyF',
                kick: 'KeyG',
                ki: 'KeyH',
                guard: 'Space',
                special: 'KeyT'
            },
            // Player 2
            player2: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                up: 'ArrowUp',
                down: 'ArrowDown',
                punch: 'Digit1',
                kick: 'Digit2',
                ki: 'Digit3',
                guard: 'Enter',
                special: 'Digit4'
            }
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            event.preventDefault();
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            event.preventDefault();
        });

        // 마우스 이벤트
        document.addEventListener('mousemove', (event) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
        });

        document.addEventListener('mousedown', (event) => {
            this.mouseButtons[event.button] = true;
            event.preventDefault();
        });

        document.addEventListener('mouseup', (event) => {
            this.mouseButtons[event.button] = false;
            event.preventDefault();
        });

        // 컨텍스트 메뉴 비활성화
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // 포커스 잃을 때 모든 키 해제
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouseButtons = {};
        });
    }

    // 매 프레임 호출 - 이전 상태 저장
    update() {
        this.previousKeys = { ...this.keys };
        this.previousMouseButtons = { ...this.mouseButtons };
        this.updateGamepads();
    }

    // 키가 현재 눌려있는지
    isKeyDown(keyCode) {
        return !!this.keys[keyCode];
    }

    // 키가 방금 눌렸는지 (이전 프레임에는 안 눌려있고 현재는 눌려있음)
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode] && !this.previousKeys[keyCode];
    }

    // 키가 방금 떼어졌는지
    isKeyReleased(keyCode) {
        return !this.keys[keyCode] && !!this.previousKeys[keyCode];
    }

    // 플레이어별 입력 체크
    getPlayerInput(playerId) {
        const mapping = this.keyMappings[playerId];
        if (!mapping) return null;

        return {
            // 방향 입력
            left: this.isKeyDown(mapping.left),
            right: this.isKeyDown(mapping.right),
            up: this.isKeyDown(mapping.up),
            down: this.isKeyDown(mapping.down),

            // 액션 입력 (방금 눌렸을 때만)
            punch: this.isKeyPressed(mapping.punch),
            kick: this.isKeyPressed(mapping.kick),
            ki: this.isKeyPressed(mapping.ki),
            guard: this.isKeyDown(mapping.guard),
            special: this.isKeyPressed(mapping.special),

            // 연속 입력용
            punchHold: this.isKeyDown(mapping.punch),
            kickHold: this.isKeyDown(mapping.kick),
            kiHold: this.isKeyDown(mapping.ki)
        };
    }

    // 마우스 입력
    isMouseDown(button = 0) {
        return !!this.mouseButtons[button];
    }

    isMousePressed(button = 0) {
        return !!this.mouseButtons[button] && !this.previousMouseButtons[button];
    }

    isMouseReleased(button = 0) {
        return !this.mouseButtons[button] && !!this.previousMouseButtons[button];
    }

    getMousePosition() {
        return this.mousePosition.copy();
    }

    // 게임패드 업데이트
    updateGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepads[i] = {
                    buttons: gamepads[i].buttons.map(button => button.pressed),
                    axes: [...gamepads[i].axes]
                };
            }
        }
    }

    // 게임패드 입력
    isGamepadButtonDown(gamepadIndex, buttonIndex) {
        const gamepad = this.gamepads[gamepadIndex];
        return gamepad && gamepad.buttons[buttonIndex];
    }

    getGamepadAxis(gamepadIndex, axisIndex) {
        const gamepad = this.gamepads[gamepadIndex];
        return gamepad ? gamepad.axes[axisIndex] : 0;
    }

    // 콤보 입력 감지를 위한 입력 히스토리
    inputHistory = [];
    maxHistoryLength = 60; // 1초 (60fps 기준)

    recordInput(playerId) {
        const input = this.getPlayerInput(playerId);
        this.inputHistory.push({
            playerId: playerId,
            input: input,
            timestamp: Date.now()
        });

        // 히스토리 길이 제한
        if (this.inputHistory.length > this.maxHistoryLength) {
            this.inputHistory.shift();
        }
    }

    // 특정 콤보 패턴 감지
    checkCombo(playerId, pattern, timeWindow = 1000) {
        const now = Date.now();
        const playerInputs = this.inputHistory
            .filter(entry => entry.playerId === playerId && (now - entry.timestamp) <= timeWindow)
            .reverse(); // 최신순으로 정렬

        // 패턴 매칭 로직 (간단한 예시)
        // 실제로는 더 복잡한 패턴 매칭이 필요
        return false; // 구현 필요
    }

    // 입력 히스토리 클리어
    clearInputHistory() {
        this.inputHistory = [];
    }
}
