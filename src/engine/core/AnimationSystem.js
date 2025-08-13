// 애니메이션 시스템
class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Map();
    }

    // 애니메이션 정의 등록
    registerAnimation(name, animationData) {
        this.animations.set(name, {
            frames: animationData.frames || [],
            frameRate: animationData.frameRate || 10,
            loop: animationData.loop !== false,
            oncomplete: animationData.oncomplete || null,
            frameTime: 1 / (animationData.frameRate || 10)
        });
    }

    // 오브젝트에 애니메이션 시작
    play(object, animationName, options = {}) {
        const animation = this.animations.get(animationName);
        if (!animation) {
            console.warn(`Animation '${animationName}' not found`);
            return false;
        }

        const animationState = {
            name: animationName,
            currentFrame: 0,
            elapsedTime: 0,
            playing: true,
            paused: false,
            speed: options.speed || 1.0,
            loop: options.loop !== undefined ? options.loop : animation.loop,
            oncomplete: options.oncomplete || animation.oncomplete,
            animation: animation
        };

        this.activeAnimations.set(object, animationState);
        return true;
    }

    // 애니메이션 정지
    stop(object) {
        this.activeAnimations.delete(object);
    }

    // 애니메이션 일시정지/재개
    pause(object) {
        const state = this.activeAnimations.get(object);
        if (state) {
            state.paused = true;
        }
    }

    resume(object) {
        const state = this.activeAnimations.get(object);
        if (state) {
            state.paused = false;
        }
    }

    // 모든 활성 애니메이션 업데이트
    update(deltaTime) {
        for (const [object, state] of this.activeAnimations) {
            if (!state.playing || state.paused) continue;

            state.elapsedTime += deltaTime * state.speed;

            // 다음 프레임으로 진행
            if (state.elapsedTime >= state.animation.frameTime) {
                state.currentFrame++;
                state.elapsedTime = 0;

                // 애니메이션 완료 체크
                if (state.currentFrame >= state.animation.frames.length) {
                    if (state.loop) {
                        state.currentFrame = 0;
                    } else {
                        // 애니메이션 완료
                        state.playing = false;
                        if (state.oncomplete) {
                            state.oncomplete(object);
                        }
                        this.activeAnimations.delete(object);
                        continue;
                    }
                }
            }

            // 오브젝트에 현재 프레임 정보 설정
            if (object.setAnimationFrame) {
                object.setAnimationFrame(
                    state.animation.frames[state.currentFrame],
                    state.currentFrame,
                    state.animation.frames.length
                );
            }
        }
    }

    // 현재 애니메이션 정보 가져오기
    getCurrentAnimation(object) {
        return this.activeAnimations.get(object) || null;
    }

    // 애니메이션이 재생 중인지 확인
    isPlaying(object, animationName = null) {
        const state = this.activeAnimations.get(object);
        if (!state) return false;

        if (animationName) {
            return state.playing && state.name === animationName;
        }

        return state.playing;
    }

    // 트위닝 애니메이션 (부드러운 값 변화)
    tween(object, property, targetValue, duration, easing = 'linear', oncomplete = null) {
        const startValue = object[property];
        const changeValue = targetValue - startValue;

        const tweenState = {
            object: object,
            property: property,
            startValue: startValue,
            changeValue: changeValue,
            duration: duration,
            elapsedTime: 0,
            easing: this.getEasingFunction(easing),
            oncomplete: oncomplete,
            active: true
        };

        // 트위닝을 위한 특별한 오브젝트 생성
        const tweenObject = { tween: tweenState };

        this.activeAnimations.set(tweenObject, {
            name: 'tween',
            playing: true,
            paused: false,
            custom: true,
            tweenState: tweenState
        });

        return tweenObject;
    }

    // 이징 함수들
    getEasingFunction(type) {
        const easings = {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: (t) => t * t * t,
            easeOutCubic: (t) => (--t) * t * t + 1,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: (t) => Math.sin(t * Math.PI / 2),
            easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
            bounce: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;

                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
        };

        return easings[type] || easings.linear;
    }

    // 커스텀 업데이트 (트위닝용)
    updateCustomAnimations(deltaTime) {
        for (const [object, state] of this.activeAnimations) {
            if (!state.custom || !state.playing) continue;

            const tween = state.tweenState;
            tween.elapsedTime += deltaTime;

            const progress = Math.min(tween.elapsedTime / tween.duration, 1);
            const easedProgress = tween.easing(progress);

            const currentValue = tween.startValue + (tween.changeValue * easedProgress);
            tween.object[tween.property] = currentValue;

            if (progress >= 1) {
                // 트위닝 완료
                if (tween.oncomplete) {
                    tween.oncomplete(tween.object);
                }
                this.activeAnimations.delete(object);
            }
        }
    }

    // 전체 업데이트 (일반 애니메이션 + 트위닝)
    updateAll(deltaTime) {
        this.update(deltaTime);
        this.updateCustomAnimations(deltaTime);
    }

    // 스프라이트 애니메이션 헬퍼
    createSpriteAnimation(spriteSheet, frameWidth, frameHeight, frames, frameRate = 10) {
        const animationFrames = frames.map(frameIndex => {
            const col = frameIndex % (spriteSheet.width / frameWidth);
            const row = Math.floor(frameIndex / (spriteSheet.width / frameWidth));

            return {
                x: col * frameWidth,
                y: row * frameHeight,
                width: frameWidth,
                height: frameHeight
            };
        });

        return {
            frames: animationFrames,
            frameRate: frameRate,
            spriteSheet: spriteSheet
        };
    }

    // 애니메이션 체인 (순차적으로 여러 애니메이션 재생)
    playChain(object, animationNames, options = {}) {
        if (animationNames.length === 0) return;

        let currentIndex = 0;

        const playNext = () => {
            if (currentIndex < animationNames.length) {
                const isLast = currentIndex === animationNames.length - 1;
                this.play(object, animationNames[currentIndex], {
                    ...options,
                    oncomplete: isLast ? options.oncomplete : () => {
                        currentIndex++;
                        playNext();
                    }
                });
            }
        };

        playNext();
    }

    // 모든 애니메이션 정리
    clear() {
        this.activeAnimations.clear();
    }

    // 디버깅용 정보
    getDebugInfo() {
        return {
            registeredAnimations: this.animations.size,
            activeAnimations: this.activeAnimations.size,
            activeAnimationsList: Array.from(this.activeAnimations.entries()).map(([obj, state]) => ({
                name: state.name,
                currentFrame: state.currentFrame,
                playing: state.playing,
                paused: state.paused
            }))
        };
    }
}
