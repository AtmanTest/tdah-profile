/**
 * dashboard.js — Dashboard scores en temps réel (radar chart)
 * Visualise les scores des 5 auto-tests TDAH avec chart canvas
 * Auto-initialisation, localStorage, dark mode
 */
(function(){
  'use strict';

  function init(){
    var app = document.getElementById('dashboard-app');
    if(!app) return;
    render(app);
  }

  // Tests definitions
  var TESTS = [
    {id:'asrs',    name:'ASRS-V1.1',      short:'ASRS',    max:24,  seuil:14, color:'#5a7fba', desc:'TDAH Adulte — 6 items'},
    {id:'wurs',    name:'WURS-25',        short:'WURS',    max:100, seuil:36, color:'#6fa86f', desc:'Échelle rétrospective enfance — 25 items'},
    {id:'bdi',     name:'BDI-II',         short:'BDI',     max:63,  seuil:29, color:'#c97a5a', desc:'Dépression — 21 items'},
    {id:'mdq',     name:'MDQ',            short:'MDQ',     max:13,  seuil:7,  color:'#b87ab8', desc:'Spectre bipolaire — 13 items'},
    {id:'border',  name:'Borderline',     short:'BPD',     max:9,   seuil:5,  color:'#d4a040', desc:'Trouble personnalité limite — 9 critères'}
  ];

  var STORAGE_KEY = 'tdah_dashboard_scores';

  function loadScores(){
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      return d;
    } catch(e){ return {}; }
  }

  function saveScores(data){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e){}
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function render(app){
    var scores = loadScores();
    var html = '';

    // === Section title ===
    html += '<div class="dash-intro" style="font-size:.85rem;color:var(--text-sec);margin-bottom:1.2rem">' +
      'Renseigne tes scores pour visualiser ton profil en un coup d\'œil. ' +
      'Les scores sont sauvegardés automatiquement.' +
      '</div>';

    // === Radar chart canvas ===
    html += '<div class="dash-chart-wrap" style="display:flex;justify-content:center;margin-bottom:1.5rem">' +
      '<canvas id="dash-radar" width="340" height="340" style="max-width:340px;width:100%;height:auto;aspect-ratio:1"></canvas>' +
      '</div>';

    // === Score inputs ===
    html += '<div class="dash-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.7rem">';

    TESTS.forEach(function(t){
      var val = scores[t.id] !== undefined ? scores[t.id] : '';
      var pct = val !== '' ? Math.round((val / t.max) * 100) : 0;
      var above = val !== '' ? (parseFloat(val) >= t.seuil ? 1 : 0) : -1;

      html += '<div class="dash-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:.9rem 1rem">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">' +
          '<span style="font-weight:700;font-size:.85rem;color:var(--text)">' + esc(t.name) + '</span>' +
          '<span style="font-size:.6rem;color:' + t.color + ';font-weight:600;background:' + t.color + '15;padding:.1rem .45rem;border-radius:4px">' + esc(t.short) + '</span>' +
        '</div>' +
        '<div style="font-size:.65rem;color:var(--text-light);margin-bottom:.55rem">' + esc(t.desc) + ' · Seuil ≥ ' + t.seuil + '</div>' +
        '<div style="display:flex;align-items:center;gap:.5rem">' +
          '<input type="number" id="dash-input-' + t.id + '" value="' + esc(val) + '" min="0" max="' + t.max + '" step="1" ' +
            'style="width:70px;padding:.35rem .45rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:.85rem;font-family:var(--font)" ' +
            'data-testid="' + t.id + '">' +
          '<span style="font-size:.7rem;color:var(--text-light)">/ ' + t.max + '</span>' +
          (above === 1 ? '<span style="font-size:.7rem;font-weight:600;color:#6fa86f">⚠ Seuil</span>' : '') +
          (above === 0 ? '<span style="font-size:.7rem;color:var(--text-light)">✓ Sous seuil</span>' : '') +
        '</div>' +
        '<div class="dash-bar-wrap" style="margin-top:.5rem;height:5px;background:var(--border);border-radius:3px;overflow:hidden">' +
          '<div class="dash-bar-fill" style="height:100%;width:' + pct + '%;background:' + t.color + ';border-radius:3px;transition:width .4s ease"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:.2rem;font-size:.6rem;color:var(--text-light)">' +
          '<span>0</span>' +
          '<span style="font-weight:' + (pct >= 50 ? '700' : '400') + ';color:' + (pct >= 50 ? 'var(--accent)' : 'var(--text-light)') + '">' + pct + '%</span>' +
          '<span>' + t.max + '</span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>';

    // === Auto-save + short summary ===
    html += '<div class="dash-summary" style="margin-top:1rem;padding:.8rem 1rem;background:var(--accent-soft);border-radius:var(--radius-sm);font-size:.75rem;color:var(--text-sec)">' +
      '<span id="dash-summary-text">' +
        calcSummary(scores) +
      '</span>' +
      '<button id="dash-reset" style="margin-left:.8rem;background:transparent;border:1px solid var(--border);border-radius:6px;padding:.2rem .6rem;font-size:.65rem;color:var(--text-sec);cursor:pointer;font-family:var(--font)">↺ Réinitialiser</button>' +
    '</div>';

    app.innerHTML = html;

    // === Bind inputs ===
    var inputs = app.querySelectorAll('[id^="dash-input-"]');
    inputs.forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = this.dataset.testid;
        var v = this.value.trim();
        scores[id] = v === '' ? undefined : parseFloat(v);
        if(scores[id] === undefined || isNaN(scores[id])) delete scores[id];
        saveScores(scores);
        updateBars(scores);
        drawRadar(scores);
        updateSummary(scores);
      });
    });

    // === Reset button ===
    var resetBtn = document.getElementById('dash-reset');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        if(!confirm('Réinitialiser tous les scores ?')) return;
        scores = {};
        saveScores(scores);
        inputs.forEach(function(inp){ inp.value = ''; });
        updateBars(scores);
        drawRadar(scores);
        updateSummary(scores);
      });
    }

    // === Draw initial radar ===
    drawRadar(scores);
  }

  function updateBars(scores){
    TESTS.forEach(function(t){
      var val = scores[t.id];
      var pct = val !== undefined && !isNaN(val) ? Math.round((val / t.max) * 100) : 0;
      var bar = document.querySelector('#dash-input-' + t.id)?.closest('.dash-card')?.querySelector('.dash-bar-fill');
      if(bar) bar.style.width = pct + '%';
      // update seuil badge
      var card = document.querySelector('#dash-input-' + t.id)?.closest('.dash-card');
      if(card){
        var badge = card.querySelector('[class*="Seuil"]') || card.querySelector('[class*="sous"]');
        var existing = card.querySelector('.dash-badge-status');
        if(existing) existing.remove();
        if(val !== undefined && !isNaN(val)){
          var above = parseFloat(val) >= t.seuil;
          var el = document.createElement('span');
          el.className = 'dash-badge-status';
          el.style.cssText = 'font-size:.7rem;font-weight:600;margin-left:auto';
          el.style.color = above ? '#6fa86f' : 'var(--text-light)';
          el.textContent = above ? '⚠ Seuil' : '✓ Sous seuil';
          var holder = card.querySelector('div[style*="display:flex;align-items:center;gap:.5rem"]');
          if(holder) holder.appendChild(el);
        }
      }
    });
  }

  function updateSummary(scores){
    var el = document.getElementById('dash-summary-text');
    if(el) el.textContent = calcSummary(scores);
  }

  function calcSummary(scores){
    var total = 0, count = 0;
    TESTS.forEach(function(t){
      var val = scores[t.id];
      if(val !== undefined && !isNaN(val)){
        total += parseFloat(val) >= t.seuil ? 1 : 0;
        count++;
      }
    });
    if(count === 0) return 'Aucun score renseigné. Complète les auto-tests puis entre tes scores ci-dessus.';
    return count + '/' + TESTS.length + ' tests renseignés · ' + total + ' seuil(s) atteint(s) sur ' + count + ' complété(s).';
  }

  function drawRadar(scores){
    var canvas = document.getElementById('dash-radar');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var cx = w/2, cy = h/2;
    var radius = Math.min(cx, cy) - 40;

    ctx.clearRect(0, 0, w, h);

    // Determine theme
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var gridColor = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
    var textColor = isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.35)';
    var fillColor = isDark ? 'rgba(90,127,186,.15)' : 'rgba(90,127,186,.12)';
    var strokeColor = isDark ? 'rgba(90,127,186,.6)' : 'rgba(59,91,140,.5)';
    var dotColor = isDark ? '#8ab0e0' : '#3b5b8c';

    var n = TESTS.length;
    var angleStep = (2 * Math.PI) / n;

    // === Grid: concentric polygons ===
    for(var g=1; g<=3; g++){
      var r = (radius / 3) * g;
      ctx.beginPath();
      for(var i=0; i<=n; i++){
        var a = -Math.PI/2 + i * angleStep;
        var x = cx + r * Math.cos(a);
        var y = cy + r * Math.sin(a);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = g===3 ? 0.5 : 0.3;
      ctx.stroke();
    }

    // === Axis lines ===
    for(var i=0; i<n; i++){
      var a = -Math.PI/2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }

    // === Data polygon ===
    var hasData = false;
    ctx.beginPath();
    for(var i=0; i<=n; i++){
      var t = TESTS[i % n];
      var val = scores[t.id];
      var pct = (val !== undefined && !isNaN(val)) ? Math.max(0, Math.min(1, val / t.max)) : 0;
      if(val !== undefined && !isNaN(val)) hasData = true;
      var a = -Math.PI/2 + i * angleStep;
      var r = pct * radius;
      var x = cx + r * Math.cos(a);
      var y = cy + r * Math.sin(a);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();

    if(hasData){
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // === Dots ===
      for(var i=0; i<n; i++){
        var t = TESTS[i];
        var val = scores[t.id];
        var pct = (val !== undefined && !isNaN(val)) ? Math.max(0, Math.min(1, val / t.max)) : 0;
        var a = -Math.PI/2 + i * angleStep;
        var r = pct * radius;
        var x = cx + r * Math.cos(a);
        var y = cy + r * Math.sin(a);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        if(val !== undefined && !isNaN(val)){
          ctx.fillStyle = dotColor;
          ctx.fill();
          ctx.strokeStyle = isDark ? '#fff' : '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = gridColor;
          ctx.fill();
        }
      }
    }

    // === Labels ===
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for(var i=0; i<n; i++){
      var t = TESTS[i];
      var a = -Math.PI/2 + i * angleStep;
      var labelR = radius + 20;
      var lx = cx + labelR * Math.cos(a);
      var ly = cy + labelR * Math.sin(a);

      ctx.fillStyle = textColor;
      ctx.fillText(t.short, lx, ly);

      // Score value if available
      if(scores[t.id] !== undefined && !isNaN(scores[t.id])){
        var svR = radius * Math.max(0, Math.min(1, scores[t.id] / t.max)) + 12;
        var svx = cx + svR * Math.cos(a);
        var svy = cy + svR * Math.sin(a);
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.fillStyle = dotColor;
        ctx.fillText(scores[t.id], svx, svy);
        ctx.font = '11px Inter, system-ui, sans-serif';
      }
    }

    // === Empty state ===
    if(!hasData){
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText('Entre tes scores ci-dessous', cx, cy + 5);
    }
  }

  // Watch for theme changes (re-draw radar)
  var observer = new MutationObserver(function(){
    var canvas = document.getElementById('dash-radar');
    if(canvas){
      var scores = loadScores();
      drawRadar(scores);
    }
  });
  // Start observing after DOM is ready
  function startObserving(){
    var html = document.documentElement;
    if(html) observer.observe(html, {attributes: true, attributeFilter: ['data-theme']});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ init(); startObserving(); });
  } else {
    init();
    startObserving();
  }
})();
