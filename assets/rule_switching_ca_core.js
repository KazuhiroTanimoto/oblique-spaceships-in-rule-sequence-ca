(() => {
    "use strict";

    function parseRule(text) {
        const parts = String(text).trim().split("/");
        const digits = (value) =>
            new Set(
                (value || "")
                    .replace(/[^0-8]/g, "")
                    .split("")
                    .map(Number),
            );
        const stateDigits = (parts[2] || "").replace(/[^0-9]/g, "");
        const states = Math.max(2, Number.parseInt(stateDigits, 10) || 2);
        return { born: digits(parts[0]), survive: digits(parts[1]), states };
    }

    function normalizeSequence(sequence, ruleCount, fallback) {
        const symbols = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const tokens = Array.isArray(sequence) ? sequence : String(sequence || "").match(/\[\d+\]|[1-9A-Za-z]/g) || [];
        const values = tokens.map(value => typeof value === 'number' ? value : value[0] === '[' ? Number(value.slice(1, -1)) : symbols.indexOf(value) + 1)
            .filter(value => Number.isSafeInteger(value) && value >= 1 && value <= ruleCount);
        return values.length ? values : fallback;
    }

    function hslToRgb(hue, saturation, lightness) {
        const h = (((hue % 360) + 360) % 360) / 360;
        const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
        let red = 0;
        let green = 0;
        let blue = 0;
        if (h < 1 / 6) [red, green, blue] = [c, x, 0];
        else if (h < 2 / 6) [red, green, blue] = [x, c, 0];
        else if (h < 3 / 6) [red, green, blue] = [0, c, x];
        else if (h < 4 / 6) [red, green, blue] = [0, x, c];
        else if (h < 5 / 6) [red, green, blue] = [x, 0, c];
        else [red, green, blue] = [c, 0, x];
        const m = lightness - c * 0.5;
        return [red, green, blue].map((value) => Math.round((value + m) * 255));
    }

    function mixRgb(first, second, amount) {
        return first.map((value, index) => Math.round(value + (second[index] - value) * amount));
    }

    function gradient3(first, middle, last, amount) {
        if (amount < 0.5) return mixRgb(first, middle, amount * 2);
        return mixRgb(middle, last, (amount - 0.5) * 2);
    }

    const paletteOptions = [
        ["default", "Original warm"],
        ["spectrum", "Spectrum"],
        ["ocean", "Ocean"],
        ["fire", "Fire"],
        ["forest", "Forest"],
        ["monochrome", "Monochrome"],
        ["yellow-green-blue", "Yellow → Green → Blue"],
        ["cyan-magenta", "Cyan → Magenta"],
        ["indigo-coral", "Indigo → Coral"],
        ["teal-gold-coral", "Teal → Gold → Coral"],
        ["plasma", "Plasma"],
        ["viridis", "Viridis"],
        ["arctic", "Arctic"],
        ["sunset", "Sunset"],
        ["rose", "Rose"],
        ["mint", "Mint"],
        ["earth", "Earth"],
        ["icefire", "Icefire"],
        ["blue-gold", "Blue → Gold"],
        ["green-purple", "Green → Purple"],
        ["neon", "Neon"],
        ["slate-copper", "Slate → Copper"],
        ["green-yellow-red", "Green → Yellow → Red"],
    ];

    function colorForState(state, states, palette) {
        if (state === 0) return [10, 15, 19];
        if (state === 1) return [232, 237, 242];
        const t = (state - 2) / Math.max(1, states - 2);
        switch (palette) {
            case "spectrum":
                return hslToRgb(280 - t * 280, 0.8, 0.56 - t * 0.18);
            case "indigo-coral":
                return mixRgb([56, 41, 184], [255, 92, 51], t);
            case "teal-gold-coral":
                return gradient3([0, 128, 128], [255, 215, 0], [255, 127, 80], t);
            case "yellow-green-blue":
                return gradient3([255, 209, 13], [31, 199, 71], [20, 87, 255], t);
            case "cyan-magenta":
                return mixRgb([13, 224, 209], [224, 46, 235], t);
            case "plasma":
                return gradient3([51, 10, 117], [217, 20, 140], [255, 166, 10], t);
            case "viridis":
                return gradient3([69, 26, 115], [26, 153, 140], [230, 217, 38], t);
            case "arctic":
                return gradient3([10, 36, 112], [20, 184, 230], [230, 250, 255], t);
            case "sunset":
                return gradient3([26, 20, 77], [204, 51, 102], [255, 191, 46], t);
            case "rose":
                return gradient3([102, 10, 64], [242, 64, 140], [255, 204, 166], t);
            case "mint":
                return gradient3([5, 71, 64], [51, 217, 153], [204, 255, 217], t);
            case "earth":
                return gradient3([77, 31, 10], [128, 128, 31], [242, 191, 89], t);
            case "icefire":
                return gradient3([13, 64, 230], [242, 242, 255], [242, 26, 13], t);
            case "blue-gold":
                return mixRgb([13, 77, 230], [255, 179, 13], t);
            case "green-purple":
                return mixRgb([26, 191, 77], [179, 26, 230], t);
            case "neon":
                return gradient3([255, 13, 140], [13, 242, 242], [255, 230, 13], t);
            case "slate-copper":
                return mixRgb([26, 46, 71], [230, 89, 26], t);
            case "green-yellow-red":
                return gradient3([13, 191, 51], [255, 217, 13], [242, 26, 13], t);
            case "fire":
                return hslToRgb(5 + t * 50, 0.82, 0.52 + t * 0.08);
            case "forest":
                return hslToRgb(75 + t * 70, 0.68, 0.55 - t * 0.2);
            case "monochrome":
                return hslToRgb(0, 0, 0.78 - t * 0.48);
            case "ocean":
                return hslToRgb(190 + t * 45, 0.72, 0.58 - t * 0.22);
        }
        const hue = 30 + t * 180;
        const lightness = (60 - t * 25) / 100;
        return hslToRgb(hue, 0.7, lightness);
    }

    function createRuleSwitchingCA(options) {
        const canvas = options.canvas;
        const ctx = canvas.getContext("2d");
        const ruleInputs = options.ruleInputs || [];
        const sequenceInput = options.sequenceInput;
        const initialRules = options.initialRules;
        const ruleCount = initialRules.length;
        const initialSequence = normalizeSequence(options.sequence, ruleCount, [1]);
        const gridSize = options.gridSize ?? 112;
        const cellSize = options.cellSize ?? 1;
        const interval = options.stepInterval ?? 90;
        const randomResetFrames = options.randomResetFrames ?? 0;
        const resetWhenEmpty = options.resetWhenEmpty ?? false;
        const fillProbability = options.fillProbability ?? 0.2;
        const randomizeAllStates = options.randomizeAllStates ?? false;
        const randomStateCount = options.randomStateCount ?? 2;
        const random = options.random ?? Math.random;
        const palette = options.palette ?? "default";
        const paletteInput = options.paletteInput;
        const providedInitialState = options.initialState;
        const StateArray = options.stateArrayType ?? (providedInitialState instanceof Float64Array ? Float64Array : Uint8Array);
        const controls = options.controls || {};
        const status = options.status || {};
        const startStopButton = controls.startStop;
        const stepButton = controls.step;
        const resetButton = controls.reset;
        const targetButton = controls.target;
        const generationEl = status.generation;
        const currentRuleEl = status.currentRule;
        const aliveEl = status.alive;

        let state;
        let generation = 0;
        let targetMode = false;
        let timer = null;
        let suspended = false;
        let resumeAfterSuspend = false;
        const pixelSize = gridSize * cellSize;

        canvas.width = pixelSize;
        canvas.height = pixelSize;
        ctx.imageSmoothingEnabled = false;
        if (options.yAxisUp) ctx.setTransform(1, 0, 0, -1, 0, pixelSize);
        if (paletteInput) {
            paletteInput.textContent = "";
            for (const [value, label] of paletteOptions) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                paletteInput.appendChild(option);
            }
            const normalized = String(palette || "default").toLowerCase();
            paletteInput.value = paletteOptions.some(([value]) => value === normalized) ? normalized : "default";
        }

        ruleInputs.forEach((input, index) => {
            input.value = initialRules[index];
        });

        if (sequenceInput) sequenceInput.value = initialSequence.map(value => value <= 61 ? '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[value - 1] : `[${value}]`).join("");

        function readRules() {
            return ruleInputs.length ? ruleInputs.map((input, index) => input.value || initialRules[index] || "") : initialRules;
        }

        function readSequence() {
            return normalizeSequence(sequenceInput ? sequenceInput.value : initialSequence, ruleCount, initialSequence);
        }

        function draw() {
            const image = ctx.createImageData(pixelSize, pixelSize);
            const displayStates = Math.max(2, ...readRules().map((text) => parseRule(text).states));
            const activePalette = paletteInput ? (paletteInput.value || palette).toLowerCase() : palette;
            let alive = 0;
            for (let i = 0; i < state.length; i += 1) {
                const value = state[i];
                const cellX = (i % gridSize) * cellSize;
                const row = Math.floor(i / gridSize);
                const cellY = (options.yAxisUp ? gridSize - 1 - row : row) * cellSize;
                const [red, green, blue] = colorForState(value, displayStates, activePalette);
                if (value === 1) {
                    alive += 1;
                }
                for (let y = 0; y < cellSize; y += 1) {
                    let offset = ((cellY + y) * pixelSize + cellX) * 4;
                    for (let x = 0; x < cellSize; x += 1) {
                        image.data[offset] = red;
                        image.data[offset + 1] = green;
                        image.data[offset + 2] = blue;
                        image.data[offset + 3] = 255;
                        offset += 4;
                    }
                }
            }
            ctx.putImageData(image, 0, 0);
            const sequence = readSequence();
            if (generationEl) generationEl.textContent = String(generation);
            if (currentRuleEl) currentRuleEl.textContent = `R${sequence[generation % sequence.length]}`;
            if (aliveEl) aliveEl.textContent = String(alive);
            if (options.onDraw) options.onDraw({ state, generation, gridSize, cellSize, targetMode });
        }

        function randomFill(useProvidedInitialState = true) {
            targetMode = false;
            if (targetButton) targetButton.setAttribute("aria-pressed", "false");
            if (useProvidedInitialState && providedInitialState && providedInitialState.length === gridSize * gridSize) {
                state = new StateArray(providedInitialState);
            } else {
                state = new StateArray(gridSize * gridSize);
                for (let i = 0; i < state.length; i += 1) {
                    if (randomizeAllStates) state[i] = Math.floor(random() * randomStateCount);
                    else state[i] = random() < fillProbability ? 1 : 0;
                }
            }
            generation = 0;
            draw();
        }

        function showTarget() {
            state = new StateArray(options.targetState());
            generation = 0;
            targetMode = true;
            if (targetButton) targetButton.setAttribute("aria-pressed", "true");
            draw();
            start();
        }

        function step() {
            const sequence = readSequence();
            const ruleIndex = sequence[generation % sequence.length] - 1;
            const rule = parseRule(readRules()[ruleIndex]);
            const next = new StateArray(state.length);
            for (let y = 0; y < gridSize; y += 1) {
                for (let x = 0; x < gridSize; x += 1) {
                    const index = y * gridSize + x;
                    let neighbors = 0;
                    for (let dy = -1; dy <= 1; dy += 1) {
                        for (let dx = -1; dx <= 1; dx += 1) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = (x + dx + gridSize) % gridSize;
                            const ny = (y + dy + gridSize) % gridSize;
                            if (state[ny * gridSize + nx] === 1) neighbors += 1;
                        }
                    }
                    const current = state[index];
                    if (current === 1) {
                        if (rule.survive.has(neighbors)) next[index] = 1;
                        else next[index] = rule.states > 2 ? 2 : 0;
                    } else if (current === 0) {
                        next[index] = rule.born.has(neighbors) ? 1 : 0;
                    } else {
                        next[index] = current + 1 < rule.states ? current + 1 : 0;
                    }
                }
            }
            if (!targetMode && resetWhenEmpty && next.every((value) => value === 0)) {
                randomFill();
                return;
            }
            state = next;
            generation += 1;
            if (!targetMode && randomResetFrames && generation >= randomResetFrames) {
                randomFill(false);
                return;
            }
            draw();
        }

        function start() {
            if (timer !== null) return;
            if (suspended || document.visibilityState === "hidden") {
                suspended = true;
                resumeAfterSuspend = true;
                return;
            }
            if (startStopButton) startStopButton.textContent = "Stop";
            timer = window.setInterval(step, interval);
        }

        function stop() {
            if (timer !== null) window.clearInterval(timer);
            timer = null;
            if (startStopButton) startStopButton.textContent = "Start";
        }

        function suspend() {
            if (suspended) return;
            suspended = true;
            resumeAfterSuspend = timer !== null;
            if (timer !== null) stop();
        }

        function resume() {
            if (!suspended) return;
            const shouldResume = resumeAfterSuspend;
            suspended = false;
            resumeAfterSuspend = false;
            if (shouldResume) start();
        }

        function toggle() {
            if (timer !== null) stop();
            else start();
        }

        if (startStopButton) startStopButton.addEventListener("click", toggle);
        if (stepButton) {
            stepButton.addEventListener("click", () => {
                stop();
                step();
            });
        }
        if (resetButton) resetButton.addEventListener("click", randomFill);
        if (targetButton) targetButton.addEventListener("click", showTarget);
        [...ruleInputs, sequenceInput, paletteInput].filter(Boolean).forEach((input) => input.addEventListener("input", draw));
        if (paletteInput) paletteInput.addEventListener("change", draw);

        randomFill();
        if (startStopButton) startStopButton.textContent = "Start";
        if (options.initialRunning) start();

        return { start, stop, toggle, step, reset: randomFill, randomFill, showTarget, draw, suspend, resume };
    }

    window.RuleSwitchingCA = { create: createRuleSwitchingCA, parseRule };
})();
