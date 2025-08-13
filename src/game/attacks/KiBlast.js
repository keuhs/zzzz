// 기 파동 공격
class KiBlast extends Attack {
    constructor(x, y, direction, damage, speed, owner, options = {}) {
        super(x, y, damage, new Vector2(direction.x * 100, direction.y * 50), owner);

        this.width = options.width || 20;
        this.height = options.height || 20;
        this.radius = Math.max(this.width, this.height) / 2;

        this.speed = speed || 300;
        this.direction = direction.normalize();
        this.velocity = this.direction.multiply(this.speed);

        // 기 파동 특성
        this.color = options.color || '#00aaff';
        this.glowColor = options.glowColor || '#ffffff';
        this.size = options.size || 1.0;
        this.piercing = options.piercing || false;
        this.homing = options.homing || false;
        this.target = options.target || null;

        // 비주얼 효과
        this.glowIntensity = 1.0;
        this.rotationSpeed = 5.0;
        this.energyTrail = [];

        // 사운드
        this.soundEffect = 'ki_blast';

        this.lifetime = 3.0;
    }

    update(deltaTime) {
        super.update(deltaTime);

        // 호밍 처리
        if (this.homing && this.target && this.target.active) {
            const targetDirection = this.target.position.subtract(this.position).normalize();
            const homingStrength = 2.0;

            this.direction = this.direction.lerp(targetDirection, homingStrength * deltaTime);
            this.velocity = this.direction.multiply(this.speed);
        }

        // 회전
        this.rotation += this.rotationSpeed * deltaTime;

        // 에너지 트레일 생성
        this.energyTrail.push({
            position: this.position.copy(),
            life: 0.5,
            maxLife: 0.5,
            size: this.radius * this.size,
            alpha: 1.0
        });

        // 트레일 업데이트
        this.energyTrail = this.energyTrail.filter(trail => {
            trail.life -= deltaTime;
            trail.alpha = trail.life / trail.maxLife;
            trail.size *= 0.95;
            return trail.life > 0;
        });

        // 글로우 효과 애니메이션
        this.glowIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    }

    createHitEffect(target) {
        return {
            type: 'kiHitEffect',
            position: target.position.copy(),
            damage: this.damage,
            color: this.color,
            size: this.size,
            direction: this.direction.copy()
        };
    }

    draw(ctx) {
        ctx.save();

        // 에너지 트레일 그리기
        this.energyTrail.forEach((trail, index) => {
            ctx.save();
            ctx.globalAlpha = trail.alpha * 0.4;

            const gradient = ctx.createRadialGradient(
                trail.position.x - this.position.x,
                trail.position.y - this.position.y,
                0,
                trail.position.x - this.position.x,
                trail.position.y - this.position.y,
                trail.size
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                trail.position.x - this.position.x,
                trail.position.y - this.position.y,
                trail.size,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        });

        // 메인 기 구체
        ctx.rotate(this.rotation);

        // 외부 글로우
        const glowRadius = this.radius * this.size * 1.5;
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, this.glowColor);
        glowGradient.addColorStop(0.3, this.color);
        glowGradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = this.glowIntensity * 0.6;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 내부 코어
        ctx.globalAlpha = 1.0;
        const coreRadius = this.radius * this.size;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
        coreGradient.addColorStop(0, this.glowColor);
        coreGradient.addColorStop(0.7, this.color);
        coreGradient.addColorStop(1, this.color);

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // 에너지 링
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // 내부 스파크
        if (this.glowIntensity > 0.9) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.rotation * 2;
                const innerRadius = coreRadius * 0.3;
                const outerRadius = coreRadius * 0.7;

                ctx.beginPath();
                ctx.moveTo(
                    Math.cos(angle) * innerRadius,
                    Math.sin(angle) * innerRadius
                );
                ctx.lineTo(
                    Math.cos(angle) * outerRadius,
                    Math.sin(angle) * outerRadius
                );
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // 특수 기 파동들
    static createKamehameha(x, y, direction, damage, size, speed, owner) {
        const kamehameha = new KiBlast(x, y, direction, damage, speed, owner, {
            width: 30 * size,
            height: 30 * size,
            color: '#00aaff',
            glowColor: '#ffffff',
            size: size,
            piercing: true
        });

        kamehameha.lifetime = 4.0;
        kamehameha.knockback = new Vector2(direction.x * 250, direction.y * 100);
        return kamehameha;
    }

    static createGalickGun(x, y, direction, damage, owner) {
        const galickGun = new KiBlast(x, y, direction, damage, 350, owner, {
            color: '#9900ff',
            glowColor: '#ff00ff',
            piercing: false
        });

        galickGun.knockback = new Vector2(direction.x * 200, direction.y * 80);
        return galickGun;
    }

    static createFinalFlash(x, y, direction, damage, owner) {
        const finalFlash = new KiBlast(x, y, direction, damage, 400, owner, {
            width: 60,
            height: 30,
            color: '#ffff00',
            glowColor: '#ffffff',
            size: 2.0,
            piercing: true
        });

        finalFlash.lifetime = 2.0;
        finalFlash.knockback = new Vector2(direction.x * 400, direction.y * 200);
        return finalFlash;
    }

    // 다중 기 파동
    static createMultiBlast(x, y, centerDirection, count, spread, damage, speed, owner) {
        const blasts = [];
        const angleSpread = spread * Math.PI / 180; // 도를 라디안으로

        for (let i = 0; i < count; i++) {
            const angleOffset = (i - (count - 1) / 2) * (angleSpread / (count - 1));
            const direction = Vector2.fromAngle(centerDirection.angle() + angleOffset);

            const blast = new KiBlast(x, y, direction, damage, speed, owner, {
                color: '#ff6600',
                size: 0.8
            });

            blasts.push(blast);
        }

        return blasts;
    }

    // 호밍 미사일
    static createHomingBlast(x, y, target, damage, speed, owner) {
        return new KiBlast(x, y, new Vector2(1, 0), damage, speed, owner, {
            homing: true,
            target: target,
            color: '#ff0066',
            glowColor: '#ff99cc'
        });
    }
}
