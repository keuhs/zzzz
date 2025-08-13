// 기본 캐릭터 클래스
class Character extends GameObject {
    constructor(x, y, playerId) {
        super(x, y);

        this.playerId = playerId;
        this.width = 60;
        this.height = 80;
        this.radius = 30;

        // 전투 속성
        this.health = 100;
        this.maxHealth = 100;
        this.ki = 0;
        this.maxKi = 100;
        this.power = 50;

        // 이동 속성
        this.speed = 300;
        this.jumpPower = 500;
        this.airDashCount = 0;
        this.maxAirDash = 2;

        // 상태
        this.state = 'idle';
        this.facing = 1; // 1: 오른쪽, -1: 왼쪽
        this.onGround = false;
        this.invulnerable = false;
        this.blocking = false;
        this.stunned = false;

        // 공격 관련
        this.attackCooldown = 0;
        this.comboCount = 0;
        this.lastAttackTime = 0;

        // 애니메이션
        this.animations = {
            idle: { frames: 4, speed: 0.1 },
            walk: { frames: 6, speed: 0.15 },
            jump: { frames: 3, speed: 0.1 },
            punch: { frames: 3, speed: 0.2 },
            kick: { frames: 4, speed: 0.15 },
            ki: { frames: 5, speed: 0.12 },
            guard: { frames: 2, speed: 0.1 },
            hit: { frames: 2, speed: 0.2 },
            ko: { frames: 4, speed: 0.08 }
        };

        this.currentFrame = 0;
        this.animationTimer = 0;

        // 이펙트
        this.auraActive = false;
        this.poweringUp = false;

        // 히트박스와 허트박스
        this.hitboxes = [];
        this.hurtbox = { x: 0, y: 0, width: this.width, height: this.height };

        // 컬러 (기본값, 하위 클래스에서 오버라이드)
        this.primaryColor = '#ff6600';
        this.secondaryColor = '#0066ff';
        this.skinColor = '#ffdbac';
        this.hairColor = '#000000';
    }

    update(deltaTime) {
        super.update(deltaTime);

        if (!this.active) return;

        // 쿨다운 업데이트
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 기 자동 회복
        if (this.ki < this.maxKi && this.state === 'idle') {
            this.ki = Math.min(this.maxKi, this.ki + 20 * deltaTime);
        }

        // 콤보 타임아웃
        if (Date.now() - this.lastAttackTime > 2000) {
            this.comboCount = 0;
        }

        // 애니메이션 업데이트
        this.updateAnimation(deltaTime);

        // 상태별 업데이트
        this.updateState(deltaTime);

        // 히트박스 클리어 (매 프레임 새로 설정)
        this.hitboxes = [];

        // 무적 시간 체크
        if (this.invulnerable) {
            this.setTimer('invulnerability', 0.5, () => {
                this.invulnerable = false;
            });
        }
    }

    updateState(deltaTime) {
        switch (this.state) {
            case 'idle':
                this.velocity.x *= 0.8; // 마찰
                break;

            case 'walk':
                // 이동 애니메이션은 입력 시스템에서 처리
                break;

            case 'jump':
                if (this.onGround && this.velocity.y >= 0) {
                    this.setState('idle');
                    this.airDashCount = 0;
                }
                break;

            case 'attack':
                // 공격 상태는 타이머로 자동 해제
                break;

            case 'guard':
                this.velocity.x *= 0.9;
                break;

            case 'hit':
                // 피격 상태는 타이머로 자동 해제
                break;

            case 'ko':
                this.velocity.x *= 0.95;
                break;
        }
    }

    setState(newState) {
        if (this.state === newState) return;

        this.state = newState;
        this.currentFrame = 0;
        this.animationTimer = 0;

        // 상태별 특별 처리
        switch (newState) {
            case 'attack':
                this.setTimer('attackDuration', 0.4, () => {
                    this.setState('idle');
                });
                break;

            case 'hit':
                this.stunned = true;
                this.invulnerable = true;
                this.setTimer('hitStun', 0.3, () => {
                    this.stunned = false;
                    this.setState('idle');
                });
                break;

            case 'ko':
                this.velocity.set(0, 0);
                this.health = 0;
                break;
        }
    }

    // 이동
    moveLeft(deltaTime) {
        if (this.stunned) return;

        this.velocity.x = -this.speed;
        this.facing = -1;

        if (this.onGround && this.state !== 'attack') {
            this.setState('walk');
        }
    }

    moveRight(deltaTime) {
        if (this.stunned) return;

        this.velocity.x = this.speed;
        this.facing = 1;

        if (this.onGround && this.state !== 'attack') {
            this.setState('walk');
        }
    }

    jump() {
        if (this.stunned) return;

        if (this.onGround) {
            this.velocity.y = -this.jumpPower;
            this.onGround = false;
            this.setState('jump');
        } else if (this.airDashCount < this.maxAirDash) {
            // 공중 대시
            this.velocity.y = -this.jumpPower * 0.7;
            this.airDashCount++;
        }
    }

    // 가드
    guard(active) {
        if (this.stunned) return;

        this.blocking = active;
        if (active && this.onGround) {
            this.setState('guard');
        } else if (!active && this.state === 'guard') {
            this.setState('idle');
        }
    }

    // 기본 공격
    punch() {
        if (this.stunned || this.attackCooldown > 0) return false;

        this.setState('attack');
        this.attackCooldown = 0.3;
        this.lastAttackTime = Date.now();
        this.comboCount++;

        // 히트박스 생성
        const hitboxX = this.facing > 0 ? this.width / 2 : -this.width / 2 - 40;
        this.hitboxes.push({
            x: hitboxX,
            y: -10,
            width: 40,
            height: 30,
            damage: 10 + this.comboCount * 2,
            knockback: new Vector2(this.facing * 150, -50),
            type: 'punch'
        });

        return true;
    }

    kick() {
        if (this.stunned || this.attackCooldown > 0) return false;

        this.setState('attack');
        this.attackCooldown = 0.4;
        this.lastAttackTime = Date.now();
        this.comboCount++;

        // 히트박스 생성 (킥은 더 넓고 강함)
        const hitboxX = this.facing > 0 ? this.width / 2 : -this.width / 2 - 50;
        this.hitboxes.push({
            x: hitboxX,
            y: 0,
            width: 50,
            height: 40,
            damage: 15 + this.comboCount * 3,
            knockback: new Vector2(this.facing * 200, -80),
            type: 'kick'
        });

        return true;
    }

    // 기 공격
    kiBlast() {
        if (this.stunned || this.ki < 20) return false;

        this.ki -= 20;
        this.setState('attack');
        this.attackCooldown = 0.5;

        // 기 파동 생성 (게임 엔진에서 처리)
        return {
            type: 'kiBlast',
            position: this.position.add(new Vector2(this.facing * 40, -20)),
            direction: new Vector2(this.facing, 0),
            damage: 25,
            speed: 400
        };
    }

    // 특수 공격
    specialAttack() {
        if (this.stunned || this.ki < 50) return false;

        this.ki -= 50;
        this.setState('attack');
        this.attackCooldown = 1.0;

        return this.performSpecialAttack();
    }

    // 하위 클래스에서 구현
    performSpecialAttack() {
        return null;
    }

    // 데미지 받기
    takeDamage(damage, knockback = null, attacker = null) {
        if (this.invulnerable) return false;

        // 가드 처리
        if (this.blocking && attacker) {
            const attackDirection = attacker.position.x > this.position.x ? -1 : 1;
            if (attackDirection === this.facing) {
                // 가드 성공
                damage *= 0.3; // 가드 시 데미지 30%로 감소
                knockback = knockback ? knockback.multiply(0.2) : null;
                this.ki = Math.min(this.maxKi, this.ki + 5); // 가드 시 기 소량 회복
            }
        }

        super.takeDamage(damage);

        // 넉백 적용
        if (knockback) {
            this.velocity = this.velocity.add(knockback);
        }

        // 상태 변경
        if (this.health <= 0) {
            this.setState('ko');
        } else {
            this.setState('hit');
        }

        return true;
    }

    // 애니메이션 업데이트
    updateAnimation(deltaTime) {
        if (!this.animations[this.state]) return;

        const animation = this.animations[this.state];
        this.animationTimer += deltaTime;

        if (this.animationTimer >= animation.speed) {
            this.currentFrame = (this.currentFrame + 1) % animation.frames;
            this.animationTimer = 0;
        }
    }

    // 렌더링
    draw(ctx) {
        ctx.save();

        // 방향에 따라 뒤집기
        if (this.facing < 0) {
            ctx.scale(-1, 1);
        }

        // 무적 시간 깜빡임
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }

        // 캐릭터 그리기
        this.drawCharacter(ctx);

        // 오라 그리기
        if (this.auraActive) {
            this.drawAura(ctx);
        }

        // 히트박스 그리기 (디버그용)
        if (window.DEBUG_MODE) {
            this.drawHitboxes(ctx);
        }

        ctx.restore();
    }

    drawCharacter(ctx) {
        // 기본 캐릭터 (사각형)
        // 몸통
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height * 0.6);

        // 머리
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(-this.width / 2 + 10, -this.height / 2 - 20, this.width - 20, 25);

        // 머리카락
        ctx.fillStyle = this.hairColor;
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 - 25, this.width - 10, 15);

        // 팔
        ctx.fillStyle = this.skinColor;
        if (this.state === 'attack') {
            // 공격 포즈
            ctx.fillRect(this.width / 2 - 5, -this.height / 2 + 10, 25, 15);
        } else {
            // 기본 포즈
            ctx.fillRect(-this.width / 2 - 10, -this.height / 2 + 10, 15, 30);
            ctx.fillRect(this.width / 2 - 5, -this.height / 2 + 10, 15, 30);
        }

        // 다리
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-this.width / 2 + 10, this.height / 2 - 40, 15, 40);
        ctx.fillRect(this.width / 2 - 25, this.height / 2 - 40, 15, 40);

        // 발
        ctx.fillStyle = '#000000';
        ctx.fillRect(-this.width / 2 + 5, this.height / 2 - 5, 25, 10);
        ctx.fillRect(this.width / 2 - 30, this.height / 2 - 5, 25, 10);
    }

    drawAura(ctx) {
        const time = Date.now() * 0.01;
        const auraSize = 1.2 + Math.sin(time) * 0.1;

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.scale(auraSize, auraSize);

        // 오라 색상 (기 레벨에 따라 변화)
        const kiRatio = this.ki / this.maxKi;
        const red = Math.floor(255 * (1 - kiRatio));
        const blue = Math.floor(255 * kiRatio);

        ctx.fillStyle = `rgb(${red}, 100, ${blue})`;
        ctx.fillRect(-this.width / 2 - 10, -this.height / 2 - 10,
                    this.width + 20, this.height + 20);

        ctx.restore();
    }

    drawHitboxes(ctx) {
        // 허트박스 (빨간색)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 히트박스 (파란색)
        ctx.strokeStyle = '#0000ff';
        this.hitboxes.forEach(hitbox => {
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        });
    }

    // 히트박스 충돌 감지
    getHitboxes() {
        return this.hitboxes.map(hitbox => ({
            ...hitbox,
            x: this.position.x + hitbox.x,
            y: this.position.y + hitbox.y
        }));
    }

    // 허트박스 가져오기
    getHurtbox() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // 체력/기 비율
    getHealthRatio() {
        return this.health / this.maxHealth;
    }

    getKiRatio() {
        return this.ki / this.maxKi;
    }

    // 적 방향으로 향하기
    faceOpponent(opponent) {
        if (opponent.position.x > this.position.x) {
            this.facing = 1;
        } else {
            this.facing = -1;
        }
    }
}
