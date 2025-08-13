// 충돌 감지 시스템
class CollisionDetection {
    // AABB (Axis-Aligned Bounding Box) 충돌 감지
    static aabb(rectA, rectB) {
        return rectA.left < rectB.right &&
               rectA.right > rectB.left &&
               rectA.top < rectB.bottom &&
               rectA.bottom > rectB.top;
    }

    // 원형 충돌 감지
    static circle(circleA, circleB) {
        const dx = circleA.x - circleB.x;
        const dy = circleA.y - circleB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circleA.radius + circleB.radius);
    }

    // 점과 사각형 충돌
    static pointInRect(point, rect) {
        return point.x >= rect.left &&
               point.x <= rect.right &&
               point.y >= rect.top &&
               point.y <= rect.bottom;
    }

    // 점과 원 충돌
    static pointInCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
    }

    // 선분과 사각형 충돌
    static lineRect(line, rect) {
        // 선분의 양 끝점이 사각형 안에 있는지 확인
        if (this.pointInRect(line.start, rect) || this.pointInRect(line.end, rect)) {
            return true;
        }

        // 선분이 사각형의 각 변과 교차하는지 확인
        const rectLines = [
            { start: { x: rect.left, y: rect.top }, end: { x: rect.right, y: rect.top } }, // 상단
            { start: { x: rect.right, y: rect.top }, end: { x: rect.right, y: rect.bottom } }, // 우측
            { start: { x: rect.right, y: rect.bottom }, end: { x: rect.left, y: rect.bottom } }, // 하단
            { start: { x: rect.left, y: rect.bottom }, end: { x: rect.left, y: rect.top } } // 좌측
        ];

        return rectLines.some(rectLine => this.lineLine(line, rectLine));
    }

    // 선분과 선분 교차점
    static lineLine(line1, line2) {
        const x1 = line1.start.x, y1 = line1.start.y;
        const x2 = line1.end.x, y2 = line1.end.y;
        const x3 = line2.start.x, y3 = line2.start.y;
        const x4 = line2.end.x, y4 = line2.end.y;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) return false; // 평행선

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    // 다각형 충돌 감지 (SAT - Separating Axis Theorem)
    static polygon(polyA, polyB) {
        const axes = [...this.getAxes(polyA), ...this.getAxes(polyB)];

        for (const axis of axes) {
            const projA = this.project(polyA, axis);
            const projB = this.project(polyB, axis);

            if (projA.max < projB.min || projB.max < projA.min) {
                return false; // 분리축 발견
            }
        }

        return true; // 충돌
    }

    // 다각형의 법선 벡터들 구하기
    static getAxes(polygon) {
        const axes = [];
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i];
            const next = polygon[(i + 1) % polygon.length];

            const edge = new Vector2(next.x - current.x, next.y - current.y);
            const normal = new Vector2(-edge.y, edge.x).normalize();
            axes.push(normal);
        }
        return axes;
    }

    // 다각형을 축에 투영
    static project(polygon, axis) {
        let min = Infinity;
        let max = -Infinity;

        for (const vertex of polygon) {
            const dot = vertex.x * axis.x + vertex.y * axis.y;
            min = Math.min(min, dot);
            max = Math.max(max, dot);
        }

        return { min, max };
    }

    // 충돌 응답 계산
    static resolveCollision(objA, objB) {
        const dx = objB.position.x - objA.position.x;
        const dy = objB.position.y - objA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // 같은 위치

        // 충돌 법선
        const nx = dx / distance;
        const ny = dy / distance;

        // 상대 속도
        const relativeVelocityX = objB.velocity.x - objA.velocity.x;
        const relativeVelocityY = objB.velocity.y - objA.velocity.y;

        // 법선 방향 상대 속도
        const separatingVelocity = relativeVelocityX * nx + relativeVelocityY * ny;

        // 이미 분리되고 있으면 무시
        if (separatingVelocity > 0) return;

        // 반발 계수
        const restitution = Math.min(objA.bounce, objB.bounce);

        // 새로운 분리 속도
        const newSeparatingVelocity = -separatingVelocity * restitution;

        // 속도 변화량
        const deltaVelocity = newSeparatingVelocity - separatingVelocity;

        // 질량 계산
        const totalInverseMass = 1 / objA.mass + 1 / objB.mass;

        if (totalInverseMass <= 0) return; // 무한 질량

        // 임펄스 계산
        const impulse = deltaVelocity / totalInverseMass;
        const impulsePerMass = impulse / totalInverseMass;

        // 속도 적용
        objA.velocity.x -= impulsePerMass * nx / objA.mass;
        objA.velocity.y -= impulsePerMass * ny / objA.mass;

        objB.velocity.x += impulsePerMass * nx / objB.mass;
        objB.velocity.y += impulsePerMass * ny / objB.mass;
    }

    // 위치 기반 충돌 해결
    static resolvePosition(objA, objB) {
        const dx = objB.position.x - objA.position.x;
        const dy = objB.position.y - objA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        // 최소 분리 거리
        const minDistance = objA.radius + objB.radius;
        const overlap = minDistance - distance;

        if (overlap > 0) {
            // 정규화된 방향
            const nx = dx / distance;
            const ny = dy / distance;

            // 질량 비율에 따른 분리
            const totalMass = objA.mass + objB.mass;
            const ratioA = objB.mass / totalMass;
            const ratioB = objA.mass / totalMass;

            objA.position.x -= nx * overlap * ratioA;
            objA.position.y -= ny * overlap * ratioA;

            objB.position.x += nx * overlap * ratioB;
            objB.position.y += ny * overlap * ratioB;
        }
    }

    // 레이캐스팅
    static raycast(start, direction, distance, objects) {
        const end = start.add(direction.normalize().multiply(distance));
        const line = { start, end };

        const hits = [];

        for (const obj of objects) {
            const bounds = obj.getBounds();
            if (this.lineRect(line, bounds)) {
                const hitDistance = start.distance(obj.position);
                hits.push({
                    object: obj,
                    distance: hitDistance,
                    point: start.add(direction.normalize().multiply(hitDistance))
                });
            }
        }

        // 거리순 정렬
        hits.sort((a, b) => a.distance - b.distance);

        return hits;
    }

    // 스윕 테스트 (연속 충돌 감지)
    static sweepTest(objA, objB, deltaTime) {
        // 상대 속도
        const relativeVelocity = objA.velocity.subtract(objB.velocity);

        // 상대 위치
        const relativePosition = objA.position.subtract(objB.position);

        // 충돌 시간 계산 (원형 객체 기준)
        const a = relativeVelocity.dot(relativeVelocity);
        const b = 2 * relativePosition.dot(relativeVelocity);
        const c = relativePosition.dot(relativePosition) - Math.pow(objA.radius + objB.radius, 2);

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) return null; // 충돌 없음

        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        const t = Math.min(t1, t2);

        if (t >= 0 && t <= deltaTime) {
            return {
                time: t,
                position: objA.position.add(objA.velocity.multiply(t))
            };
        }

        return null;
    }
}
