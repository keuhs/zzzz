// 오디오 매니저 - 사운드 효과와 음악 관리
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.audioContext = null;
        this.masterVolume = 1.0;
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
        this.muted = false;

        // Web Audio API 초기화
        this.initAudioContext();

        // 사운드 파일 경로 (실제 파일이 없으므로 기본값)
        this.soundPaths = {
            // 전투 사운드
            punch: 'assets/sounds/punch.mp3',
            kick: 'assets/sounds/kick.mp3',
            ki_blast: 'assets/sounds/ki_blast.mp3',
            kamehameha: 'assets/sounds/kamehameha.mp3',
            galick_gun: 'assets/sounds/galick_gun.mp3',
            hit: 'assets/sounds/hit.mp3',
            guard: 'assets/sounds/guard.mp3',
            jump: 'assets/sounds/jump.mp3',

            // 이펙트 사운드
            power_up: 'assets/sounds/power_up.mp3',
            teleport: 'assets/sounds/teleport.mp3',
            explosion: 'assets/sounds/explosion.mp3',
            charge: 'assets/sounds/charge.mp3',

            // UI 사운드
            menu_select: 'assets/sounds/menu_select.mp3',
            menu_confirm: 'assets/sounds/menu_confirm.mp3',
            countdown: 'assets/sounds/countdown.mp3',
            victory: 'assets/sounds/victory.mp3',
            defeat: 'assets/sounds/defeat.mp3',

            // 배경 음악
            battle_theme: 'assets/music/battle_theme.mp3',
            menu_theme: 'assets/music/menu_theme.mp3',
            victory_theme: 'assets/music/victory_theme.mp3'
        };

        // 사운드 풀 (동시 재생을 위한)
        this.soundPools = new Map();

        // 현재 재생 중인 음악
        this.currentMusic = null;
        this.musicFadeInterval = null;
    }

    initAudioContext() {
        try {
            // 브라우저 호환성
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // 마스터 게인 노드
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.masterVolume;

            // 사운드와 음악용 별도 게인 노드
            this.soundGainNode = this.audioContext.createGain();
            this.musicGainNode = this.audioContext.createGain();

            this.soundGainNode.connect(this.masterGainNode);
            this.musicGainNode.connect(this.masterGainNode);

            this.soundGainNode.gain.value = this.soundVolume;
            this.musicGainNode.gain.value = this.musicVolume;

            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            // 폴백: HTML5 Audio
            this.useHTML5Audio = true;
        }
    }

    // 사운드 로드
    async loadSound(name, url = null) {
        const soundUrl = url || this.soundPaths[name];
        if (!soundUrl) {
            console.warn(`Sound path for '${name}' not found`);
            return false;
        }

        try {
            if (this.useHTML5Audio) {
                // HTML5 Audio 폴백
                const audio = new Audio(soundUrl);
                audio.preload = 'auto';
                this.sounds.set(name, audio);

                // 사운드 풀 생성 (동시 재생용)
                this.soundPools.set(name, [audio]);

                return true;
            } else {
                // Web Audio API
                const response = await fetch(soundUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                this.sounds.set(name, audioBuffer);
                return true;
            }
        } catch (error) {
            console.warn(`Failed to load sound '${name}':`, error);

            // 더미 사운드 생성 (개발용)
            this.createDummySound(name);
            return false;
        }
    }

    // 더미 사운드 생성 (실제 파일이 없을 때)
    createDummySound(name) {
        if (this.audioContext && !this.useHTML5Audio) {
            // 간단한 톤 생성
            const duration = 0.2;
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
            const channelData = buffer.getChannelData(0);

            // 사운드 타입에 따른 주파수 설정
            const frequencies = {
                punch: 200,
                kick: 150,
                ki_blast: 400,
                kamehameha: 300,
                hit: 600,
                guard: 250,
                jump: 350,
                power_up: 500,
                explosion: 100
            };

            const frequency = frequencies[name] || 300;

            for (let i = 0; i < channelData.length; i++) {
                const t = i / sampleRate;
                channelData[i] = Math.sin(2 * Math.PI * frequency * t) *
                                Math.exp(-t * 5) * 0.3; // 감쇠
            }

            this.sounds.set(name, buffer);
        }
    }

    // 사운드 재생
    playSound(name, options = {}) {
        if (this.muted) return;

        const volume = options.volume !== undefined ? options.volume : 1.0;
        const pitch = options.pitch !== undefined ? options.pitch : 1.0;
        const loop = options.loop || false;

        if (this.useHTML5Audio) {
            this.playHTML5Sound(name, volume, loop);
        } else {
            this.playWebAudioSound(name, volume, pitch, loop);
        }
    }

    playHTML5Sound(name, volume, loop) {
        const soundPool = this.soundPools.get(name);
        if (!soundPool) return;

        // 사용 가능한 오디오 인스턴스 찾기
        let audio = soundPool.find(a => a.paused || a.ended);

        if (!audio) {
            // 새 인스턴스 생성
            const originalAudio = this.sounds.get(name);
            if (originalAudio) {
                audio = originalAudio.cloneNode();
                soundPool.push(audio);
            }
        }

        if (audio) {
            audio.volume = volume * this.soundVolume * this.masterVolume;
            audio.loop = loop;
            audio.currentTime = 0;
            audio.play().catch(console.warn);
        }
    }

    playWebAudioSound(name, volume, pitch, loop) {
        const audioBuffer = this.sounds.get(name);
        if (!audioBuffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = audioBuffer;
        source.playbackRate.value = pitch;
        source.loop = loop;

        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.soundGainNode);

        source.start();

        // 루프가 아닌 경우 자동 정리
        if (!loop) {
            source.addEventListener('ended', () => {
                source.disconnect();
                gainNode.disconnect();
            });
        }

        return source; // 제어를 위해 반환
    }

    // 음악 재생
    async playMusic(name, fadeIn = true, loop = true) {
        // 기존 음악 페이드 아웃
        if (this.currentMusic) {
            await this.stopMusic(true);
        }

        const musicPath = this.soundPaths[name];
        if (!musicPath) {
            console.warn(`Music path for '${name}' not found`);
            return;
        }

        try {
            if (this.useHTML5Audio) {
                const audio = new Audio(musicPath);
                audio.loop = loop;
                audio.volume = fadeIn ? 0 : this.musicVolume * this.masterVolume;

                this.currentMusic = {
                    name: name,
                    audio: audio,
                    type: 'html5'
                };

                audio.play();

                if (fadeIn) {
                    this.fadeInMusic();
                }
            } else {
                // Web Audio API 구현 (복잡하므로 HTML5 Audio 사용)
                this.playMusic(name, fadeIn, loop);
            }
        } catch (error) {
            console.warn(`Failed to play music '${name}':`, error);
        }
    }

    // 음악 정지
    async stopMusic(fadeOut = true) {
        if (!this.currentMusic) return;

        if (fadeOut) {
            await this.fadeOutMusic();
        } else {
            if (this.currentMusic.type === 'html5') {
                this.currentMusic.audio.pause();
                this.currentMusic.audio.currentTime = 0;
            }
            this.currentMusic = null;
        }
    }

    // 음악 페이드 인
    fadeInMusic(duration = 2000) {
        if (!this.currentMusic || this.currentMusic.type !== 'html5') return;

        const audio = this.currentMusic.audio;
        const targetVolume = this.musicVolume * this.masterVolume;
        const stepSize = targetVolume / (duration / 50);

        audio.volume = 0;

        this.musicFadeInterval = setInterval(() => {
            audio.volume = Math.min(audio.volume + stepSize, targetVolume);

            if (audio.volume >= targetVolume) {
                clearInterval(this.musicFadeInterval);
                this.musicFadeInterval = null;
            }
        }, 50);
    }

    // 음악 페이드 아웃
    fadeOutMusic(duration = 1000) {
        return new Promise((resolve) => {
            if (!this.currentMusic || this.currentMusic.type !== 'html5') {
                resolve();
                return;
            }

            const audio = this.currentMusic.audio;
            const startVolume = audio.volume;
            const stepSize = startVolume / (duration / 50);

            this.musicFadeInterval = setInterval(() => {
                audio.volume = Math.max(audio.volume - stepSize, 0);

                if (audio.volume <= 0) {
                    clearInterval(this.musicFadeInterval);
                    this.musicFadeInterval = null;
                    audio.pause();
                    audio.currentTime = 0;
                    this.currentMusic = null;
                    resolve();
                }
            }, 50);
        });
    }

    // 볼륨 제어
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }

        // HTML5 Audio 볼륨도 업데이트
        if (this.currentMusic && this.currentMusic.type === 'html5') {
            this.currentMusic.audio.volume = this.musicVolume * this.masterVolume;
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));

        if (this.soundGainNode) {
            this.soundGainNode.gain.value = this.soundVolume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));

        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }

        if (this.currentMusic && this.currentMusic.type === 'html5') {
            this.currentMusic.audio.volume = this.musicVolume * this.masterVolume;
        }
    }

    // 음소거 토글
    toggleMute() {
        this.muted = !this.muted;

        if (this.muted) {
            this.setMasterVolume(0);
        } else {
            this.setMasterVolume(this.masterVolume);
        }

        return this.muted;
    }

    // 3D 위치 기반 사운드 (간단 구현)
    play3DSound(name, listenerPos, sourcePos, maxDistance = 500) {
        const distance = listenerPos.distance(sourcePos);
        const volume = Math.max(0, 1 - (distance / maxDistance));

        if (volume > 0) {
            this.playSound(name, { volume: volume });
        }
    }

    // 사운드 사전 로드
    async preloadSounds(soundNames) {
        const loadPromises = soundNames.map(name => this.loadSound(name));
        const results = await Promise.allSettled(loadPromises);

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Audio preload complete: ${succeeded} succeeded, ${failed} failed`);
        return { succeeded, failed };
    }

    // 컨텍스트 재개 (사용자 상호작용 후)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
            });
        }
    }

    // 디버깅 정보
    getDebugInfo() {
        return {
            sounds: this.sounds.size,
            currentMusic: this.currentMusic ? this.currentMusic.name : 'none',
            masterVolume: this.masterVolume,
            soundVolume: this.soundVolume,
            musicVolume: this.musicVolume,
            muted: this.muted,
            audioContext: this.audioContext ? this.audioContext.state : 'not available'
        };
    }
}
