// 전투 시스템 - 캐릭터 간의 전투 로직 관리
class CombatSystem {
    constructor() {
        this.players = [];
        this.attacks = [];
        this.effects = [];
        this.hitEffects = [];

        // 전투 설정
        this.gravity = 800; // 중력
        this.groundLevel = 500; // 지면 높이
        this.bounds = { left: 50, right: 1150, top: 50, bottom: 550 };

        // 콤보 시스템
        this.comboSystem = {
            maxComboTime: 2000, // 2초
            comboMultiplier: 1.1,
            maxComboMultiplier: 2.0
        };

        // 스테이지 위험 요소
        this.ringOut = { left: 0, right: 1200, bottom: 650 };

        // 전투 상태
        this.matchTime = 99; // 99초
        this.matchStarted = false;
        this.matchEnded = false;
        this.winner = null;
    }

    addPlayer(player) {
        this.players.push(player);
        player.team = this.players.length; // 팀 번호 할당
    }

    addAttack(attack) {
        this.attacks.push(attack);
    }

    update(deltaTime) {
        if (!this.matchStarted || this.matchEnded) return;

        // 매치 타이머
        this.matchTime -= deltaTime;
        if (this.matchTime <= 0) {
            this.endMatch();
            return;
        }

        // 플레이어 업데이트
        this.updatePlayers(deltaTime);

        // 공격 업데이트
        this.updateAttacks(deltaTime);

        // 충돌 감지
        this.handleCollisions();

        // 이펙트 업데이트
        this.updateEffects(deltaTime);

        // 승부 판정
        this.checkWinCondition();
    }

    updatePlayers(deltaTime) {
        this.players.forEach(player => {
            if (!player.active) return;

            // 기본 업데이트
            player.update(deltaTime);

            // 중력 적용
            if (!player.onGround) {
                player.velocity.y += this.gravity * deltaTime;
            }

            // 지면 충돌
            this.handleGroundCollision(player);

            // 경계 충돌
            this.handleBoundaryCollision(player);

            // 링아웃 체크
            this.checkRingOut(player);

            // 상대방 자동 추적 (AI나 자동 회전)
            this.handleFacing(player);
        });
    }

    handleGroundCollision(player) {
        if (player.position.y + player.height / 2 >= this.groundLevel) {
            player.position.y = this.groundLevel - player.height / 2;

            if (player.velocity.y > 0) {
                player.velocity.y = 0;
                player.onGround = true;
                player.airDashCount = 0; // 공중 대시 횟수 리셋

                // 착지 시 상태 변경
                if (player.state === 'jump') {
                    player.setState('idle');
                }
            }
        } else {
            player.onGround = false;
        }
    }

    handleBoundaryCollision(player) {
        const bounds = player.getBounds();

        // 좌우 경계
        if (bounds.left < this.bounds.left) {
            player.position.x = this.bounds.left + player.width / 2;
            player.velocity.x = Math.max(0, player.velocity.x);
        } else if (bounds.right > this.bounds.right) {
            player.position.x = this.bounds.right - player.width / 2;
            player.velocity.x = Math.min(0, player.velocity.x);
        }

        // 상단 경계
        if (bounds.top < this.bounds.top) {
            player.position.y = this.bounds.top + player.height / 2;
            player.velocity.y = Math.max(0, player.velocity.y);
        }
    }

    checkRingOut(player) {
        const pos = player.position;

        if (pos.x < this.ringOut.left || pos.x > this.ringOut.right ||
            pos.y > this.ringOut.bottom) {

            // 링아웃 - 즉시 KO
            player.takeDamage(player.health);
            this.createEffect('ringOut', pos.copy());
        }
    }

    handleFacing(player) {
        // 가장 가까운 적을 향하도록
        const opponents = this.players.filter(p => p.team !== player.team && p.active);
        if (opponents.length > 0) {
            const nearest = opponents.reduce((closest, opponent) => {
                const dist1 = player.position.distance(closest.position);
                const dist2 = player.position.distance(opponent.position);
                return dist2 < dist1 ? opponent : closest;
            });

            // 공격 중이 아닐 때만 자동 회전
            if (player.state !== 'attack') {
                player.faceOpponent(nearest);
            }
        }
    }

    updateAttacks(deltaTime) {
        this.attacks = this.attacks.filter(attack => {
            attack.update(deltaTime);

            // 경계를 벗어난 공격 제거
            if (!this.isInBounds(attack.position)) {
                attack.destroy();
            }

            return attack.active;
        });
    }

    handleCollisions() {
        // 공격 vs 플레이어 충돌
        this.attacks.forEach(attack => {
            this.players.forEach(player => {
                if (!player.active || player === attack.owner) return;

                const attackBounds = attack.getBounds();
                const playerHurtbox = player.getHurtbox();

                if (CollisionDetection.aabb(attackBounds, playerHurtbox)) {
                    const hitEffect = attack.onHit(player);
                    if (hitEffect) {
                        this.createEffect(hitEffect.type, hitEffect.position, hitEffect);
                    }
                }
            });
        });

        // 플레이어 vs 플레이어 히트박스 충돌
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                this.handlePlayerCombat(this.players[i], this.players[j]);
            }
        }

        // 플레이어 vs 플레이어 물리 충돌 (밀어내기)
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                this.handlePlayerPhysics(this.players[i], this.players[j]);
            }
        }
    }

    handlePlayerCombat(player1, player2) {
        if (!player1.active || !player2.active) return;

        const hitboxes1 = player1.getHitboxes();
        const hitboxes2 = player2.getHitboxes();
        const hurtbox1 = player1.getHurtbox();
        const hurtbox2 = player2.getHurtbox();

        // Player1의 히트박스 vs Player2의 허트박스
        hitboxes1.forEach(hitbox => {
            if (CollisionDetection.aabb(hitbox, hurtbox2)) {
                const hit = player2.takeDamage(hitbox.damage, hitbox.knockback, player1);
                if (hit) {
                    this.createHitEffect(player2.position, hitbox.damage, hitbox.type);
                    this.updateCombo(player1);
                }
            }
        });

        // Player2의 히트박스 vs Player1의 허트박스
        hitboxes2.forEach(hitbox => {
            if (CollisionDetection.aabb(hitbox, hurtbox1)) {
                const hit = player1.takeDamage(hitbox.damage, hitbox.knockback, player2);
                if (hit) {
                    this.createHitEffect(player1.position, hitbox.damage, hitbox.type);
                    this.updateCombo(player2);
                }
            }
        });
    }

    handlePlayerPhysics(player1, player2) {
        if (!player1.active || !player2.active) return;

        if (player1.intersects(player2)) {
            // 플레이어들을 서로 밀어내기
            const dx = player2.position.x - player1.position.x;
            const distance = Math.abs(dx);
            const overlap = (player1.width + player2.width) / 2 - distance;

            if (overlap > 0) {
                const pushForce = overlap / 2;

                if (dx > 0) {
                    player1.position.x -= pushForce;
                    player2.position.x += pushForce;
                } else {
                    player1.position.x += pushForce;
                    player2.position.x -= pushForce;
                }
            }
        }
    }

    updateCombo(attacker) {
        const now = Date.now();

        if (now - attacker.lastAttackTime <= this.comboSystem.maxComboTime) {
            attacker.comboCount++;
        } else {
            attacker.comboCount = 1;
        }

        attacker.lastAttackTime = now;

        // 콤보 데미지 배수 적용
        const multiplier = Math.min(
            1 + (attacker.comboCount - 1) * (this.comboSystem.comboMultiplier - 1),
            this.comboSystem.maxComboMultiplier
        );

        attacker.comboDamageMultiplier = multiplier;
    }

    createEffect(type, position, data = {}) {
        this.effects.push({
            type: type,
            position: position.copy(),
            data: data,
            lifetime: data.lifetime || 1.0,
            maxLifetime: data.lifetime || 1.0,
            created: Date.now()
        });
    }

    createHitEffect(position, damage, attackType) {
        const hitEffect = {
            position: position.copy(),
            damage: damage,
            type: attackType,
            lifetime: 0.5,
            maxLifetime: 0.5,
            size: Math.min(damage / 10, 3.0),
            particles: []
        };

        // 히트 파티클 생성
        for (let i = 0; i < 8; i++) {
            hitEffect.particles.push({
                position: position.copy(),
                velocity: Vector2.fromAngle(Math.random() * Math.PI * 2, 100 + Math.random() * 100),
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                size: 2 + Math.random() * 3
            });
        }

        this.hitEffects.push(hitEffect);
    }

    updateEffects(deltaTime) {
        // 일반 이펙트 업데이트
        this.effects = this.effects.filter(effect => {
            effect.lifetime -= deltaTime;
            return effect.lifetime > 0;
        });

        // 히트 이펙트 업데이트
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.lifetime -= deltaTime;

            effect.particles = effect.particles.filter(particle => {
                particle.position = particle.position.add(particle.velocity.multiply(deltaTime));
                particle.velocity = particle.velocity.multiply(0.95); // 감속
                particle.life -= deltaTime;
                return particle.life > 0;
            });

            return effect.lifetime > 0;
        });
    }

    checkWinCondition() {
        const alivePlayers = this.players.filter(p => p.health > 0);

        if (alivePlayers.length <= 1) {
            this.winner = alivePlayers[0] || null;
            this.endMatch();
        }
    }

    startMatch() {
        this.matchStarted = true;
        this.matchTime = 99;
        this.players.forEach(player => {
            player.health = player.maxHealth;
            player.ki = 0;
        });

        this.createEffect('matchStart', new Vector2(600, 300));
    }

    endMatch() {
        this.matchEnded = true;

        if (!this.winner) {
            // 시간 초과 - 체력이 더 많은 플레이어 승리
            this.winner = this.players.reduce((winner, player) => {
                return player.health > winner.health ? player : winner;
            });
        }

        this.createEffect('matchEnd', new Vector2(600, 300), {
            winner: this.winner,
            lifetime: 3.0
        });
    }

    isInBounds(position) {
        return position.x >= -100 && position.x <= 1300 &&
               position.y >= -100 && position.y <= 700;
    }

    // 특수 공격 생성 (캐릭터에서 호출)
    createSpecialAttack(attackData) {
        switch (attackData.type) {
            case 'kamehameha':
                const kamehameha = KiBlast.createKamehameha(
                    attackData.position.x,
                    attackData.position.y,
                    attackData.direction,
                    attackData.damage,
                    attackData.size,
                    attackData.speed,
                    attackData.owner
                );
                this.addAttack(kamehameha);
                this.createEffect('kamehamehaLaunch', attackData.position);
                break;

            case 'galickGun':
                const galickGun = KiBlast.createGalickGun(
                    attackData.position.x,
                    attackData.position.y,
                    attackData.direction,
                    attackData.damage,
                    attackData.owner
                );
                this.addAttack(galickGun);
                this.createEffect('galickGunLaunch', attackData.position);
                break;

            case 'finalFlash':
                const finalFlash = KiBlast.createFinalFlash(
                    attackData.position.x,
                    attackData.position.y,
                    attackData.direction,
                    attackData.damage,
                    attackData.owner
                );
                this.addAttack(finalFlash);
                this.createEffect('finalFlashLaunch', attackData.position);
                break;

            case 'kiBlast':
                const kiBlast = new KiBlast(
                    attackData.position.x,
                    attackData.position.y,
                    attackData.direction,
                    attackData.damage,
                    attackData.speed,
                    attackData.owner
                );
                this.addAttack(kiBlast);
                break;
        }
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            players: this.players.length,
            attacks: this.attacks.length,
            effects: this.effects.length,
            hitEffects: this.hitEffects.length,
            matchTime: this.matchTime,
            matchState: this.matchStarted ? (this.matchEnded ? 'ended' : 'active') : 'waiting'
        };
    }
}
