// 고쿠 캐릭터
class Goku extends Character {
    constructor(x, y, playerId) {
        super(x, y, playerId);

        // 고쿠만의 특성
        this.name = '고쿠';
        this.power = 60;
        this.speed = 350;
        this.jumpPower = 550;

        // 고쿠 색상
        this.primaryColor = '#ff6600'; // 주황색 도복
        this.secondaryColor = '#0066ff'; // 파란색 벨트
        this.skinColor = '#ffdbac';
        this.hairColor = '#000000';

        // 고쿠 특수 기술
        this.kamehamehaCharging = false;
        this.kamehamehaCharge = 0;
        this.instantTransmissionCooldown = 0;

        // 변신 상태
        this.superSaiyan = false;
        this.superSaiyanLevel = 0;

        // 추가 애니메이션
        this.animations.kamehameha = { frames: 6, speed: 0.2 };
        this.animations.charge = { frames: 4, speed: 0.15 };
        this.animations.transform = { frames: 8, speed: 0.1 };
    }

    update(deltaTime) {
        super.update(deltaTime);

        // 카메하메하 차징
        if (this.kamehamehaCharging) {
            this.kamehamehaCharge += deltaTime;
            this.ki = Math.max(0, this.ki - 30 * deltaTime); // 기 소모

            if (this.ki <= 0) {
                this.kamehamehaCharging = false;
                this.kamehamehaCharge = 0;
            }
        }

        // 순간이동 쿨다운
        if (this.instantTransmissionCooldown > 0) {
            this.instantTransmissionCooldown -= deltaTime;
        }

        // 슈퍼 사이어인 상태에서 오라 활성화
        this.auraActive = this.superSaiyan || this.kamehamehaCharging;
    }

    // 고쿠의 특수 공격
    performSpecialAttack() {
        // 카메하메하
        if (this.ki >= 50) {
            this.kamehamehaCharging = true;
            this.kamehamehaCharge = 0;
            this.setState('attack');

            return {
                type: 'kamehamehaStart',
                position: this.position.copy(),
                direction: new Vector2(this.facing, 0)
            };
        }
        return null;
    }

    // 카메하메하 발사
    releaseKamehameha() {
        if (!this.kamehamehaCharging) return null;

        const chargeRatio = Math.min(this.kamehamehaCharge / 2.0, 1.0); // 2초 최대 차징
        const damage = 40 + (chargeRatio * 60); // 40~100 데미지
        const size = 1.0 + chargeRatio; // 크기 증가

        this.kamehamehaCharging = false;
        this.kamehamehaCharge = 0;

        return {
            type: 'kamehameha',
            position: this.position.add(new Vector2(this.facing * 30, -10)),
            direction: new Vector2(this.facing, 0),
            damage: damage,
            size: size,
            speed: 300 + (chargeRatio * 200)
        };
    }

    // 순간이동
    instantTransmission(targetPosition) {
        if (this.instantTransmissionCooldown > 0 || this.ki < 30) return false;

        this.ki -= 30;
        this.position = targetPosition.copy();
        this.instantTransmissionCooldown = 3.0;

        // 순간이동 이펙트
        return {
            type: 'instantTransmission',
            fromPosition: this.position.copy(),
            toPosition: targetPosition.copy()
        };
    }

    // 슈퍼 사이어인 변신
    transformSuperSaiyan() {
        if (this.ki < 80 || this.superSaiyan) return false;

        this.ki -= 80;
        this.superSaiyan = true;
        this.superSaiyanLevel = 1;

        // 능력치 증가
        this.power *= 1.5;
        this.speed *= 1.2;
        this.maxHealth *= 1.3;
        this.health = this.maxHealth; // 체력 회복

        // 외형 변화
        this.hairColor = '#ffff00'; // 금발

        this.setState('transform');

        return {
            type: 'superSaiyanTransform',
            position: this.position.copy(),
            level: this.superSaiyanLevel
        };
    }

    // 기 충전
    chargeKi(deltaTime) {
        if (this.state !== 'idle' && this.state !== 'guard') return;

        this.setState('charge');
        this.ki = Math.min(this.maxKi, this.ki + 40 * deltaTime);

        // 차징 이펙트
        return {
            type: 'kiCharge',
            position: this.position.copy(),
            intensity: deltaTime
        };
    }

    // 고쿠만의 그리기
    drawCharacter(ctx) {
        // 슈퍼 사이어인 상태일 때 다른 색상
        if (this.superSaiyan) {
            this.hairColor = '#ffff00';

            // 더 강렬한 오라
            if (this.auraActive) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffff00';
                const auraSize = 1.3 + Math.sin(Date.now() * 0.02) * 0.2;
                ctx.scale(auraSize, auraSize);
                ctx.fillRect(-this.width / 2 - 15, -this.height / 2 - 15,
                            this.width + 30, this.height + 30);
                ctx.restore();
            }
        }

        // 기본 캐릭터 그리기
        super.drawCharacter(ctx);

        // 카메하메하 차징 이펙트
        if (this.kamehamehaCharging) {
            this.drawKamehamehaCharge(ctx);
        }

        // 도복의 한자 "亀" (거북이)
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('亀', 0, -this.height / 2 + 25);
    }

    drawKamehamehaCharge(ctx) {
        const chargeRatio = Math.min(this.kamehamehaCharge / 2.0, 1.0);
        const size = 10 + chargeRatio * 20;

        ctx.save();
        ctx.globalAlpha = 0.6 + chargeRatio * 0.4;

        // 기 구체
        const gradient = ctx.createRadialGradient(
            this.facing * 25, -10, 0,
            this.facing * 25, -10, size
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#00aaff');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.facing * 25, -10, size, 0, Math.PI * 2);
        ctx.fill();

        // 전기 효과
        if (chargeRatio > 0.5) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = (Date.now() * 0.01 + i) * Math.PI / 3;
                const x1 = this.facing * 25 + Math.cos(angle) * size * 0.8;
                const y1 = -10 + Math.sin(angle) * size * 0.8;
                const x2 = this.facing * 25 + Math.cos(angle) * size * 1.2;
                const y2 = -10 + Math.sin(angle) * size * 1.2;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // 추가 입력 처리
    handleSpecialInput(input) {
        if (input.special && this.ki >= 50) {
            return this.performSpecialAttack();
        }

        // 카메하메하 차징 중에 키를 떼면 발사
        if (this.kamehamehaCharging && !input.kiHold) {
            return this.releaseKamehameha();
        }

        // 기 충전 (가드 키 길게 누르기)
        if (input.guard && input.down) {
            return this.chargeKi(1/60); // 60fps 기준
        }

        return null;
    }

    // 고쿠의 대사
    getVictoryQuote() {
        const quotes = [
            "오라, 더 강해져라!",
            "훌륭한 싸움이었다!",
            "아직 더 강해질 수 있어!",
            "다음엔 더 재미있게 싸우자!"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    getDefeatQuote() {
        const quotes = [
            "크... 아직 수련이 부족해...",
            "다음엔 꼭 이길 거야!",
            "더... 더 강해져야 해...",
            "좋은 경험이었어!"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
}
