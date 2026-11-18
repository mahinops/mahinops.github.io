/* viz.js - tiny shared engine for the step-by-step visual pages.
 * No dependencies. Works offline (open the .html file in a browser).
 *
 * Core idea: an algorithm is turned into an array of "steps" (snapshots).
 * The stepper lets you Play / Pause / Step / Back / Reset / scrub through them.
 *
 *   const s = Viz.stepper({
 *     mount: '#app',                    // element or selector
 *     code: ['func f() {', '  ...', '}'],   // optional Go source lines, shown with the active line highlighted
 *     render(step, i, body) { ... },    // draw the snapshot into `body` (a div, already emptied)
 *   });
 *   s.load([{ text: 'what is happening', line: 3, ...yourState }, ...]);
 *
 * step.text  : plain-English sentence shown under the animation
 * step.line  : 0-based index into `code` to highlight (optional; can be an array of indexes)
 */
(function () {
  'use strict';

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function $(sel, root) {
    return typeof sel === 'string' ? (root || document).querySelector(sel) : sel;
  }

  /* ---------- stepper ---------- */
  /* UI labels. Pages with <html lang="bn"> get Bengali labels. */
  var BN = document.documentElement.lang === 'bn';
  var T = BN
    ? { reset: '⏮ Reset', resetTip: 'শুরুর ধাপে ফিরে যান', back: '◀ Back', backTip: 'এক ধাপ পেছনে', play: '▶ Play', pause: '⏸ Pause', playTip: 'Play / Pause', next: 'Next ▶', nextTip: 'এক ধাপ সামনে', slow: 'Slow', normal: 'Normal', fast: 'Fast', step: 'ধাপ' }
    : { reset: '⏮ Reset', resetTip: 'Back to the start', back: '◀ Back', backTip: 'One step back', play: '▶ Play', pause: '⏸ Pause', playTip: 'Play / pause', next: 'Step ▶', nextTip: 'One step forward', slow: 'Slow', normal: 'Normal', fast: 'Fast', step: 'Step' };

  function stepper(opts) {
    var mount = $(opts.mount);
    var steps = [];
    var idx = 0;
    var timer = null;
    var speedMs = 900;

    var body = el('div', { class: 'viz-body', 'aria-live': 'polite' });
    var text = el('div', { class: 'viz-text' });
    var codeBox = null;
    var codeLines = [];
    if (opts.code && opts.code.length) {
      codeBox = el('pre', { class: 'viz-code' });
      opts.code.forEach(function (line, n) {
        var row = el('div', { class: 'viz-code-line' }, [
          el('span', { class: 'viz-code-no', text: String(n + 1) }),
          el('span', { class: 'viz-code-src', text: line === '' ? ' ' : line }),
        ]);
        codeLines.push(row);
        codeBox.appendChild(row);
      });
    }

    var btnReset = el('button', { class: 'viz-btn', title: T.resetTip, text: T.reset, onclick: function () { pause(); go(0); } });
    var btnBack = el('button', { class: 'viz-btn', title: T.backTip, text: T.back, onclick: function () { pause(); go(idx - 1); } });
    var btnPlay = el('button', { class: 'viz-btn viz-primary', title: T.playTip, text: T.play, onclick: toggle });
    var btnNext = el('button', { class: 'viz-btn', title: T.nextTip, text: T.next, onclick: function () { pause(); go(idx + 1); } });
    var slider = el('input', {
      type: 'range', min: '0', max: '0', value: '0', class: 'viz-slider', 'aria-label': T.step,
      oninput: function () { pause(); go(parseInt(slider.value, 10)); },
    });
    var counter = el('span', { class: 'viz-counter' });
    var speed = el('select', {
      class: 'viz-select', 'aria-label': 'Speed',
      onchange: function () { speedMs = parseInt(speed.value, 10); if (timer) { pause(); play(); } },
    }, [
      el('option', { value: '1800', text: T.slow }),
      el('option', { value: '900', text: T.normal, selected: true }),
      el('option', { value: '400', text: T.fast }),
    ]);
    speed.value = '900';

    var controls = el('div', { class: 'viz-controls' }, [btnReset, btnBack, btnPlay, btnNext, speed, slider, counter]);
    var stage = el('div', { class: 'viz-stage' }, [body, text]);
    var layout = el('div', { class: 'viz-layout' + (codeBox ? ' viz-has-code' : '') }, [stage, codeBox]);
    mount.classList.add('viz-root');
    mount.appendChild(controls);
    mount.appendChild(layout);

    function paint() {
      var step = steps[idx];
      body.innerHTML = '';
      if (!step) { text.textContent = ''; counter.textContent = '0 / 0'; return; }
      opts.render(step, idx, body);
      text.textContent = step.text || '';
      counter.textContent = T.step + ' ' + (idx + 1) + ' / ' + steps.length;
      slider.max = String(Math.max(0, steps.length - 1));
      slider.value = String(idx);
      var active = step.line === undefined ? [] : [].concat(step.line);
      codeLines.forEach(function (row, n) { row.classList.toggle('viz-active', active.indexOf(n) !== -1); });
      btnBack.disabled = idx === 0;
      btnNext.disabled = idx >= steps.length - 1;
    }
    function go(n) {
      idx = Math.max(0, Math.min(steps.length - 1, n));
      paint();
    }
    function play() {
      if (!steps.length) return;
      if (idx >= steps.length - 1) go(0);
      btnPlay.textContent = T.pause;
      timer = setInterval(function () {
        if (idx >= steps.length - 1) { pause(); return; }
        go(idx + 1);
      }, speedMs);
    }
    function pause() {
      if (timer) { clearInterval(timer); timer = null; }
      btnPlay.textContent = T.play;
    }
    function toggle() { if (timer) pause(); else play(); }

    return {
      load: function (newSteps) { pause(); steps = newSteps || []; idx = 0; paint(); },
      go: go, play: play, pause: pause,
      get index() { return idx; },
    };
  }

  /* ---------- drawing helpers ---------- */

  /* A row of boxes. cells: array of values.
   * o.marks   : { index: 'label' | ['lo','mid'] }  -> arrows under the cell
   * o.classes : { index: 'found' | 'dim' | 'hit' | 'range' ... } -> extra CSS class(es)
   * o.indexes : show index numbers (default true)
   * o.title   : small caption on the left */
  function array(cells, o) {
    o = o || {};
    var row = el('div', { class: 'viz-array' });
    if (o.title) row.appendChild(el('div', { class: 'viz-array-title', text: o.title }));
    var wrap = el('div', { class: 'viz-cells' });
    cells.forEach(function (v, i) {
      var cls = 'viz-cell';
      if (o.classes && o.classes[i]) cls += ' ' + o.classes[i];
      var marks = o.marks && o.marks[i] !== undefined ? [].concat(o.marks[i]) : [];
      wrap.appendChild(el('div', { class: 'viz-col' }, [
        el('div', { class: cls, text: v === null || v === undefined ? '' : String(v) }),
        o.indexes === false ? null : el('div', { class: 'viz-idx', text: String(i) }),
        el('div', { class: 'viz-marks' }, marks.map(function (m) { return el('div', { class: 'viz-mark viz-mark-' + String(m).replace(/[^a-z0-9]/gi, ''), text: '↑ ' + m }); })),
      ]));
    });
    row.appendChild(wrap);
    return row;
  }

  /* A named box (a variable): label on top, value inside, optional address under it. */
  function varBox(name, value, o) {
    o = o || {};
    return el('div', { class: 'viz-var ' + (o.class || '') }, [
      el('div', { class: 'viz-var-name', text: name }),
      el('div', { class: 'viz-var-val', text: String(value) }),
      o.addr ? el('div', { class: 'viz-var-addr', text: o.addr }) : null,
    ]);
  }

  function legend(items) {
    return el('div', { class: 'viz-legend' }, items.map(function (it) {
      return el('span', { class: 'viz-legend-item' }, [el('i', { class: 'viz-swatch ' + it.cls }), ' ' + it.label]);
    }));
  }

  function note(html) { return el('div', { class: 'viz-note', html: html }); }

  /* SVG helper: svg(w,h,[children]) and s(tag, attrs, children) */
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, children) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function svg(w, h, children) {
    var n = s('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', class: 'viz-svg', role: 'img' }, children);
    n.style.maxWidth = w + 'px';
    return n;
  }

  /* Parse "1, 3, 5" or "1 3 5" into numbers (ignores junk). */
  function parseNums(str) {
    return String(str).split(/[\s,]+/).filter(Boolean).map(Number).filter(function (n) { return !Number.isNaN(n); });
  }

  window.Viz = { el: el, $: $, stepper: stepper, array: array, varBox: varBox, legend: legend, note: note, svg: svg, s: s, parseNums: parseNums };
})();
