// 파티클 시스템 - 이펙트와 비주얼 효과 관리
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 1000;

        // 사전 정의된 이펙트 템플릿
        this.effectTemplates = new Map();
        this.initializeTemplates();
    }

    initializeTemplates() {
        // 히트 이펙트
        this.effectTemplates.set('hit', {
            particleCount: 8,
            spread: Math.PI,
            speed: { min: 50, max: 150 },
            size: { min: 2, max: 5 },
            life: { min: 0.2, max: 0.5 },
            colors: ['#ffffff', '#ffff00', '#ff6600'],
            gravity: 200,
            fadeOut: true
        });

        // 기 충전 이펙트
        this.effectTemplates.set('kiCharge', {
            particleCount: 12,
            spread: Math.PI * 2,
            speed: { min: 20, max: 80 },
            size: { min: 1, max: 3 },
            life: { min: 0.5, max: 1.0 },
            colors: ['#00aaff', '#0066cc', '#ffffff'],
            gravity: -50,
            fadeOut: true,
            spiral: true
        });

        // 폭발 이펙트
        this.effectTemplates.set('explosion', {
            particleCount: 20,
            spread: Math.PI * 2,
            speed: { min: 100, max: 300 },
            size: { min: 3, max: 8 },
            life: { min: 0.3, max: 0.8 },
            colors: ['#ff6600', '#ff0000', '#ffff00', '#ffffff'],
            gravity: 100,
            fadeOut: true,
            sizeDecay: true
        });

        // 오라 이펙트
        this.effectTemplates.set('aura', {
            particleCount: 15,
            spread: Math.PI * 2,
            speed: { min: 10, max: 40 },
            size: { min: 2, max: 6 },
            life: { min: 1.0, max: 2.0 },
            colors: ['#ffff00', '#ffffff', '#ffaa00'],
            gravity: -20,
            fadeOut: true,
            continuous: true
        });

        // 텔레포트 이펙트
        this.effectTemplates.set('teleport', {
            particleCount: 25,
            spread: Math.PI * 2,
            speed: { min: 80, max: 200 },
            size: { min: 1, max: 4 },
            life: { min: 0.4, max: 0.8 },
            colors: ['#00ffff', '#ffffff', '#0088ff'],
            gravity: 0,
            fadeOut: true,
            sparkle: true
        });
    }

    createEffect(templateName, position, options = {}) {
        const template = this.effectTemplates.get(templateName);
        if (!template) {
            console.warn(`Effect template '${templateName}' not found`);
            return;
        }

        const config = { ...template, ...options };

        for (let i = 0; i < config.particleCount; i++) {
            this.createParticle(position, config);
        }

        // 연속 이펙트인 경우 이미터 생성
        if (config.continuous) {
            this.createEmitter(templateName, position, config);
        }
    }

    createParticle(position, config) {
        if (this.particles.length >= this.maxParticles) {
            // 가장 오래된 파티클 제거
            this.particles.shift();
        }

        const angle = Math.random() * config.spread - config.spread / 2;
        const speed = this.randomBetween(config.speed.min, config.speed.max);
        const size = this.randomBetween(config.size.min, config.size.max);
        const life = this.randomBetween(config.life.min, config.life.max);

        const particle = {
            position: position.copy(),
            velocity: Vector2.fromAngle(angle, speed),
            size: size,
            originalSize: size,
            life: life,
            maxLife: life,
            color: this.randomChoice(config.colors),
            gravity: config.gravity || 0,
            fadeOut: config.fadeOut || false,
            sizeDecay: config.sizeDecay || false,
            sparkle: config.sparkle || false,
            spiral: config.spiral || false,
            spiralSpeed: Math.random() * 5 + 2,
            alpha: 1.0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 10
        };

        this.particles.push(particle);
    }

    createEmitter(templateName, position, config) {
        const emitter = {
            templateName: templateName,
            position: position.copy(),
            config: config,
            emissionRate: config.emissionRate || 10, // 초당 파티클 수
            lastEmission: 0,
            life: config.emitterLife || Infinity,
            maxLife: config.emitterLife || Infinity,
            active: true
        };

        this.emitters.push(emitter);
        return emitter;
    }

    update(deltaTime) {
        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                return false;
            }

            // 물리 업데이트
            particle.velocity.y += particle.gravity * deltaTime;
            particle.position = particle.position.add(particle.velocity.multiply(deltaTime));

            // 스파이럴 효과
            if (particle.spiral) {
                const spiralForce = Vector2.fromAngle(
                    Date.now() * 0.001 * particle.spiralSpeed,
                    20
                );
                particle.velocity = particle.velocity.add(spiralForce.multiply(deltaTime));
            }

            // 페이드 아웃
            if (particle.fadeOut) {
                particle.alpha = particle.life / particle.maxLife;
            }

            // 크기 감소
            if (particle.sizeDecay) {
                particle.size = particle.originalSize * (particle.life / particle.maxLife);
            }

            // 회전
            particle.rotation += particle.rotationSpeed * deltaTime;

            // 스파클 효과 (깜빡임)
            if (particle.sparkle) {
                particle.alpha *= 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
            }

            return true;
        });

        // 이미터 업데이트
        this.emitters = this.emitters.filter(emitter => {
            if (!emitter.active) return false;

            emitter.life -= deltaTime;
            if (emitter.life <= 0) {
                return false;
            }

            // 파티클 방출
            const emissionInterval = 1 / emitter.emissionRate;
            if (Date.now() - emitter.lastEmission >= emissionInterval * 1000) {
                this.createParticle(emitter.position, emitter.config);
                emitter.lastEmission = Date.now();
            }

            return true;
        });
    }

    render(ctx) {
        this.particles.forEach(particle => {
            ctx.save();

            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.position.x, particle.position.y);
            ctx.rotate(particle.rotation);

            // 파티클 색상 설정
            ctx.fillStyle = particle.color;

            // 글로우 효과
            if (particle.sparkle) {
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = particle.size * 2;
            }

            // 파티클 그리기 (원형)
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // 추가 효과 (십자 모양)
            if (particle.sparkle && particle.size > 3) {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-particle.size, 0);
                ctx.lineTo(particle.size, 0);
                ctx.moveTo(0, -particle.size);
                ctx.lineTo(0, particle.size);
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    // 특정 위치에 커스텀 파티클 생성
    createCustomParticle(position, velocity, options = {}) {
        const particle = {
            position: position.copy(),
            velocity: velocity.copy(),
            size: options.size || 3,
            originalSize: options.size || 3,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            color: options.color || '#ffffff',
            gravity: options.gravity || 0,
            fadeOut: options.fadeOut !== false,
            sizeDecay: options.sizeDecay || false,
            sparkle: options.sparkle || false,
            spiral: options.spiral || false,
            spiralSpeed: options.spiralSpeed || 3,
            alpha: options.alpha || 1.0,
            rotation: options.rotation || 0,
            rotationSpeed: options.rotationSpeed || 0
        };

        this.particles.push(particle);
    }

    // 이미터 중지
    stopEmitter(emitter) {
        if (emitter) {
            emitter.active = false;
        }
    }

    // 모든 파티클/이미터 제거
    clear() {
        this.particles = [];
        this.emitters = [];
    }

    // 특정 효과의 모든 파티클 제거
    clearEffect(templateName) {
        this.emitters = this.emitters.filter(emitter =>
            emitter.templateName !== templateName
        );
    }

    // 유틸리티 함수들
    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 특수 이펙트들
    createExplosion(position, size = 1.0, color = '#ff6600') {
        this.createEffect('explosion', position, {
            particleCount: Math.floor(20 * size),
            size: { min: 3 * size, max: 8 * size },
            speed: { min: 100 * size, max: 300 * size },
            colors: [color, '#ff0000', '#ffff00', '#ffffff']
        });
    }

    createShockwave(position, radius = 50, color = '#ffffff') {
        const particleCount = Math.floor(radius / 3);
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particlePos = position.add(Vector2.fromAngle(angle, radius));

            this.createCustomParticle(particlePos, new Vector2(0, 0), {
                size: 2,
                life: 0.3,
                color: color,
                fadeOut: true
            });
        }
    }

    createTrail(startPos, endPos, particleCount = 10, color = '#ffffff') {
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const pos = startPos.lerp(endPos, t);

            this.createCustomParticle(pos, new Vector2(0, 0), {
                size: 3 * (1 - t),
                life: 0.5,
                color: color,
                fadeOut: true
            });
        }
    }

    // 디버깅 정보
    getDebugInfo() {
        return {
            particles: this.particles.length,
            emitters: this.emitters.length,
            maxParticles: this.maxParticles,
            templates: this.effectTemplates.size
        };
    }
}
