// GameObject - 모든 게임 오브젝트의 기본 클래스
class GameObject {
    constructor(x = 0, y = 0) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.rotation = 0;
        this.scale = new Vector2(1, 1);

        this.width = 0;
        this.height = 0;
        this.radius = 0; // 원형 충돌체용

        this.active = true;
        this.visible = true;

        // 물리 속성
        this.mass = 1;
        this.friction = 0.8;
        this.bounce = 0.3;
        this.gravity = 0;

        // 게임 속성
        this.health = 100;
        this.maxHealth = 100;
        this.team = 0;

        // 애니메이션
        this.currentAnimation = null;
        this.animationTime = 0;

        // 타이머와 상태
        this.timers = new Map();
        this.tags = new Set();
    }

    // 업데이트 (매 프레임 호출)
    update(deltaTime) {
        if (!this.active) return;

        // 물리 계산
        this.velocity = this.velocity.add(this.acceleration.multiply(deltaTime));
        this.position = this.position.add(this.velocity.multiply(deltaTime));

        // 중력 적용
        if (this.gravity !== 0) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // 마찰 적용
        this.velocity = this.velocity.multiply(Math.pow(this.friction, deltaTime));

        // 가속도 초기화
        this.acceleration.set(0, 0);

        // 타이머 업데이트
        this.updateTimers(deltaTime);

        // 애니메이션 업데이트
        this.updateAnimation(deltaTime);
    }

    // 렌더링
    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale.x, this.scale.y);

        this.draw(ctx);

        ctx.restore();
    }

    // 실제 그리기 (하위 클래스에서 구현)
    draw(ctx) {
        // 기본 박스 그리기
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    // 힘 적용
    applyForce(force) {
        const f = force.multiply(1 / this.mass);
        this.acceleration = this.acceleration.add(f);
    }

    // 충돌 영역 (AABB)
    getBounds() {
        return {
            left: this.position.x - this.width / 2,
            right: this.position.x + this.width / 2,
            top: this.position.y - this.height / 2,
            bottom: this.position.y + this.height / 2
        };
    }

    // 중심점
    getCenter() {
        return this.position.copy();
    }

    // 충돌 감지
    intersects(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();

        return bounds1.left < bounds2.right &&
               bounds1.right > bounds2.left &&
               bounds1.top < bounds2.bottom &&
               bounds1.bottom > bounds2.top;
    }

    // 원형 충돌 감지
    circleIntersects(other) {
        const distance = this.position.distance(other.position);
        return distance < (this.radius + other.radius);
    }

    // 데미지 받기
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        return this.health <= 0;
    }

    // 힐링
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // 타이머 설정
    setTimer(name, duration, callback) {
        this.timers.set(name, {
            duration: duration,
            elapsed: 0,
            callback: callback,
            active: true
        });
    }

    // 타이머 업데이트
    updateTimers(deltaTime) {
        for (const [name, timer] of this.timers) {
            if (!timer.active) continue;

            timer.elapsed += deltaTime;
            if (timer.elapsed >= timer.duration) {
                timer.callback();
                this.timers.delete(name);
            }
        }
    }

    // 타이머 제거
    clearTimer(name) {
        this.timers.delete(name);
    }

    // 태그 추가/제거
    addTag(tag) {
        this.tags.add(tag);
    }

    removeTag(tag) {
        this.tags.delete(tag);
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    // 애니메이션 업데이트
    updateAnimation(deltaTime) {
        if (this.currentAnimation) {
            this.animationTime += deltaTime;
        }
    }

    // 파괴
    destroy() {
        this.active = false;
        this.timers.clear();
    }

    // 화면 경계 체크
    isInBounds(screenWidth, screenHeight) {
        const bounds = this.getBounds();
        return bounds.right >= 0 && bounds.left <= screenWidth &&
               bounds.bottom >= 0 && bounds.top <= screenHeight;
    }
}
