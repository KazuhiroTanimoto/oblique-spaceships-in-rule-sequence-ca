(() => {
    'use strict';

    const symbols = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    function encodeSymbol(value) {
        return value <= 61 ? symbols[value] : '[' + value + ']';
    }

    function parseTokens(text, limit = Infinity) {
        const values = [];
        const token = /(\[\d+\]|[0-9A-Za-z])/y;
        let offset = 0;
        while (offset < text.length) {
            token.lastIndex = offset;
            const match = token.exec(text);
            if (!match) throw new Error('Invalid sequence or initial state symbol.');
            const symbol = match[1];
            const value = symbol[0] === '[' ? Number(symbol.slice(1, -1)) : symbols.indexOf(symbol);
            if (!Number.isSafeInteger(value) || values.length >= limit) {
                throw new Error('Invalid or oversized initial configuration.');
            }
            values.push(value);
            offset = token.lastIndex;
        }
        if (!values.length) throw new Error('Empty sequence or initial row.');
        return values;
    }

    function parseNotation(text, maxSize = Infinity) {
        const sections = text.split(';').map(section => section.trim());
        if (sections.length < 2 || sections.length > 3) throw new Error('Expected rules; Seq; optional Init.');
        const rules = sections[0].split(',').map(rule => rule.trim());
        if (!rules.every(rule => {
            const match = /^B[0-8]*\/S[0-8]*\/C(\d+)$/.exec(rule);
            return match && Number.isSafeInteger(Number(match[1])) && Number(match[1]) >= 2;
        })) throw new Error('Invalid B/S/C rule.');
        const sequenceSection = /^Seq\s+(.+)$/.exec(sections[1]);
        if (!sequenceSection) throw new Error('Missing Seq section.');
        const sequenceValues = parseTokens(sequenceSection[1]);
        if (sequenceValues.some(value => value < 1 || value > rules.length)) throw new Error('Sequence references an undefined rule.');
        const sequence = sequenceValues.map(encodeSymbol).join('');
        let pattern = null, randomDensity = null;
        if (sections.length === 3) {
            const initialSection = /^Init\s+(.+)$/.exec(sections[2]);
            if (!initialSection) throw new Error('Invalid Init section.');
            if (/^Random\b/.test(initialSection[1])) {
                const match = /^Random(?:\s+(\d+(?:\.\d*)?|\.\d+)\s*%|\s*\(\s*(\d+(?:\.\d*)?|\.\d+)\s*\))$/.exec(initialSection[1]);
                if (!match) throw new Error('Invalid random initial configuration.');
                randomDensity = match[1] !== undefined ? Number(match[1]) / 100 : Number(match[2]);
                if (!Number.isFinite(randomDensity) || randomDensity < 0 || randomDensity > 1) {
                    throw new Error('Random density must be between 0 and 1 (0% to 100%).');
                }
            } else {
                const rows = initialSection[1].split('/').map(row => parseTokens(row.trim(), maxSize));
                if (rows.length > maxSize) throw new Error('Initial configuration exceeds the demo grid.');
                pattern = [];
                for (let y = 0; y < rows.length; y++) {
                    rows[rows.length - 1 - y].forEach((state, x) => {
                        if (state) pattern.push({x, y, state});
                    });
                }
            }
        }
        return { rules, sequence, sequenceValues, pattern, randomDensity };
    }

    function parseDesign(search) {
        const params = new URLSearchParams(search);
        const gridSize = Number(params.get('gridSize') ?? 100);
        if (![100,120,150,200,300,600].includes(gridSize)) throw new Error('Invalid demo grid size.');
        const notation = params.get('ca') || '';
        const { rules, sequence, sequenceValues, pattern, randomDensity } = parseNotation(notation, gridSize);
        const optionalNumber = name => params.has(name) ? Number(params.get(name)) : null;
        const period = optionalNumber('period');
        const displacement = { dx: optionalNumber('dx'), dy: optionalNumber('dy') };
        const maxNonzero = optionalNumber('maxNonzero');
        if (period !== null && (!Number.isSafeInteger(period) || period < 1 || period % sequenceValues.length !== 0) ||
            Object.values(displacement).some(value => value !== null && !Number.isSafeInteger(value)) ||
            maxNonzero !== null && (!Number.isSafeInteger(maxNonzero) || maxNonzero < 1) ||
            randomDensity === null && (!pattern || !pattern.length)) {
            throw new Error('Invalid demo link.');
        }
        return { rules, sequence, period, displacement, maxNonzero, gridSize, pattern, randomDensity, notation };
    }

    function centeredState(design, size) {
        const sx = Math.sign(design.displacement.dx) || 1, sy = Math.sign(design.displacement.dy) || 1;
        const pattern = design.pattern.map(p => ({ x: sx*p.x, y: sy*p.y, state: p.state }));
        const minX = Math.min(...pattern.map(p => p.x)), maxX = Math.max(...pattern.map(p => p.x));
        const minY = Math.min(...pattern.map(p => p.y)), maxY = Math.max(...pattern.map(p => p.y));
        if (maxX - minX >= size || maxY - minY >= size) throw new Error('Pattern exceeds the demo grid.');
        const ox = Math.floor((size - (maxX - minX + 1))/2) - minX;
        const oy = Math.floor((size - (maxY - minY + 1))/2) - minY;
        const state = new Float64Array(size*size);
        for (const p of pattern) state[(p.y + oy)*size + p.x + ox] = p.state;
        return state;
    }

    function mount(design, slot) {
        const demo = document.createElement('div');
        demo.className = 'ca-example-demo ca-oblique-rule-demo ca-large-ui-demo';
        const controls = document.createElement('div');
        controls.className = 'ca-example-controls ca-controls';
        function input(labelText, id, value) {
            const field = document.createElement('input');
            field.id = id; field.type = 'text'; field.spellcheck = false; field.value = value;
            const label = document.createElement('label');
            label.htmlFor = id; label.append(labelText, field); controls.append(label);
            return field;
        }
        const ruleInputs = design.rules.map((rule, i) => input(`Rule ${i+1} (B/S/C)`, `minimal-rule-${i+1}`, rule));
        const sequenceInput = input('Sequence', 'minimal-sequence', design.sequence);
        const buttons = ['Start', 'Step', 'Reset'].map(text => {
            const button = document.createElement('button');
            button.type = 'button'; button.textContent = text; controls.append(button);
            return button;
        });
        const paletteInput = document.createElement('select');
        paletteInput.id = 'minimal-palette';
        const paletteLabel = document.createElement('label');
        paletteLabel.htmlFor = paletteInput.id; paletteLabel.className = 'ca-palette-control';
        paletteLabel.append('State color set', paletteInput); controls.append(paletteLabel);

        const canvas = document.createElement('canvas');
        canvas.className = 'ca-large-ui-canvas';
        canvas.setAttribute('aria-label', 'Cellular automaton simulation with its trajectory');
        const stage = document.createElement('div');
        stage.className = 'ca-example-stage ca-large-ui-stage';
        const caption = document.createElement('div');
        caption.className = 'ca-example-caption';
        const details = [];
        if (design.randomDensity !== null) details.push(`Init Random(${design.randomDensity})`);
        if (design.period !== null && design.displacement.dx !== null && design.displacement.dy !== null) {
            details.push(`(${Math.abs(design.displacement.dx)},${Math.abs(design.displacement.dy)})c/${design.period}`);
        }
        if (design.maxNonzero !== null) details.push(`maximum number of nonzero cells ${design.maxNonzero}`);
        caption.textContent = `${design.rules.join(', ')}; Seq ${design.sequence}` + (details.length ? ` ／ ${details.join(', ')}` : '');
        stage.append(canvas, caption); demo.append(controls, stage); slot.append(demo);
        const simulator = window.RuleSwitchingCA.create({
            canvas, ruleInputs, sequenceInput, initialRules: design.rules, sequence: design.sequence,
            initialState: design.pattern ? centeredState(design, design.gridSize) : undefined,
            fillProbability: design.randomDensity ?? undefined, stateArrayType: Float64Array,
            gridSize: design.gridSize, cellSize: 600/design.gridSize, yAxisUp: true,
            stepInterval: 100, initialRunning: true, palette: 'default', paletteInput,
            controls: { startStop: buttons[0], step: buttons[1], reset: buttons[2] },
            onDraw: window.SingleRuleObliqueTrail.createOverlay(canvas, design.period ?? 1),
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') simulator.suspend();
            else simulator.resume();
        });
        return simulator;
    }

    if (typeof module !== 'undefined') {
        module.exports = { parseNotation, parseDesign, centeredState };
    } else {
        const slot = document.getElementById('minimal-oblique-demo');
        try { mount(parseDesign(window.location.search), slot); }
        catch (error) { slot.textContent = error.message; }
    }
})();
