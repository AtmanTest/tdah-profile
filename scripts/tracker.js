/**
 * TDAH Profile — Suivi médicamenteux quotidien
 * Daily Medication Tracker with 7-day heatmap,
 * log form, history, and week summary.
 * Self-contained IIFE — exposes nothing.
 * Persists state in localStorage (key: 'tdah_tracker').
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */
  var STORAGE_KEY = 'tdah_tracker';
  var ROOT_ID = 'tracker-app';

  var MEDICATIONS = [
    'Méthylphénidate (Ritaline®)',
    'Méthylphénidate LP (Concerta®)',
    'Méthylphénidate (Quasym®)',
    'Dexamphétamine (Adderall®)',
    'Lisdexamfétamine (Elvanse®)',
    'Atomoxétine (Strattera®)',
    'Guanfacine (Intuniv®)',
    'Bupropion',
    'Modafinil',
    'Autre'
  ];

  var EFFECTS = [
    'none',
    'better-focus',
    'calmer',
    'less-impulsive',
    'headache',
    'nausea',
    'insomnia',
    'anxiety',
    'dry-mouth',
    'loss-of-appetite'
  ];

  var EFFECT_LABELS = {
    'none':           'Aucun',
    'better-focus':   'Meilleure concentration',
    'calmer':         'Plus calme',
    'less-impulsive': 'Moins impulsif',
    'headache':       'Mal de tête',
    'nausea':         'Nausées',
    'insomnia':       'Insomnie',
    'anxiety':        'Anxiété',
    'dry-mouth':      'Sécheresse buccale',
    'loss-of-appetite': 'Perte d\'appétit'
  };

  var EFFECT_ICONS = {
    'none':           '➖',
    'better-focus':   '🎯',
    'calmer':         '🧘',
    'less-impulsive': '🤲',
    'headache':       '🤕',
    'nausea':         '🤢',
    'insomnia':       '🌙',
    'anxiety':        '😰',
    'dry-mouth':      '💧',
    'loss-of-appetite': '🍽️'
  };

  /* ------------------------------------------------------------------ */
  /*  STATE HELPERS                                                      */
  /* ------------------------------------------------------------------ */
  function nowISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function todayISO() { return nowISO(); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore */ }
    return {};
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* ignore */ }
  }

  function getEntry(dateISO) {
    var state = loadState();
    return state[dateISO] || null;
  }

  function upsertEntry(dateISO, entry) {
    var state = loadState();
    state[dateISO] = entry;
    saveState(state);
  }

  function deleteEntry(dateISO) {
    var state = loadState();
    delete state[dateISO];
    saveState(state);
  }

  /* ------------------------------------------------------------------ */
  /*  UTILITIES                                                          */
  /* ------------------------------------------------------------------ */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDateFR(iso) {
    var parts = iso.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('fr-FR', opts);
  }

  function formatTimeFR(hhmm) {
    if (!hhmm) return '—';
    return hhmm;
  }

  function getLastNDays(n) {
    var days = [];
    var d = new Date();
    for (var i = 0; i < n; i++) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      days.push(y + '-' + m + '-' + dd);
      d.setDate(d.getDate() - 1);
    }
    return days;
  }

  function dayLabelShort(iso) {
    var parts = iso.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Auj.';
    if (diff === 1) return 'Hier';
    var opts = { weekday: 'short' };
    return d.toLocaleDateString('fr-FR', opts);
  }

  function dayNum(iso) {
    var parts = iso.split('-');
    return +parts[2];
  }

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */
  function render() {
    var container = document.getElementById(ROOT_ID);
    if (!container) return;

    var today = todayISO();
    var state = loadState();
    var last7 = getLastNDays(7);
    var todayEntry = state[today] || null;

    /* ----- build HTML ----- */
    var html = '';

    /* --- Header --- */
    html += '<div class="tracker-header">';
    html +=   '<h2 class="tracker-title">💊 Suivi médicamenteux quotidien</h2>';
    html +=   '<p class="tracker-subtitle">Enregistrez votre prise quotidienne et suivez vos effets</p>';
    html += '</div>';

    /* --- Mini calendar heatmap (last 7 days) --- */
    html += '<div class="tracker-heatmap-wrap">';
    html +=   '<div class="tracker-heatmap-label">7 derniers jours</div>';
    html +=   '<div class="tracker-heatmap">';

    last7.forEach(function (iso) {
      var entry = state[iso] || null;
      var hasEntry = !!entry;
      var hasEffects = hasEntry && entry.effects && entry.effects.length > 0 && entry.effects.indexOf('none') === -1;
      var cls = 'tracker-heatmap-cell';
      if (!hasEntry) cls += ' tracker-heatmap-empty';
      else if (hasEffects) cls += ' tracker-heatmap-active';
      else cls += ' tracker-heatmap-logged';

      var tooltip = formatDateFR(iso);
      if (hasEntry) {
        tooltip += ' — ' + (entry.medication || '—') + ' ' + (entry.dosage || '') + 'mg';
        if (hasEffects) tooltip += ' · effets notés';
      } else {
        tooltip += ' — aucun enregistrement';
      }

      html += '<div class="' + cls + '" title="' + escapeAttr(tooltip) + '" data-date="' + iso + '">';
      html +=   '<span class="tracker-heatmap-day">' + dayLabelShort(iso) + '</span>';
      html +=   '<span class="tracker-heatmap-num">' + dayNum(iso) + '</span>';
      html += '</div>';
    });

    html +=   '</div>';
    html += '</div>';

    /* --- Today's log form --- */
    html += '<div class="tracker-form-card">';
    html +=   '<div class="tracker-form-header">';
    html +=     '<h3 class="tracker-form-title">' + (todayEntry ? '✏️ Modifier l\'entrée du jour' : '➕ Nouvelle entrée') + '</h3>';
    html +=     '<span class="tracker-form-date">' + formatDateFR(today) + '</span>';
    html +=   '</div>';

    html +=   '<form class="tracker-form" id="tracker-today-form">';

    /* medication name */
    html +=     '<div class="tracker-field">';
    html +=       '<label class="tracker-label" for="tracker-med">Médicament</label>';
    html +=       '<select class="tracker-select" id="tracker-med">';
    html +=         '<option value="">— Sélectionnez —</option>';
    MEDICATIONS.forEach(function (med) {
      var sel = (todayEntry && todayEntry.medication === med) ? ' selected' : '';
      html += '<option value="' + escapeAttr(med) + '"' + sel + '>' + escapeHtml(med) + '</option>';
    });
    html +=       '</select>';
    html +=       '<input class="tracker-input" type="text" id="tracker-med-other" placeholder="Autre médicament…" style="margin-top:.35rem;display:' + ((todayEntry && MEDICATIONS.indexOf(todayEntry.medication) === -1) ? 'block' : 'none') + '">';
    html +=     '</div>';

    /* dosage + time row */
    html +=     '<div class="tracker-row">';
    html +=       '<div class="tracker-field" style="flex:1">';
    html +=         '<label class="tracker-label" for="tracker-dosage">Dosage (mg)</label>';
    html +=         '<input class="tracker-input" type="number" id="tracker-dosage" min="0" step="2.5" placeholder="ex: 10" value="' + (todayEntry ? escapeAttr(todayEntry.dosage || '') : '') + '">';
    html +=       '</div>';
    html +=       '<div class="tracker-field" style="flex:1">';
    html +=         '<label class="tracker-label" for="tracker-time">Prise à</label>';
    html +=         '<input class="tracker-input" type="time" id="tracker-time" value="' + (todayEntry ? escapeAttr(todayEntry.time || '') : '') + '">';
    html +=       '</div>';
    html +=     '</div>';

    /* effects checkboxes */
    html +=     '<div class="tracker-field">';
    html +=       '<label class="tracker-label">Effets ressentis</label>';
    html +=       '<div class="tracker-effects-grid" id="tracker-effects">';

    EFFECTS.forEach(function (effect) {
      var checked = todayEntry && todayEntry.effects && todayEntry.effects.indexOf(effect) !== -1;
      var chkId = 'tracker-eff-' + effect;
      html += '<label class="tracker-check-label">';
      html +=   '<input type="checkbox" class="tracker-check" name="effects" value="' + effect + '" id="' + chkId + '"' + (checked ? ' checked' : '') + '>';
      html +=   '<span class="tracker-check-ui">' + (EFFECT_ICONS[effect] || '') + ' ' + EFFECT_LABELS[effect] + '</span>';
      html += '</label>';
    });

    html +=       '</div>';
    html +=     '</div>';

    /* notes */
    html +=     '<div class="tracker-field">';
    html +=       '<label class="tracker-label" for="tracker-notes">Notes</label>';
    html +=       '<textarea class="tracker-textarea" id="tracker-notes" rows="3" placeholder="Votre ressenti, observations…">' + (todayEntry ? escapeHtml(todayEntry.notes || '') : '') + '</textarea>';
    html +=     '</div>';

    /* actions */
    html +=     '<div class="tracker-form-actions">';
    html +=       '<button class="tracker-btn tracker-btn-primary" type="submit" id="tracker-save-btn">' + (todayEntry ? '💾 Mettre à jour' : '💾 Enregistrer') + '</button>';
    if (todayEntry) {
      html +=   '<button class="tracker-btn tracker-btn-danger" type="button" id="tracker-delete-btn">🗑️ Supprimer</button>';
    }
    html +=     '</div>';

    html +=   '</form>';
    html += '</div>';

    /* --- Week summary --- */
    html += '<div class="tracker-summary-card">';
    html +=   '<h3 class="tracker-summary-title">📊 Résumé de la semaine</h3>';
    html +=   renderWeekSummary(state, last7, today);
    html += '</div>';

    /* --- History --- */
    html += '<div class="tracker-history">';
    html +=   '<h3 class="tracker-history-title">📜 Historique</h3>';

    var sortedDates = Object.keys(state).sort().reverse();
    if (sortedDates.length === 0) {
      html += '<p class="tracker-empty">Aucune entrée pour le moment. Commencez par enregistrer votre prise du jour.</p>';
    } else {
      sortedDates.forEach(function (iso) {
        var entry = state[iso];
        var hasEffects = entry.effects && entry.effects.length > 0 && entry.effects.indexOf('none') === -1;
        html += '<div class="tracker-history-item">';
        html +=   '<div class="tracker-history-date">' + formatDateFR(iso) + '</div>';
        html +=   '<div class="tracker-history-body">';
        html +=     '<span class="tracker-history-med">' + escapeHtml(entry.medication || '—') + '</span>';
        if (entry.dosage) html += ' <span class="tracker-history-dosage">· ' + escapeHtml(entry.dosage) + ' mg</span>';
        if (entry.time) html += ' <span class="tracker-history-time">· à ' + formatTimeFR(entry.time) + '</span>';
        if (hasEffects) {
          html += '<div class="tracker-history-effects">';
          entry.effects.forEach(function (eff) {
            if (eff !== 'none') {
              html += '<span class="tracker-history-effect-badge">' + (EFFECT_ICONS[eff] || '') + ' ' + EFFECT_LABELS[eff] + '</span>';
            }
          });
          html += '</div>';
        } else if (entry.effects && entry.effects.indexOf('none') !== -1) {
          html += '<div class="tracker-history-effects"><span class="tracker-history-effect-badge">Aucun effet notable</span></div>';
        }
        if (entry.notes) {
          html += '<div class="tracker-history-notes">' + escapeHtml(entry.notes) + '</div>';
        }
        html +=   '</div>';
        html += '</div>';
      });
    }

    html += '</div>';

    container.innerHTML = html;

    /* ------------------------------------------------------------------ */
    /*  BIND EVENTS                                                       */
    /* ------------------------------------------------------------------ */
    bindFormEvents(container, today);
    bindEffectsToggle(container);
    bindMedicationToggle(container);
    bindHeatmapClicks(container);
  }

  /* ------------------------------------------------------------------ */
  /*  WEEK SUMMARY                                                       */
  /* ------------------------------------------------------------------ */
  function renderWeekSummary(state, last7, today) {
    var html = '';

    /* Count entries in last 7 days */
    var loggedCount = 0;
    var effectCounts = {};
    var currentMed = null;
    var medCounts = {};

    last7.forEach(function (iso) {
      var entry = state[iso];
      if (entry) {
        loggedCount++;
        if (entry.medication) {
          medCounts[entry.medication] = (medCounts[entry.medication] || 0) + 1;
        }
        if (entry.effects) {
          entry.effects.forEach(function (eff) {
            if (eff !== 'none') {
              effectCounts[eff] = (effectCounts[eff] || 0) + 1;
            }
          });
        }
      }
    });

    /* Current medication = most frequent in last 7 days, or today's med */
    if (state[today] && state[today].medication) {
      currentMed = state[today].medication;
    } else {
      var maxCount = 0;
      Object.keys(medCounts).forEach(function (med) {
        if (medCounts[med] > maxCount) {
          maxCount = medCounts[med];
          currentMed = med;
        }
      });
    }

    /* adherence % */
    var adherencePct = Math.round((loggedCount / 7) * 100);

    /* Most common effects (top 3) */
    var sortedEffects = Object.keys(effectCounts).sort(function (a, b) {
      return effectCounts[b] - effectCounts[a];
    });
    var topEffects = sortedEffects.slice(0, 3);

    html += '<div class="tracker-summary-grid">';

    html +=   '<div class="tracker-summary-stat">';
    html +=     '<div class="tracker-summary-stat-value">' + adherencePct + '%</div>';
    html +=     '<div class="tracker-summary-stat-label">Adhérence<br><small>' + loggedCount + '/7 jours</small></div>';
    html +=   '</div>';

    html +=   '<div class="tracker-summary-stat">';
    html +=     '<div class="tracker-summary-stat-value">' + (currentMed ? escapeHtml(currentMed) : '—') + '</div>';
    html +=     '<div class="tracker-summary-stat-label">Médicament actuel</div>';
    html +=   '</div>';

    html +=   '<div class="tracker-summary-stat">';
    if (topEffects.length > 0) {
      html +=     '<div class="tracker-summary-stat-value" style="font-size:.95rem">';
      topEffects.forEach(function (eff, i) {
        if (i > 0) html += '<br>';
        html += (EFFECT_ICONS[eff] || '') + ' ' + EFFECT_LABELS[eff] + ' <small>(' + effectCounts[eff] + '×)</small>';
      });
      html +=     '</div>';
    } else {
      html +=     '<div class="tracker-summary-stat-value" style="font-size:.9rem;opacity:.6">Aucun effet noté</div>';
    }
    html +=     '<div class="tracker-summary-stat-label">Effets les plus fréquents</div>';
    html +=   '</div>';

    html += '</div>';

    return html;
  }

  /* ------------------------------------------------------------------ */
  /*  EVENT BINDING                                                       */
  /* ------------------------------------------------------------------ */
  function bindFormEvents(container, today) {
    var form = container.querySelector('#tracker-today-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var medSelect = container.querySelector('#tracker-med');
      var medOther = container.querySelector('#tracker-med-other');
      var dosage = container.querySelector('#tracker-dosage');
      var time = container.querySelector('#tracker-time');
      var notes = container.querySelector('#tracker-notes');
      var effectChecks = container.querySelectorAll('[name="effects"]:checked');

      var medication = medSelect.value;
      if (medication === 'Autre' && medOther.value.trim()) {
        medication = medOther.value.trim();
      }
      if (!medication) {
        alert('Veuillez sélectionner un médicament.');
        return;
      }

      var effects = [];
      Array.prototype.forEach.call(effectChecks, function (cb) {
        effects.push(cb.value);
      });
      if (effects.length === 0) effects.push('none');

      var entry = {
        medication: medication,
        dosage: dosage.value || '',
        time: time.value || '',
        effects: effects,
        notes: notes.value || '',
        updatedAt: new Date().toISOString()
      };

      upsertEntry(today, entry);
      render();
    });

    /* Delete button */
    var delBtn = container.querySelector('#tracker-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (confirm('Supprimer l\'entrée du jour ? Cette action est irréversible.')) {
          deleteEntry(today);
          render();
        }
      });
    }
  }

  function bindEffectsToggle(container) {
    var checks = container.querySelectorAll('[name="effects"]');
    var noneCheck = container.querySelector('#tracker-eff-none');

    Array.prototype.forEach.call(checks, function (cb) {
      cb.addEventListener('change', function () {
        /* If "none" is checked, uncheck all others */
        if (this.id === 'tracker-eff-none' && this.checked) {
          Array.prototype.forEach.call(checks, function (other) {
            if (other.id !== 'tracker-eff-none') {
              other.checked = false;
            }
          });
        }
        /* If any other is checked, uncheck "none" */
        if (this.id !== 'tracker-eff-none' && this.checked) {
          if (noneCheck) noneCheck.checked = false;
        }
      });
    });
  }

  function bindMedicationToggle(container) {
    var medSelect = container.querySelector('#tracker-med');
    var medOther = container.querySelector('#tracker-med-other');
    if (!medSelect || !medOther) return;

    medSelect.addEventListener('change', function () {
      medOther.style.display = this.value === 'Autre' ? 'block' : 'none';
      if (this.value === 'Autre' && !medOther.value.trim()) {
        medOther.focus();
      }
    });
  }

  function bindHeatmapClicks(container) {
    var cells = container.querySelectorAll('.tracker-heatmap-cell');
    Array.prototype.forEach.call(cells, function (cell) {
      cell.addEventListener('click', function () {
        var date = this.getAttribute('data-date');
        /* Scroll down to history and highlight the matching entry */
        var items = container.querySelectorAll('.tracker-history-item');
        Array.prototype.forEach.call(items, function (item) {
          var dateEl = item.querySelector('.tracker-history-date');
          if (dateEl && dateEl.textContent.indexOf(formatDateFR(date).substring(0, 10)) !== -1) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.style.transition = 'background .3s';
            item.style.background = 'var(--accent-soft)';
            setTimeout(function () {
              item.style.background = '';
            }, 1500);
          }
        });
      });
    });
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
