const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const archive = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(archive, name), 'utf8');
const api = require('../assets/oblique_demo.js');
const list = read('index.html');
const links = [...list.matchAll(/class="ca-oblique-rule-link"\s+href="([^"]+)"/g)]
    .map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://archive.test/'));

test('every archived record matches its TXT expression and supplies a complete demo', () => {
    const lines = read('oblique_list.txt').trimEnd().split(/\r?\n/);
    assert.equal(lines.length, 4798);
    assert.equal(links.length, lines.length);
    assert.equal(new Set(lines).size, lines.length);
    const rows = [...list.matchAll(/<tr data-dx="(\d+)" data-dy="(\d+)">([\s\S]*?)<\/tr>/g)];
    assert.equal(rows.length, links.length);
    links.forEach((link, index) => {
        assert.equal(link.pathname, '/oblique_demo.html');
        assert.equal(link.searchParams.get('ca'), lines[index]);
        assert.doesNotMatch(lines[index].split('; Init ')[1], /[.*]/);
        for (const field of ['period', 'dx', 'dy', 'maxNonzero', 'gridSize']) {
            assert.ok(link.searchParams.has(field), `${index + 1}: ${field}`);
        }
        const design = api.parseDesign(link.search);
        assert.ok(design.pattern.length);
        assert.equal(design.period % api.parseNotation(design.notation).sequenceValues.length, 0);
        assert.equal(Math.abs(design.displacement.dx), Number(rows[index][1]));
        assert.equal(Math.abs(design.displacement.dy), Number(rows[index][2]));
        assert.equal(Number(rows[index][3].match(/<td>(\d+)<\/td>/)[1]), index + 1);
    });
    assert.deepEqual(api.parseNotation('B/S/C2; Seq 1; Init 0').pattern, []);
    for (const initial of ['.1', '1000*0', '0*1000']) {
        assert.throws(() => api.parseNotation(`B/S/C2; Seq 1; Init ${initial}`));
    }
});

test('the pages and demo scripts are self-contained and their local links resolve', () => {
    for (const name of ['index.html', 'oblique_demo.html']) {
        const html = read(name);
        assert.doesNotMatch(html, /fetch\(|\.\.\/|<script[^>]*src="https?:/);
        for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
            const url = new URL(match[1].replaceAll('&amp;', '&'), 'https://archive.test/');
            if (['https://www.kazuhirotanimoto.com/', 'https://www.kazuhirotanimoto.com/research/rule_switching_ca/'].includes(url.href)) continue;
            assert.equal(url.origin, 'https://archive.test');
            assert.ok(fs.existsSync(path.join(archive, decodeURIComponent(url.pathname))), `${name}: ${url.pathname}`);
        }
    }
    assert.deepEqual([...read('oblique_demo.html').matchAll(/<script src="([^"]+)"/g)].map(match => match[1]), [
        'assets/rule_switching_ca_core.js', 'assets/single_rule_oblique_spaceship_trail.js', 'assets/oblique_demo.js',
    ]);
    assert.ok(read('oblique_demo.html').includes('id="minimal-oblique-demo"'));
    for (const name of ['README.md', 'rule_sequence_ca_notation.md', 'rule_sequence_canonical.py']) {
        assert.ok(fs.existsSync(path.join(archive, name)), name);
    }
    for (const name of ['normalization.md', 'rule_sequence_ca_notation_v5.md']) {
        assert.equal(fs.existsSync(path.join(archive, name)), false, name);
    }
    for (const name of ['README.md', 'rule_sequence_ca_notation.md']) {
        for (const match of read(name).matchAll(/\]\(([^)]+)\)/g)) {
            const url = new URL(match[1], `https://archive.test/${name}`);
            if (url.origin !== 'https://archive.test') continue;
            const target = path.join(archive, decodeURIComponent(url.pathname));
            assert.ok(fs.existsSync(target), `${name}: ${match[1]}`);
            if (url.hash) {
                const headings = [...fs.readFileSync(target, 'utf8').matchAll(/^#{1,6} (.+)$/gm)]
                    .map(heading => heading[1].toLowerCase().replace(/[^a-z0-9 -]/g, '').replaceAll(' ', '-'));
                assert.ok(headings.includes(url.hash.slice(1)), `${name}: ${match[1]}`);
            }
        }
    }
});

test('random demos generate binary boards, reset freshly and preserve large refractory states', () => {
    function mount(initial) {
        const elements = new Map(), timers = new Map();
        let frame, simulator, options, randomCalls = 0, seed = 12345, timerId = 0;
        const context = {
            createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            putImageData() {}, setTransform() {},
            save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {},
        };
        function element() {
            const node = { value: '', textContent: '', children: [], listeners: {},
                append(...children) { this.children.push(...children); },
                appendChild(child) { this.append(child); },
                setAttribute() {}, getContext: () => context,
                addEventListener(name, callback) { this.listeners[name] = callback; },
                click() { this.listeners.click?.({ type: 'click' }); },
            };
            Object.defineProperty(node, 'id', { set(value) { elements.set(value, node); } });
            return node;
        }
        const slot = element();
        elements.set('minimal-oblique-demo', slot);
        const document = { visibilityState: 'visible', createElement: element,
            getElementById: id => elements.get(id), addEventListener() {},
        };
        const window = { location: { search: new URLSearchParams({ ca: `B/S/C400; Seq 1; Init ${initial}` }).toString() },
            setInterval(callback) { timers.set(++timerId, callback); return timerId; },
            clearInterval(id) { timers.delete(id); },
        };
        const math = Object.create(Math);
        math.random = () => { randomCalls++; seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
        const sandbox = vm.createContext({ window, document, Math: math, URLSearchParams });
        vm.runInContext(read('assets/rule_switching_ca_core.js'), sandbox);
        const create = window.RuleSwitchingCA.create;
        window.RuleSwitchingCA.create = value => {
            options = value;
            simulator = create({ ...value, cellSize: 1, onDraw(value) { frame = value; options.onDraw(value); } });
            return simulator;
        };
        vm.runInContext(read('assets/single_rule_oblique_spaceship_trail.js'), sandbox);
        vm.runInContext(read('assets/oblique_demo.js'), sandbox);
        assert.equal(slot.textContent, '', 'random demo mounted without an error');
        assert.ok(simulator);
        return { options, simulator, timers, elements, frame: () => frame, randomCalls: () => randomCalls };
    }
    for (const [initial, density] of [['Random 0%', 0], ['Random(0.2)', 0.2], ['Random 100%', 1]]) {
        const demo = mount(initial);
        const first = Array.from(demo.frame().state);
        assert.equal(demo.randomCalls(), 10000);
        assert.equal(demo.frame().state.constructor.name, 'Float64Array');
        assert.ok(first.every(state => state === 0 || state === 1));
        if (density === 0 || density === 1) assert.ok(first.every(state => state === density));
        else assert.ok(first.filter(Boolean).length > 1500 && first.filter(Boolean).length < 2500);
        assert.equal(demo.timers.size, 1);
        demo.options.ruleInputs[0].value = 'B/S0/C400';
        demo.options.sequenceInput.value = '11';
        demo.elements.get('minimal-palette').value = 'monochrome';
        demo.options.controls.reset.click();
        assert.equal(demo.randomCalls(), 20000);
        assert.equal(demo.frame().generation, 0);
        assert.equal(demo.timers.size, 1, 'Reset preserves playback');
        assert.equal(demo.options.ruleInputs[0].value, 'B/S0/C400');
        assert.equal(demo.options.sequenceInput.value, '11');
        assert.equal(demo.elements.get('minimal-palette').value, 'monochrome');
        if (density === 0 || density === 1) assert.ok(demo.frame().state.every(state => state === density));
        else assert.notDeepEqual(Array.from(demo.frame().state), first);
        demo.simulator.stop();
        demo.options.controls.reset.click();
        assert.equal(demo.timers.size, 0, 'Reset preserves pause');
        if (density === 1) {
            for (let generation = 0; generation < 300; generation++) demo.simulator.step();
            assert.ok(demo.frame().state.every(state => state === 301), 'refractory states do not wrap at 256');
        }
    }
});

test('representative archived seeds reproduce their full-state displacement, period and population', () => {
    const window = { setInterval() { return 1; }, clearInterval() {} };
    vm.runInNewContext(read('assets/rule_switching_ca_core.js'), { window, document: { visibilityState: 'visible' } });
    const representatives = new Map();
    for (const link of links) {
        const design = api.parseDesign(link.search);
        const alternating = design.sequence === Array.from({ length: design.rules.length }, (_, i) => i + 1).join('');
        const category = `${design.rules.length}-${alternating ? 'alternating' : 'sequence'}`;
        if (!representatives.has(category)) representatives.set(category, design);
    }
    assert.ok(representatives.size >= 5);
    for (const [category, design] of representatives) {
        const size = design.gridSize;
        const initial = api.centeredState(design, size);
        let frame;
        const context = {
            createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            putImageData() {}, setTransform() {},
        };
        const simulator = window.RuleSwitchingCA.create({
            canvas: { getContext: () => context }, initialState: initial,
            initialRules: design.rules, sequence: design.sequence,
            gridSize: size, cellSize: 1, yAxisUp: true,
            onDraw(value) { frame = value; },
        });
        let maximum = 0;
        for (let generation = 0; generation < design.period; generation++) {
            maximum = Math.max(maximum, frame.state.reduce((count, state) => count + Number(state !== 0), 0));
            simulator.step();
        }
        const expected = new Float64Array(initial.length);
        const wrap = value => (value % size + size) % size;
        initial.forEach((state, index) => {
            expected[wrap(Math.floor(index / size) + Math.abs(design.displacement.dy)) * size +
                wrap(index % size + Math.abs(design.displacement.dx))] = state;
        });
        assert.deepEqual(Array.from(frame.state), Array.from(expected), category);
        assert.equal(maximum, design.maxNonzero, category);
    }
});
