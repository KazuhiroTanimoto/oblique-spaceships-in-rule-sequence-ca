/* Centroid trails on the same torus used by RuleSwitchingCA. */
(() => {
    'use strict';
    function centroid(state, size) {
        let sinX = 0, cosX = 0, sinY = 0, cosY = 0, count = 0;
        for (let i = 0; i < state.length; i++) {
            if (!state[i]) continue;
            const x = 2 * Math.PI * ((i % size) + 0.5) / size;
            const y = 2 * Math.PI * (Math.floor(i / size) + 0.5) / size;
            sinX += Math.sin(x); cosX += Math.cos(x);
            sinY += Math.sin(y); cosY += Math.cos(y);
            count++;
        }
        if (!count) return null;
        const coordinate = (sin, cos) => ((Math.atan2(sin, cos) / (2 * Math.PI) + 1) % 1) * size;
        return { x: coordinate(sinX, cosX), y: coordinate(sinY, cosY) };
    }
    function drawTrail(ctx, points, size, cellSize) {
        const delta = (a, b) => ((b - a + 1.5 * size) % size) - size / 2;
        ctx.strokeStyle = '#475e6d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < points.length; i++) {
            const from = points[i - 1], to = points[i];
            const end = { x: from.x + delta(from.x, to.x), y: from.y + delta(from.y, to.y) };
            for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
                if (Math.max(from.x, end.x) + dx < 0 || Math.min(from.x, end.x) + dx > size || Math.max(from.y, end.y) + dy < 0 || Math.min(from.y, end.y) + dy > size) continue;
                ctx.moveTo((from.x + dx) * cellSize, (from.y + dy) * cellSize);
                ctx.lineTo((end.x + dx) * cellSize, (end.y + dy) * cellSize);
            }
        }
        ctx.stroke();
    }
    function createOverlay(canvas, period) {
        const ctx = canvas.getContext('2d');
        const points = [];
        let lastGeneration = -1;
        return ({ state, generation, gridSize, cellSize }) => {
            if (generation === 0) {
                points.length = 0;
                lastGeneration = -1;
            }
            if (generation % period === 0 && generation !== lastGeneration) {
                const point = centroid(state, gridSize);
                if (point) points.push(point);
                lastGeneration = generation;
            }
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, gridSize * cellSize, gridSize * cellSize);
            for (let i = 0; i < state.length; i++) {
                if (state[i]) ctx.rect((i % gridSize) * cellSize, Math.floor(i / gridSize) * cellSize, cellSize, cellSize);
            }
            ctx.clip('evenodd');
            drawTrail(ctx, points, gridSize, cellSize);
            ctx.restore();
        };
    }
    const api = { centroid, drawTrail, createOverlay };
    if (typeof module !== 'undefined') module.exports = api;
    else window.SingleRuleObliqueTrail = api;
})();
