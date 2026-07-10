/**
 * pdf-print.js — PDF Récapitulatif imprimable pour psychiatre
 * Rassemble tous les scores et génère un document A4 imprimable/natif
 * Utilise @media print + window.print()
 * Auto-initialisation, localStorage, dark mode
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'tdah_dashboard_scores';

  var TESTS = [
    {id:'asrs',    name:'ASRS-V1.1',      max:24,  seuil:14, label:'Dépistage TDAH Adulte', desc:'Score ≥ 14 = suspicion TDAH'},
    {id:'wurs',    name:'WURS-25',        max:100, seuil:36, label:'TDAH Enfance (rétrospectif)', desc:'Score ≥ 36 = TDAH probable dans l\'enfance'},
    {id:'bdi',     name:'BDI-II',         max:63,  seuil:29, label:'Dépression', desc:'Score 0-13 normal · 14-19 léger · 20-28 modéré · ≥ 29 sévère'},
    {id:'mdq',     name:'MDQ',            max:13,  seuil:7,  label:'Spectre Bipolaire', desc:'≥ 7 + Q2 Oui + retentissement = positif'},
    {id:'border',  name:'Borderline',     max:9,   seuil:5,  label:'Trouble Personnalité Limite', desc:'≥ 5 critères sur 9 = positif'}
  ];

  function esc(s){
    if(!s) return '';
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function loadScores(){
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      return d;
    } catch(e){ return {}; }
  }

  function init(){
    var btn = document.getElementById('pdf-generate-btn');
    if(!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      generatePDF();
    });
  }

  function generatePDF(){
    var scores = loadScores();
    var hasAny = Object.keys(scores).length > 0;
    var now = new Date();
    var dateStr = now.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});

    // Build printable content
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>Bilan TDAH — Récapitulatif</title>' +
      '<style>' +
      '@page{size:A4;margin:1.5cm 2cm}' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:Inter,system-ui,sans-serif;font-size:11pt;line-height:1.5;color:#1a1a2e;background:#fff}' +
      '.header{margin-bottom:1.5cm}' +
      '.header h1{font-size:18pt;font-weight:700;color:#3b5b8c;margin-bottom:.2cm}' +
      '.header .sub{font-size:10pt;color:#666}' +
      '.header .date{font-size:9pt;color:#999;margin-top:.3cm}' +
      '.section{margin-bottom:1cm}' +
      '.section h2{font-size:13pt;font-weight:600;color:#3b5b8c;border-bottom:1px solid #ddd;padding-bottom:.15cm;margin-bottom:.4cm}' +
      '.test-row{display:flex;align-items:center;padding:.2cm 0;border-bottom:1px solid #f0f0f0}' +
      '.test-name{flex:1;font-weight:600;font-size:10.5pt}' +
      '.test-desc{flex:2;font-size:9pt;color:#666}' +
      '.test-score{font-weight:700;font-size:11pt;min-width:1.5cm;text-align:center}' +
      '.test-max{font-size:9pt;color:#999}' +
      '.test-seuil{font-size:8pt;padding:.05cm .2cm;border-radius:3px;margin-left:.2cm}' +
      '.seuil-ok{background:#eaf7ee;color:#2d6a4a}' +
      '.seuil-hit{background:#fef3f0;color:#8a3f30}' +
      '.na{color:#ccc}' +
      '.note{margin-top:1cm;padding:.4cm;background:#f8f8fa;border-radius:6px;font-size:9pt;color:#666;border:1px solid #eee}' +
      '.footer{margin-top:1.5cm;padding-top:.5cm;border-top:1px solid #ddd;font-size:8pt;color:#999;text-align:center}' +
      '.no-data{padding:.5cm;text-align:center;color:#999;font-size:10pt}' +
      // Print-specific
      '@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}' +
      '</style></head><body>';

    // Header
    html += '<div class="header">' +
      '<h1>📋 Bilan Pré-consultation TDAH</h1>' +
      '<div class="sub">Document généré automatiquement — À présenter au psychiatre</div>' +
      '<div class="date">Généré le ' + dateStr + '</div>' +
      '</div>';

    // Test scores
    html += '<div class="section"><h2>Résultats des auto-évaluations</h2>';

    if(!hasAny){
      html += '<div class="no-data">Aucun score renseigné. Complète d\'abord les auto-tests sur le site.</div>';
    } else {
      TESTS.forEach(function(t){
        var val = scores[t.id];
        var hasScore = val !== undefined && !isNaN(val);
        var seuilAtteint = hasScore ? (parseFloat(val) >= t.seuil) : false;

        html += '<div class="test-row">' +
          '<div class="test-name">' + esc(t.name) + '</div>' +
          '<div class="test-desc">' + esc(t.desc) + '</div>' +
          '<div class="test-score">' + (hasScore ? esc(val) : '—') + '</div>' +
          '<div class="test-max">/ ' + t.max + '</div>' +
          (hasScore
            ? '<span class="test-seuil ' + (seuilAtteint ? 'seuil-hit' : 'seuil-ok') + '">' +
              (seuilAtteint ? '⚠ Seuil atteint' : '✓ Sous seuil') + '</span>'
            : '<span class="test-seuil seuil-ok na">Pas de donnée</span>') +
          '</div>';
      });
    }

    html += '</div>';

    // Threshold summary
    var reached = 0, total = 0;
    TESTS.forEach(function(t){
      var val = scores[t.id];
      if(val !== undefined && !isNaN(val)){ total++; if(parseFloat(val) >= t.seuil) reached++; }
    });

    if(total > 0){
      html += '<div class="section"><h2>Synthèse</h2>' +
        '<div class="note">' +
          '<strong>' + total + '/5</strong> tests complétés · ' +
          '<strong>' + reached + '</strong> test(s) avec seuil clinique atteint' +
          (reached >= 2 ? '<br><br>⚠ <strong>Plusieurs tests positifs</strong> — orientation psychiatrique recommandée.' : '') +
        '</div></div>';
    }

    // Disclaimer
    html += '<div class="note">' +
      '<strong>⚠ Important :</strong> Ce document est un récapitulatif d\'auto-évaluations, pas un diagnostic médical. ' +
      'Les seuils indiqués sont des indicateurs statistiques. Seul un psychiatre ou neurologue spécialisé peut poser un diagnostic de TDAH après un entretien clinique complet. ' +
      'En cas d\'urgence, contactez le 15 (SAMU) ou le 3114 (prévention suicide).' +
      '</div>';

    // What to bring
    html += '<div class="section"><h2>📎 Documents à apporter en consultation</h2>' +
      '<div class="note">' +
        '☐ Carte vitale · ☐ Pièce d\'identité · ☐ Ce bilan imprimé · ☐ Résultats des auto-tests (via site)<br>' +
        '☐ Lettre du médecin traitant (si orienté) · ☐ Ordonnances en cours · ☐ Comptes-rendus antérieurs' +
      '</div></div>';

    // Footer
    html += '<div class="footer">' +
      'Généré depuis tdah-profile · https://atmantest.github.io/tdah-profile/ · Données stockées localement uniquement' +
      '</div>';

    html += '</body></html>';

    // Open in new window and print
    var win = window.open('', '_blank');
    if(win){
      win.document.write(html);
      win.document.close();
      win.focus();
      // Small delay to let CSS load then print
      setTimeout(function(){ win.print(); }, 500);
    } else {
      alert('⚠ Le pop-up a été bloqué. Autorise les pop-ups pour générer le PDF.');
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
