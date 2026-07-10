/**
 * TDAH Profile — Planificateur de rendez-vous médicaux
 * Medical Appointment Planner with interactive timeline,
 * progress tracking, and document check-list.
 * Self-contained IIFE — exposes nothing.
 * Persists state in localStorage (key: 'tdah_planner').
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */
  var STORAGE_KEY = 'tdah_planner';
  var ROOT_ID = 'planner-app';

  var MILESTONES = [
    { id: 'm0', label: 'Premier RV médecin traitant',   desc: 'Prenez rendez-vous avec votre médecin traitant pour discuter de vos difficultés. Il pourra vous orienter vers un spécialiste.' },
    { id: 'm1', label: 'Orientation psychiatre',         desc: 'Obtenez une ordonnance d\'orientation vers un psychiatre spécialisé dans le TDAH de l\'adulte.' },
    { id: 'm2', label: 'Bilan TDAH complet',             desc: 'Réalisez un bilan neuropsychologique complet (entretien clinique + tests cognitifs + questionnaires).' },
    { id: 'm3', label: 'Début traitement',               desc: 'Démarrez le traitement prescrit (médicamenteux et/ou thérapie comportementale).' },
    { id: 'm4', label: 'Suivi 1 mois',                   desc: 'Première évaluation : ajustement du traitement, effets secondaires, premiers bénéfices.' },
    { id: 'm5', label: 'Suivi 3 mois',                   desc: 'Bilan à 3 mois : évaluation de l\'efficacité à moyen terme et adaptation si nécessaire.' },
    { id: 'm6', label: 'Suivi 6 mois',                   desc: 'Bilan semestriel : réévaluation complète et ajustement du plan de soins.' }
  ];

  var DOCUMENTS = [
    'Carte vitale',
    'Pièce d\'identité',
    'Résultats des auto-tests (impression site)',
    'Lettre du médecin traitant',
    'Compte-rendu scolaire si disponible',
    'Ordonnances en cours',
    'Liste des traitements déjà essayés'
  ];

  /* ------------------------------------------------------------------ */
  /*  STATE HELPERS                                                      */
  /* ------------------------------------------------------------------ */
  function defaultState() {
    return {
      milestones: MILESTONES.reduce(function (acc, m) {
        acc[m.id] = { checked: false, expanded: false, notes: '' };
        return acc;
      }, {}),
      documents: DOCUMENTS.reduce(function (acc, d) {
        acc[d] = false;
        return acc;
      }, {})
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // Merge with defaults to handle schema updates
        var def = defaultState();
        if (parsed.milestones) {
          Object.keys(def.milestones).forEach(function (id) {
            if (parsed.milestones[id]) {
              def.milestones[id].checked = !!parsed.milestones[id].checked;
              def.milestones[id].notes = parsed.milestones[id].notes || '';
              // expanded is not persisted — always collapsed on load
            }
          });
        }
        if (parsed.documents) {
          Object.keys(def.documents).forEach(function (key) {
            if (parsed.documents[key] !== undefined) {
              def.documents[key] = !!parsed.documents[key];
            }
          });
        }
        return def;
      }
    } catch (_) { /* ignore */ }
    return defaultState();
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */
  function render() {
    var container = document.getElementById(ROOT_ID);
    if (!container) return;

    var state = loadState();

    /* ----- compute progress ----- */
    var totalM = MILESTONES.length;
    var doneM = MILESTONES.filter(function (m) { return state.milestones[m.id].checked; }).length;
    var progressPct = totalM === 0 ? 0 : Math.round((doneM / totalM) * 100);

    /* ----- build HTML ----- */
    var html = '';

    /* --- Progress bar --- */
    html += '<div class="planner-progress-wrap">';
    html +=   '<div class="planner-progress-label">Progression — <strong>' + doneM + '/' + totalM + '</strong> étapes validées</div>';
    html +=   '<div class="planner-progress-bar">';
    html +=     '<div class="planner-progress-fill" style="width:' + progressPct + '%"></div>';
    html +=   '</div>';
    html +=   '<div class="planner-progress-pct">' + progressPct + '%</div>';
    html += '</div>';

    /* --- Timeline --- */
    html += '<div class="planner-timeline" role="list" aria-label="Étapes du parcours de soins">';

    MILESTONES.forEach(function (m, idx) {
      var st = state.milestones[m.id];
      var isChecked = st.checked;
      var isExpanded = st.expanded;
      var notesVal = st.notes || '';

      html += '<div class="planner-milestone' + (isChecked ? ' planner-done' : '') + '" role="listitem">';

      /* --- header row --- */
      html +=   '<div class="planner-milestone-header">';

      /* step number */
      html +=     '<span class="planner-step-num">' + (idx + 1) + '</span>';

      /* checkbox */
      html +=     '<label class="planner-check-wrap">';
      html +=       '<input type="checkbox" class="planner-check" data-milestone="' + m.id + '"' + (isChecked ? ' checked' : '') + '>';
      html +=       '<span class="planner-check-mark"></span>';
      html +=     '</label>';

      /* label */
      html +=     '<span class="planner-milestone-label">' + m.label + '</span>';

      /* expand / collapse toggle */
      html +=     '<button class="planner-toggle" data-milestone="' + m.id + '" aria-label="Détails" aria-expanded="' + (isExpanded ? 'true' : 'false') + '">';
      html +=       isExpanded
        ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html +=     '</button>';

      html +=   '</div>';

      /* --- expandable details --- */
      if (isExpanded) {
        html += '<div class="planner-details">';
        html +=   '<p class="planner-desc">' + m.desc + '</p>';
        html +=   '<label class="planner-notes-label">Mes notes</label>';
        html +=   '<textarea class="planner-notes" data-milestone="' + m.id + '" rows="3" placeholder="Ajoutez une note personnelle…">' + escapeHtml(notesVal) + '</textarea>';
        html += '</div>';
      }

      html += '</div>';
    });

    html += '</div>';

    /* --- Documents à apporter --- */
    html += '<div class="planner-docs-section">';
    html +=   '<h3 class="planner-docs-title">📋 Documents à apporter</h3>';
    html +=   '<ul class="planner-docs-list">';

    DOCUMENTS.forEach(function (doc) {
      var checked = state.documents[doc];
      html += '<li class="planner-doc-item' + (checked ? ' planner-doc-done' : '') + '">';
      html +=   '<label class="planner-check-wrap">';
      html +=     '<input type="checkbox" class="planner-doc-check" data-doc="' + escapeAttr(doc) + '"' + (checked ? ' checked' : '') + '>';
      html +=     '<span class="planner-check-mark"></span>';
      html +=   '</label>';
      html +=   '<span class="planner-doc-label">' + escapeHtml(doc) + '</span>';
      html += '</li>';
    });

    html +=   '</ul>';
    html += '</div>';

    /* --- Reset button --- */
    html += '<div class="planner-reset-wrap">';
    html +=   '<button class="planner-reset-btn" type="button">🔄 Tout réinitialiser</button>';
    html += '</div>';

    container.innerHTML = html;

    /* ------------------------------------------------------------------ */
    /*  BIND EVENTS                                                       */
    /* ------------------------------------------------------------------ */

    /* --- Milestone checkbox --- */
    var checks = container.querySelectorAll('.planner-check');
    Array.prototype.forEach.call(checks, function (cb) {
      cb.addEventListener('change', function () {
        var id = this.getAttribute('data-milestone');
        var s = loadState();
        if (s.milestones[id]) {
          s.milestones[id].checked = this.checked;
          s.milestones[id].expanded = false; // collapse on check/uncheck
          saveState(s);
          render(); // re-render to reflect state
        }
      });
    });

    /* --- Milestone expand/collapse --- */
    var toggles = container.querySelectorAll('.planner-toggle');
    Array.prototype.forEach.call(toggles, function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-milestone');
        var s = loadState();
        if (s.milestones[id]) {
          s.milestones[id].expanded = !s.milestones[id].expanded;
          saveState(s);
          render();
        }
      });
    });

    /* --- Notes textarea (live-save on input) --- */
    var notesAreas = container.querySelectorAll('.planner-notes');
    Array.prototype.forEach.call(notesAreas, function (ta) {
      ta.addEventListener('input', function () {
        var id = this.getAttribute('data-milestone');
        var s = loadState();
        if (s.milestones[id]) {
          s.milestones[id].notes = this.value;
          saveState(s);
        }
      });
    });

    /* --- Document checkbox --- */
    var docChecks = container.querySelectorAll('.planner-doc-check');
    Array.prototype.forEach.call(docChecks, function (cb) {
      cb.addEventListener('change', function () {
        var key = this.getAttribute('data-doc');
        var s = loadState();
        if (s.documents[key] !== undefined) {
          s.documents[key] = this.checked;
          saveState(s);
          render();
        }
      });
    });

    /* --- Reset button --- */
    var resetBtn = container.querySelector('.planner-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (confirm('Réinitialiser tout le planificateur ? Cette action est irréversible.')) {
          saveState(defaultState());
          render();
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  UTILITIES                                                         */
  /* ------------------------------------------------------------------ */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------------ */
  /*  SELF-INIT                                                         */
  /* ------------------------------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
