// 베지터 캐릭터
class Vegeta extends Character {
    constructor(x, y, playerId) {
        super(x, y, playerId);

        // 베지터만의 특성
        this.name = '베지터';
        this.power = 65; // 고쿠보다 약간 강함
        this.speed = 320; // 고쿠보다 약간 느림
        this.jumpPower = 500;

        // 베지터 색상
        this.primaryColor = '#000080'; // 네이비 블루 아머
        this.secondaryColor = '#ffffff'; // 흰색 부츠/장갑
        this.skinColor = '#ffdbac';
        this.hairColor = '#000000';

        // 베지터 특수 기술
        this.galickGunCharging = false;
        this.galickGunCharge = 0;
        this.bigBangAttackCooldown = 0;
        this.prideBoost = 1.0; // 체력이 낮을수록 증가

        // 변신 상태
        this.majorVegeta = false;
        this.superSaiyan = false;
        this.finalFlash = false;

        // 추가 애니메이션
        this.animations.galickGun = { frames: 5, speed: 0.18 };
        this.animations.bigBang = { frames: 6, speed: 0.12 };
        this.animations.finalFlash = { frames: 8, speed: 0.1 };
        this.animations.pride = { frames: 3, speed: 0.2 };
    }

    update(deltaTime) {
        super.update(deltaTime);

        // 갤릭포 차징
        if (this.galickGunCharging) {
            this.galickGunCharge += deltaTime;
            this.ki = Math.max(0, this.ki - 25 * deltaTime);

            if (this.ki <= 0) {
                this.galickGunCharging = false;
                this.galickGunCharge = 0;
            }
        }

        // 빅뱅 어택 쿨다운
        if (this.bigBangAttackCooldown > 0) {
            this.bigBangAttackCooldown -= deltaTime;
        }

        // 프라이드 부스트 (체력이 낮을수록 강해짐)
        const healthRatio = this.health / this.maxHealth;
        this.prideBoost = 1.0 + (1.0 - healthRatio) * 0.5; // 최대 50% 증가

        // 베지터 상태에서 오라 활성화
        this.auraActive = this.superSaiyan || this.galickGunCharging || this.finalFlash;
    }

    // 베지터의 특수 공격
    performSpecialAttack() {
        if (this.ki >= 60) {
            // 파이널 플래시
            this.finalFlash = true;
            this.ki -= 60;
            this.setState('attack');

            return {
                type: 'finalFlashStart',
                position: this.position.copy(),
                direction: new Vector2(this.facing, 0)
            };
        }
        return null;
    }

    // 갤릭포
    galickGun() {
        if (this.ki < 40) return null;

        this.galickGunCharging = true;
        this.galickGunCharge = 0;
        this.ki -= 40;
        this.setState('attack');

        return {
            type: 'galickGunStart',
            position: this.position.copy(),
            direction: new Vector2(this.facing, 0)
        };
    }

    // 갤릭포 발사
    releaseGalickGun() {
        if (!this.galickGunCharging) return null;

        const chargeRatio = Math.min(this.galickGunCharge / 1.5, 1.0); // 1.5초 최대 차징
        const damage = 35 + (chargeRatio * 45) * this.prideBoost; // 프라이드 부스트 적용

        this.galickGunCharging = false;
        this.galickGunCharge = 0;

        return {
            type: 'galickGun',
            position: this.position.add(new Vector2(this.facing * 30, -15)),
            direction: new Vector2(this.facing, -0.2), // 약간 위로
            damage: damage,
            speed: 350,
            color: '#9900ff' // 보라색
        };
    }

    // 빅뱅 어택
    bigBangAttack() {
        if (this.bigBangAttackCooldown > 0 || this.ki < 50) return null;

        this.ki -= 50;
        this.bigBangAttackCooldown = 4.0;
        this.setState('attack');

        const damage = 60 * this.prideBoost;

        return {
            type: 'bigBangAttack',
            position: this.position.add(new Vector2(this.facing * 20, -20)),
            damage: damage,
            range: 100,
            knockback: new Vector2(this.facing * 300, -150)
        };
    }

    // 슈퍼 사이어인 변신
    transformSuperSaiyan() {
        if (this.ki < 90 || this.superSaiyan) return false;

        this.ki -= 90;
        this.superSaiyan = true;

        // 베지터는 고쿠보다 더 큰 변화
        this.power *= 1.6;
        this.speed *= 1.3;
        this.maxHealth *= 1.4;
        this.health = this.maxHealth;

        // 외형 변화
        this.hairColor = '#ffff00';

        this.setState('transform');

        return {
            type: 'superSaiyanTransform',
            position: this.position.copy(),
            character: 'vegeta'
        };
    }

    // 파이널 플래시 발사
    releaseFinalFlash() {
        if (!this.finalFlash) return null;

        this.finalFlash = false;

        const damage = 80 * this.prideBoost;

        return {
            type: 'finalFlash',
            position: this.position.add(new Vector2(this.facing * 40, -10)),
            direction: new Vector2(this.facing, 0),
            damage: damage,
            width: 60,
            height: 30,
            speed: 400,
            duration: 2.0
        };
    }

    // 베지터만의 그리기
    drawCharacter(ctx) {
        // 슈퍼 사이어인 상태
        if (this.superSaiyan) {
            this.hairColor = '#ffff00';

            // 베지터의 더 날카로운 오라
            if (this.auraActive) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#0066ff';

                // 각진 오라 모양
                const time = Date.now() * 0.015;
                ctx.translate(0, Math.sin(time) * 3);

                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + time;
                    const x = Math.cos(angle) * 40;
                    const y = Math.sin(angle) * 50;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(x, y);
                    ctx.lineTo(x * 1.2, y * 1.2);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        // 기본 캐릭터 그리기
        this.drawVegetaBody(ctx);

        // 갤릭포 차징 이펙트
        if (this.galickGunCharging) {
            this.drawGalickGunCharge(ctx);
        }

        // 파이널 플래시 준비
        if (this.finalFlash) {
            this.drawFinalFlashPrep(ctx);
        }
    }

    drawVegetaBody(ctx) {
        // 사이어인 아머
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height * 0.7);

        // 어깨 보호대
        ctx.fillStyle = '#666666';
        ctx.fillRect(-this.width / 2 - 5, -this.height / 2, 15, 20);
        ctx.fillRect(this.width / 2 - 10, -this.height / 2, 15, 20);

        // 머리
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(-this.width / 2 + 10, -this.height / 2 - 20, this.width - 20, 25);

        // 베지터의 특징적인 헤어라인 (M자)
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 8, -this.height / 2 - 20);
        ctx.lineTo(-this.width / 2 + 15, -this.height / 2 - 25);
        ctx.lineTo(-5, -this.height / 2 - 30);
        ctx.lineTo(0, -this.height / 2 - 28);
        ctx.lineTo(5, -this.height / 2 - 30);
        ctx.lineTo(this.width / 2 - 15, -this.height / 2 - 25);
        ctx.lineTo(this.width / 2 - 8, -this.height / 2 - 20);
        ctx.lineTo(this.width / 2 - 10, -this.height / 2 - 15);
        ctx.lineTo(-this.width / 2 + 10, -this.height / 2 - 15);
        ctx.closePath();
        ctx.fill();

        // 장갑과 부츠
        ctx.fillStyle = this.secondaryColor;

        // 장갑
        if (this.state === 'attack') {
            ctx.fillRect(this.width / 2 - 5, -this.height / 2 + 10, 30, 18);
        } else {
            ctx.fillRect(-this.width / 2 - 10, -this.height / 2 + 10, 18, 30);
            ctx.fillRect(this.width / 2 - 8, -this.height / 2 + 10, 18, 30);
        }

        // 부츠
        ctx.fillRect(-this.width / 2 + 8, this.height / 2 - 8, 20, 15);
        ctx.fillRect(this.width / 2 - 28, this.height / 2 - 8, 20, 15);

        // 스카우터 (오른쪽 눈)
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.width / 2 - 20, -this.height / 2 - 10, 12, 3);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.width / 2 - 18, -this.height / 2 - 9, 2, 1);
    }

    drawGalickGunCharge(ctx) {
        const chargeRatio = Math.min(this.galickGunCharge / 1.5, 1.0);
        const size = 12 + chargeRatio * 18;

        ctx.save();
        ctx.globalAlpha = 0.7 + chargeRatio * 0.3;

        // 보라색 기 구체
        const gradient = ctx.createRadialGradient(
            this.facing * 25, -15, 0,
            this.facing * 25, -15, size
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#9900ff');
        gradient.addColorStop(1, '#330066');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.facing * 25, -15, size, 0, Math.PI * 2);
        ctx.fill();

        // 프라이드 파워 (체력이 낮을수록 더 강렬)
        if (this.prideBoost > 1.2) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.globalAlpha = (this.prideBoost - 1.0) * 2;

            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.02 + i * Math.PI * 2 / 3;
                const radius = size * 1.5;

                ctx.beginPath();
                ctx.arc(this.facing * 25, -15, radius, angle, angle + 0.3);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawFinalFlashPrep(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.8;

        // 양손에서 나오는 황금빛 에너지
        const time = Date.now() * 0.01;

        // 왼손
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-15, -5, 8 + Math.sin(time) * 3, 0, Math.PI * 2);
        ctx.fill();

        // 오른손
        ctx.beginPath();
        ctx.arc(15, -5, 8 + Math.sin(time + 1) * 3, 0, Math.PI * 2);
        ctx.fill();

        // 중앙에 모이는 에너지
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -10, 5 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 추가 입력 처리
    handleSpecialInput(input) {
        if (input.special && this.ki >= 60) {
            return this.performSpecialAttack();
        }

        // 갤릭포
        if (input.ki && this.ki >= 40 && !this.galickGunCharging) {
            return this.galickGun();
        }

        // 갤릭포 차징 중에 키를 떼면 발사
        if (this.galickGunCharging && !input.kiHold) {
            return this.releaseGalickGun();
        }

        // 빅뱅 어택 (펀치 + 킥 동시)
        if (input.punch && input.kick && this.bigBangAttackCooldown <= 0) {
            return this.bigBangAttack();
        }

        return null;
    }

    // 베지터의 대사
    getVictoryQuote() {
        const quotes = [
            "크하하! 당연한 결과다!",
            "사이어인의 왕자를 누구라고 생각하는가!",
            "이 정도로 나를 이길 수 있다고 생각했나?",
            "약골은 강자의 발밑에서 기어야 한다!"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    getDefeatQuote() {
        const quotes = [
            "말도 안 돼... 이 베지터가...",
            "크... 사이어인의 왕자가...",
            "다음엔... 다음엔 반드시...",
            "이런... 모욕을..."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    // 베지터만의 특별한 반격 (체력이 낮을 때)
    desperateAttack() {
        if (this.health > this.maxHealth * 0.3) return null;

        this.ki = Math.min(this.maxKi, this.ki + 50); // 급속 기 회복
        this.power *= 1.5; // 일시적 파워 부스트

        this.setTimer('desperateBoost', 5.0, () => {
            this.power /= 1.5;
        });

        return {
            type: 'desperateMode',
            position: this.position.copy()
        };
    }
}
