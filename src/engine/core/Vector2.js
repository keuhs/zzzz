// Vector2 클래스 - 2D 벡터 계산용
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // 벡터 덧셈
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    // 벡터 뺄셈
    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }

    // 스칼라 곱셈
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    // 벡터 크기
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // 정규화
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }

    // 거리 계산
    distance(vector) {
        return Math.sqrt((this.x - vector.x) ** 2 + (this.y - vector.y) ** 2);
    }

    // 복사
    copy() {
        return new Vector2(this.x, this.y);
    }

    // 설정
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    // 내적
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    // 각도 계산 (라디안)
    angle() {
        return Math.atan2(this.y, this.x);
    }

    // 각도로부터 벡터 생성
    static fromAngle(angle, magnitude = 1) {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    // 보간
    lerp(vector, t) {
        return new Vector2(
            this.x + (vector.x - this.x) * t,
            this.y + (vector.y - this.y) * t
        );
    }
}
