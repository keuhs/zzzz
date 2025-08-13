// 공격 시스템의 기본 클래스
class Attack extends GameObject {
    constructor(x, y, damage, knockback, owner) {
        super(x, y);

        this.damage = damage;
        this.knockback = knockback || new Vector2(0, 0);
        this.owner = owner;
        this.lifetime = 2.0; // 2초 후 자동 소멸
        this.hasHit = false;
        this.piercing = false; // 관통 공격인지
        this.blockable = true; // 가드 가능한지

        // 비주얼
        this.color = '#ffffff';
        this.trailEffect = true;
        this.particles = [];

        // 사운드
        this.soundEffect = null;
    }

    update(deltaTime) {
        super.update(deltaTime);

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.destroy();
        }

        // 파티클 업데이트
        this.updateParticles(deltaTime);
    }

    updateParticles(deltaTime) {
        // 트레일 이펙트를 위한 파티클 생성
        if (this.trailEffect) {
            this.particles.push({
                position: this.position.copy(),
                life: 0.3,
                maxLife: 0.3,
                size: this.radius * 0.8,
                alpha: 1.0
            });
        }

        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            particle.size *= 0.98;
            return particle.life > 0;
        });
    }

    // 충돌 처리
    onHit(target) {
        if (this.hasHit && !this.piercing) {
            return false;
        }

        // 같은 팀 공격 금지
        if (target.team === this.owner.team) {
            return false;
        }

        this.hasHit = true;

        // 데미지와 넉백 적용
        const hitSuccess = target.takeDamage(this.damage, this.knockback, this.owner);

        if (hitSuccess) {
            this.createHitEffect(target);

            // 관통 공격이 아니면 소멸
            if (!this.piercing) {
                this.destroy();
            }
        }

        return hitSuccess;
    }

    createHitEffect(target) {
        // 히트 이펙트 생성
        return {
            type: 'hitEffect',
            position: target.position.copy(),
            damage: this.damage,
            color: this.color
        };
    }

    draw(ctx) {
        // 기본 공격 시각화
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 트레일 파티클 그리기
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha * 0.6;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(
                particle.position.x - this.position.x,
                particle.position.y - this.position.y,
                particle.size,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        });
    }
}
