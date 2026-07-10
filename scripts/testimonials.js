/**
 * TDAH Profile — Témoignages anonymes / FAQ communautaire
 * Two sections in one module:
 *   Section 1: FAQ accordion (static content, no localStorage)
 *   Section 2: Témoignages (dynamic with localStorage)
 * Self-contained IIFE — exposes nothing globally.
 * Persists testimonials in localStorage (key: 'tdah_testimonials').
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */
  var FAQ_KEY = 'tdah_faq';             // static, not persisted
  var TESTI_KEY = 'tdah_testimonials';  // persisted in localStorage
  var FAQ_ID = 'faq-app';
  var TESTI_ID = 'testimonials-app';

  /* ------------------------------------------------------------------ */
  /*  FAQ DATA — hardcoded static content                                */
  /* ------------------------------------------------------------------ */
  var FAQ_DATA = [
    {
      q: 'Comment obtenir un diagnostic TDAH adulte ?',
      a: 'Le diagnostic du TDAH chez l\'adulte en France repose sur une évaluation clinique complète. La procédure recommandée est la suivante :<br><br>' +
         '1. <strong>Médecin traitant</strong> : première consultation pour évoquer vos difficultés. Il pourra vous orienter vers un spécialiste.<br>' +
         '2. <strong>Psychiatre spécialisé</strong> : consultation avec un psychiatre ayant une expertise dans le TDAH de l\'adulte (recommandé par la HAS).<br>' +
         '3. <strong>Bilan neuropsychologique</strong> (optionnel mais conseillé) : tests cognitifs (attention, mémoire de travail, fonctions exécutives) réalisés par un neuropsychologue.<br>' +
         '4. <strong>CENA</strong> (Centres d\'Évaluation des Neurosciences et de l\'Attention) : il existe des centres spécialisés TDAH adulte dans plusieurs CHU (Créteil, Lyon, Bordeaux, Paris, etc.) qui proposent un parcours complet.<br><br>' +
         '💡 <em>Un diagnostic précoce permet une meilleure prise en charge. N\'hésitez pas à consulter plusieurs avis.</em>'
    },
    {
      q: 'Quels médecins consultent pour le TDAH ?',
      a: 'Plusieurs professionnels de santé peuvent intervenir dans la prise en charge du TDAH :<br><br>' +
         '🩺 <strong>Médecin généraliste</strong> : première écoute, orientation, renouvellement de traitements stabilisés.<br>' +
         '🧠 <strong>Psychiatre</strong> : spécialiste de référence pour le diagnostic et le traitement médicamenteux. Obligatoire pour prescrire du méthylphénidate initialement.<br>' +
         '🔬 <strong>Neurologue</strong> : peut également poser le diagnostic et assurer le suivi, notamment si d\'autres troubles neurologiques sont suspectés.<br>' +
         '📊 <strong>Neuropsychologue</strong> : réalise les bilans cognitifs (tests d\'attention, mémoire, fonctions exécutives). Ne prescrit pas de médicaments.<br>' +
         '💬 <strong>Psychologue / TCC</strong> : thérapies cognitivo-comportementales, gestion des symptômes au quotidien (organisation, procrastination, impulsivité).<br><br>' +
         '✨ <em>Idéalement : un psychiatre spécialisé TDAH + un neuropsychologue pour le bilan + un psychologue TCC pour les stratégies quotidiennes.</em>'
    },
    {
      q: 'Le TDAH est-il reconnu en France ?',
      a: 'Oui, le TDAH est officiellement reconnu en France.<br><br>' +
         '✅ <strong>HAS (Haute Autorité de Santé)</strong> : a publié des recommandations de bonne pratique en 2014 (mises à jour régulièrement) pour le diagnostic et la prise en charge du TDAH chez l\'enfant, l\'adolescent et l\'adulte.<br>' +
         '✅ <strong>ALD</strong> : le TDAH peut être reconnu en Affection Longue Durée (ALD 30 ou ALD hors liste) sous certaines conditions, permettant une prise en charge à 100 % des soins liés.<br>' +
         '✅ <strong>MDPH</strong> : reconnaissance possible du handicap (RQTH — Reconnaissance de la Qualité de Travailleur Handicapé) pour les adultes dont le TDAH impacte significativement la vie professionnelle.<br><br>' +
         '⚠️ <em>Reconnaissance ne signifie pas toujours accès facile aux soins. Les délais d\'attente chez les spécialistes restent longs (6 à 18 mois).</em>'
    },
    {
      q: 'Combien coûte un bilan TDAH ?',
      a: 'Le coût d\'un bilan TDAH varie selon le parcours choisi :<br><br>' +
         '<strong>📌 Parcours public (hôpital / CENA)</strong><br>' +
         '• Consultation psychiatre : ~50 € (remboursé Sécurité sociale + mutuelle)<br>' +
         '• Bilan neuropsychologique : ~100–200 € (partiellement remboursé selon mutuelle)<br>' +
         '• Total estimé : <strong>50–250 €</strong><br><br>' +
         '<strong>📌 Parcours privé</strong><br>' +
         '• Consultation psychiatre spécialisé : 80–150 € (dépassements d\'honoraires fréquents)<br>' +
         '• Bilan neuropsychologique complet : 300–600 €<br>' +
         '• Total estimé : <strong>400–750 €</strong><br><br>' +
         '💡 <em>Vérifiez les remboursements de votre mutuelle. Certains bilans neuropsychologiques peuvent être pris en charge à 100 % via l\'ALD.</em>'
    },
    {
      q: 'Puis-je être suivi à distance ?',
      a: 'Oui, la téléconsultation est une option valable pour le suivi TDAH adulte :<br><br>' +
         '✅ <strong>Consultation de suivi</strong> : les psychiatres peuvent renouveler les ordonnances et ajuster les traitements par téléconsultation (prise en charge par l\'Assurance Maladie).<br>' +
         '✅ <strong>Plateformes spécialisées</strong> : des services comme Qare, Doctolib, ou MédecinDirect proposent des téléconsultations avec des psychiatres. Certains sont spécialisés TDAH.<br>' +
         '✅ <strong>Première consultation</strong> : possible à distance, mais un premier rendez-vous en présentiel est recommandé pour un diagnostic complet.<br>' +
         '⚠️ <strong>Prescription initiale</strong> : le méthylphénidate nécessite une prescription initiale par un psychiatre (ou neurologue) en consultation présentielle obligatoire.<br><br>' +
         '💡 <em>La téléconsultation est particulièrement utile pour les patients en zone rurale ou avec des horaires contraignants.</em>'
    },
    {
      q: 'Le méthylphénidate est-il remboursé ?',
      a: 'Oui, le méthylphénidate (Ritaline®, Concerta®, Quasym®) est remboursé par l\'Assurance Maladie.<br><br>' +
         '💊 <strong>Taux de remboursement</strong> : 65 % par la Sécurité sociale (sur la base du prix du médicament générique). La mutuelle complète généralement le reste.<br>' +
         '📋 <strong>Prescription</strong> : nécessite une ordonnance sécurisée avec prescription initiale par un psychiatre ou neurologue (valable 1 an, renouvelable par le médecin traitant).<br>' +
         '🏥 <strong>ALD</strong> : si le TDAH est reconnu en ALD, le méthylphénidate est pris en charge à 100 % dans le cadre du protocole de soins.<br>' +
         '💰 <strong>Coût approximatif</strong> : entre 15 et 45 € par mois selon le dosage, remboursé à 65 % minimum.<br><br>' +
         '⚠️ <em>Le méthylphénidate est un psychostimulant soumis à une réglementation stricte. La prescription doit suivre les recommandations de la HAS (dose progressive, surveillance régulière).</em>'
    }
  ];

  /* ------------------------------------------------------------------ */
  /*  CATEGORIES for testimonials                                        */
  /* ------------------------------------------------------------------ */
  var TESTI_CATEGORIES = [
    { value: 'diagnostic',  label: 'Diagnostic',       icon: '🔍' },
    { value: 'traitement',  label: 'Traitement',       icon: '💊' },
    { value: 'quotidien',   label: 'Quotidien',        icon: '🏠' },
    { value: 'travail',     label: 'Travail / Études', icon: '💼' },
    { value: 'relations',   label: 'Relations',        icon: '🤝' }
  ];

  /* ------------------------------------------------------------------ */
  /*  STATE HELPERS                                                      */
  /* ------------------------------------------------------------------ */

  /** Return today as YYYY-MM-DD */
  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** Format a YYYY-MM-DD date to French short format */
  function formatDateFR(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin',
                  'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    var d = parseInt(parts[2], 10);
    var m = parseInt(parts[1], 10);
    var y = parts[0];
    return d + ' ' + months[m - 1] + ' ' + y;
  }

  /** Load testimonials from localStorage */
  function loadTestimonials() {
    try {
      var raw = localStorage.getItem(TESTI_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) { /* ignore */ }
    return [];
  }

  /** Save testimonials to localStorage */
  function saveTestimonials(arr) {
    try {
      localStorage.setItem(TESTI_KEY, JSON.stringify(arr));
    } catch (_) { /* ignore */ }
  }

  /** Get or create the root element */
  function getRoot(id) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      /* Append to main container or body */
      var main = document.querySelector('main') || document.querySelector('.container') || document.body;
      main.appendChild(el);
    }
    return el;
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION 1 — FAQ ACCORDION                                         */
  /* ------------------------------------------------------------------ */

  function renderFAQ() {
    var root = getRoot(FAQ_ID);
    root.innerHTML = '' +
      '<div class="faq-container">' +
        FAQ_DATA.map(function (item, idx) {
          var qId = 'faq-q-' + idx;
          return '' +
            '<div class="faq-item">' +
              '<button class="faq-question" aria-expanded="false" aria-controls="' + qId + '" data-index="' + idx + '">' +
                '<span class="faq-question-text">' + escHtml(item.q) + '</span>' +
                '<span class="faq-chevron" aria-hidden="true">▼</span>' +
              '</button>' +
              '<div class="faq-answer" id="' + qId + '" role="region" hidden>' +
                '<div class="faq-answer-inner">' + item.a + '</div>' +
              '</div>' +
            '</div>';
        }).join('') +
      '</div>';

    /* Bind accordion clicks */
    var container = root.querySelector('.faq-container');
    if (!container) return;

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq-question');
      if (!btn) return;

      var item = btn.closest('.faq-item');
      if (!item) return;

      var answer = item.querySelector('.faq-answer');
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        /* Close */
        btn.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        answer.style.maxHeight = '0';
      } else {
        /* Open this one, close others */
        var allItems = container.querySelectorAll('.faq-item');
        Array.prototype.forEach.call(allItems, function (other) {
          var otherBtn = other.querySelector('.faq-question');
          var otherAns = other.querySelector('.faq-answer');
          if (otherBtn && otherAns) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherAns.hidden = true;
            otherAns.style.maxHeight = '0';
          }
        });

        btn.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
        /* Measure content height for smooth animation */
        var inner = answer.querySelector('.faq-answer-inner');
        answer.style.maxHeight = (inner ? inner.scrollHeight : 0) + 'px';
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  SECTION 2 — TÉMOIGNAGES                                           */
  /* ------------------------------------------------------------------ */

  function renderTestimonials() {
    var root = getRoot(TESTI_ID);
    var testimonials = loadTestimonials();

    root.innerHTML = '' +
      '<div class="testi-section">' +
        /* --- Form --- */
        '<div class="testi-form card">' +
          '<h3 class="testi-form-title">📝 Partager mon témoignage</h3>' +
          '<div class="testi-form-row">' +
            '<label class="testi-label">' +
              '<span class="testi-label-text">Pseudo (optionnel)</span>' +
              '<input type="text" class="testi-input" id="testi-pseudo" placeholder="Anonyme" maxlength="40">' +
            '</label>' +
          '</div>' +
          '<div class="testi-form-row">' +
            '<label class="testi-label">' +
              '<span class="testi-label-text">Catégorie <span class="testi-required">*</span></span>' +
              '<select class="testi-select" id="testi-category">' +
                '<option value="" disabled selected>Choisissez une catégorie</option>' +
                TESTI_CATEGORIES.map(function (c) {
                  return '<option value="' + c.value + '">' + c.icon + ' ' + escHtml(c.label) + '</option>';
                }).join('') +
              '</select>' +
            '</label>' +
          '</div>' +
          '<div class="testi-form-row">' +
            '<label class="testi-label">' +
              '<span class="testi-label-text">Votre témoignage <span class="testi-required">*</span></span>' +
              '<textarea class="testi-textarea" id="testi-text" rows="4" placeholder="Partagez votre expérience..." maxlength="2000"></textarea>' +
            '</label>' +
            '<div class="testi-counter" id="testi-counter">0 / 2000</div>' +
          '</div>' +
          '<button class="testi-btn" id="testi-submit">Partager mon témoignage</button>' +
          '<div class="testi-error" id="testi-error" hidden></div>' +
        '</div>' +

        /* --- List --- */
        '<div class="testi-list" id="testi-list">' +
          renderTestiList(testimonials) +
        '</div>' +
      '</div>';

    /* Bind textarea counter */
    var textarea = root.querySelector('#testi-text');
    var counter = root.querySelector('#testi-counter');
    if (textarea && counter) {
      textarea.addEventListener('input', function () {
        var len = this.value.length;
        counter.textContent = len + ' / 2000';
      });
    }

    /* Bind submit */
    var submitBtn = root.querySelector('#testi-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleTestiSubmit(root);
      });
    }

    /* Bind delete buttons (delegated) */
    var list = root.querySelector('#testi-list');
    if (list) {
      list.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.testi-delete');
        if (!delBtn) return;
        var id = delBtn.getAttribute('data-id');
        if (id && confirm('Supprimer ce témoignage ?')) {
          handleTestiDelete(id, root);
        }
      });
    }
  }

  /** Render just the testimonials list (for re-render after add/delete) */
  function renderTestiList(testimonials) {
    if (!testimonials || testimonials.length === 0) {
      return '' +
        '<div class="testi-empty">' +
          '<div class="testi-empty-icon">💬</div>' +
          '<p class="testi-empty-text">Aucun témoignage pour le moment.<br>Soyez le premier à partager votre expérience !</p>' +
        '</div>';
    }

    return testimonials.map(function (t) {
      var cat = getCategoryInfo(t.category);
      var pseudo = t.pseudo && t.pseudo.trim() ? t.pseudo.trim() : 'Anonyme';
      return '' +
        '<div class="testi-item card">' +
          '<div class="testi-item-header">' +
            '<div class="testi-item-author">' +
              '<span class="testi-avatar" aria-hidden="true">👤</span>' +
              '<span class="testi-pseudo">' + escHtml(pseudo) + '</span>' +
            '</div>' +
            '<div class="testi-item-meta">' +
              '<span class="testi-badge testi-badge--' + escHtml(t.category) + '">' +
                (cat ? cat.icon : '📌') + ' ' + (cat ? escHtml(cat.label) : escHtml(t.category)) +
              '</span>' +
              '<span class="testi-date">' + formatDateFR(t.date) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="testi-item-body">' +
            '<p class="testi-item-text">' + escHtml(t.text) + '</p>' +
          '</div>' +
          '<div class="testi-item-actions">' +
            '<button class="testi-delete" data-id="' + escHtml(t.id) + '" title="Supprimer mon témoignage">' +
              '🗑️ Supprimer' +
            '</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /** Get category info by value */
  function getCategoryInfo(val) {
    for (var i = 0; i < TESTI_CATEGORIES.length; i++) {
      if (TESTI_CATEGORIES[i].value === val) return TESTI_CATEGORIES[i];
    }
    return null;
  }

  /** Handle form submission */
  function handleTestiSubmit(root) {
    var pseudoEl = root.querySelector('#testi-pseudo');
    var catEl = root.querySelector('#testi-category');
    var textEl = root.querySelector('#testi-text');
    var errorEl = root.querySelector('#testi-error');

    var pseudo = pseudoEl ? pseudoEl.value.trim() : '';
    var category = catEl ? catEl.value : '';
    var text = textEl ? textEl.value.trim() : '';

    /* Validation */
    if (!category) {
      showTestiError(errorEl, 'Veuillez choisir une catégorie.');
      return;
    }
    if (!text) {
      showTestiError(errorEl, 'Veuillez écrire votre témoignage.');
      if (textEl) textEl.focus();
      return;
    }
    if (text.length < 10) {
      showTestiError(errorEl, 'Votre témoignage doit contenir au moins 10 caractères.');
      if (textEl) textEl.focus();
      return;
    }

    hideTestiError(errorEl);

    /* Build entry */
    var entry = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      pseudo: pseudo || 'Anonyme',
      category: category,
      text: text,
      date: todayISO()
    };

    /* Save */
    var testimonials = loadTestimonials();
    testimonials.unshift(entry);  // newest first
    saveTestimonials(testimonials);

    /* Re-render list */
    var listEl = root.querySelector('#testi-list');
    if (listEl) {
      listEl.innerHTML = renderTestiList(testimonials);
    }

    /* Reset form */
    if (pseudoEl) pseudoEl.value = '';
    if (catEl) catEl.value = '';
    if (textEl) textEl.value = '';
    var counter = root.querySelector('#testi-counter');
    if (counter) counter.textContent = '0 / 2000';
  }

  /** Handle testimonial deletion */
  function handleTestiDelete(id, root) {
    var testimonials = loadTestimonials();
    var filtered = [];
    for (var i = 0; i < testimonials.length; i++) {
      if (testimonials[i].id !== id) {
        filtered.push(testimonials[i]);
      }
    }

    if (filtered.length === testimonials.length) return; // nothing removed

    saveTestimonials(filtered);

    var listEl = root.querySelector('#testi-list');
    if (listEl) {
      listEl.innerHTML = renderTestiList(filtered);
    }
  }

  /** Show error message */
  function showTestiError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    /* Auto-hide after 5 seconds */
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () {
      el.hidden = true;
    }, 5000);
  }

  /** Hide error message */
  function hideTestiError(el) {
    if (!el) return;
    el.hidden = true;
    if (el._hideTimer) {
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  UTILITY                                                            */
  /* ------------------------------------------------------------------ */

  /** Escape HTML entities to prevent XSS */
  function escHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ------------------------------------------------------------------ */
  /*  INLINE STYLES (injected once)                                     */
  /* ------------------------------------------------------------------ */

  function injectStyles() {
    if (document.getElementById('testimonials-faq-styles')) return;

    var style = document.createElement('style');
    style.id = 'testimonials-faq-styles';
    style.textContent = '' +

      /* ======== FAQ ======== */
      '.faq-container{' +
        'display:flex;flex-direction:column;gap:.65rem;' +
      '}' +
      '.faq-item{' +
        'background:var(--surface);border:1px solid var(--border);' +
        'border-radius:var(--radius);overflow:hidden;' +
        'transition:box-shadow .3s;' +
      '}' +
      '.faq-item:hover{' +
        'box-shadow:var(--shadow-hover);' +
      '}' +
      '.faq-question{' +
        'display:flex;align-items:center;justify-content:space-between;' +
        'width:100%;padding:1rem 1.2rem;' +
        'background:none;border:none;cursor:pointer;' +
        'font-family:var(--font);font-size:.92rem;font-weight:600;' +
        'color:var(--text);text-align:left;line-height:1.5;' +
        'transition:background .2s,color .2s;gap:.75rem;' +
      '}' +
      '.faq-question:hover{' +
        'background:var(--accent-light);color:var(--accent);' +
      '}' +
      '.faq-question-text{flex:1;}' +
      '.faq-chevron{' +
        'flex-shrink:0;font-size:.65rem;color:var(--text-light);' +
        'transition:transform .3s ease;' +
      '}' +
      '.faq-question[aria-expanded="true"] .faq-chevron{' +
        'transform:rotate(180deg);' +
      '}' +
      '.faq-answer{' +
        'max-height:0;overflow:hidden;' +
        'transition:max-height .35s ease;' +
      '}' +
      '.faq-answer[hidden]{display:block;}' +   /* keep hidden for transition */
      '.faq-answer-inner{' +
        'padding:0 1.2rem 1rem;font-size:.88rem;' +
        'line-height:1.7;color:var(--text-sec);' +
      '}' +
      '.faq-answer-inner strong{color:var(--text);}' +
      '.faq-answer-inner em{color:var(--accent);}' +

      /* ======== Testimonials ======== */
      '.testi-section{display:flex;flex-direction:column;gap:1.5rem;}' +

      '.testi-form-title{' +
        'font-size:1.05rem;font-weight:600;color:var(--text);' +
        'margin-bottom:.75rem;' +
      '}' +
      '.testi-form-row{margin-bottom:.75rem;}' +
      '.testi-label{' +
        'display:flex;flex-direction:column;gap:.3rem;' +
      '}' +
      '.testi-label-text{' +
        'font-size:.78rem;font-weight:600;color:var(--text-sec);' +
      '}' +
      '.testi-required{color:#e74c3c;}' +
      '.testi-input,.testi-select,.testi-textarea{' +
        'width:100%;padding:.65rem .85rem;' +
        'font-family:var(--font);font-size:.88rem;' +
        'color:var(--text);background:var(--bg);' +
        'border:1.5px solid var(--border);border-radius:var(--radius-sm);' +
        'outline:none;transition:border-color .2s,box-shadow .2s;' +
      '}' +
      '.testi-input:focus,.testi-select:focus,.testi-textarea:focus{' +
        'border-color:var(--accent);' +
        'box-shadow:0 0 0 3px var(--accent-soft);' +
      '}' +
      '.testi-textarea{resize:vertical;min-height:80px;}' +
      '.testi-select{cursor:pointer;}' +
      '.testi-counter{' +
        'text-align:right;font-size:.72rem;color:var(--text-light);' +
        'margin-top:.2rem;' +
      '}' +
      '.testi-btn{' +
        'display:inline-flex;align-items:center;gap:.4rem;' +
        'padding:.65rem 1.5rem;margin-top:.25rem;' +
        'background:var(--accent);color:#fff;border:none;' +
        'border-radius:20px;font-size:.85rem;font-weight:500;' +
        'cursor:pointer;transition:background .2s,transform .1s;' +
      '}' +
      '.testi-btn:hover{background:#2d4a72;transform:scale(1.02);}' +
      '.testi-btn:active{transform:scale(.98);}' +
      '.testi-error{' +
        'margin-top:.65rem;padding:.55rem .85rem;' +
        'background:#2d1b1b;border:1px solid #e74c3c;' +
        'border-radius:var(--radius-sm);font-size:.82rem;' +
        'color:#e74c3c;' +
      '}' +
      '[data-theme="light"] .testi-error{' +
        'background:#fdf0f0;' +
      '}' +

      /* Testimonials list */
      '.testi-list{display:flex;flex-direction:column;gap:.85rem;}' +
      '.testi-empty{' +
        'text-align:center;padding:2.5rem 1rem;' +
      '}' +
      '.testi-empty-icon{' +
        'font-size:2.5rem;margin-bottom:.6rem;' +
      '}' +
      '.testi-empty-text{' +
        'font-size:.9rem;color:var(--text-light);line-height:1.6;' +
      '}' +

      '.testi-item-header{' +
        'display:flex;flex-wrap:wrap;align-items:center;' +
        'justify-content:space-between;gap:.5rem;margin-bottom:.6rem;' +
      '}' +
      '.testi-item-author{' +
        'display:flex;align-items:center;gap:.45rem;' +
      '}' +
      '.testi-avatar{' +
        'flex-shrink:0;width:32px;height:32px;' +
        'display:flex;align-items:center;justify-content:center;' +
        'background:var(--accent-soft);border-radius:50%;' +
        'font-size:1rem;' +
      '}' +
      '.testi-pseudo{' +
        'font-weight:600;font-size:.85rem;color:var(--text);' +
      '}' +
      '.testi-item-meta{' +
        'display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;' +
      '}' +
      '.testi-badge{' +
        'display:inline-flex;align-items:center;gap:.25rem;' +
        'padding:.15rem .6rem;border-radius:12px;' +
        'font-size:.7rem;font-weight:600;white-space:nowrap;' +
      '}' +
      '.testi-badge--diagnostic{' +
        'background:#1e2a3a;color:#7aabda;border:1px solid #2a3a4a;' +
      '}' +
      '.testi-badge--traitement{' +
        'background:#1e2a1e;color:#7ab87a;border:1px solid #2a3a2a;' +
      '}' +
      '.testi-badge--quotidien{' +
        'background:#2a251e;color:#c9a86a;border:1px solid #3a322a;' +
      '}' +
      '.testi-badge--travail{' +
        'background:#1e1e2a;color:#9a7aba;border:1px solid #2a2a3a;' +
      '}' +
      '.testi-badge--relations{' +
        'background:#2a1e1e;color:#da7a7a;border:1px solid #3a2a2a;' +
      '}' +
      '[data-theme="light"] .testi-badge--diagnostic{' +
        'background:#e8edf5;color:#2a5a8a;border-color:#d0dcee;' +
      '}' +
      '[data-theme="light"] .testi-badge--traitement{' +
        'background:#e8f5e8;color:#2a7a2a;border-color:#c0e0c0;' +
      '}' +
      '[data-theme="light"] .testi-badge--quotidien{' +
        'background:#f5f0e8;color:#8a6a30;border-color:#e0d0c0;' +
      '}' +
      '[data-theme="light"] .testi-badge--travail{' +
        'background:#ede8f5;color:#5a3a8a;border-color:#d0c0e0;' +
      '}' +
      '[data-theme="light"] .testi-badge--relations{' +
        'background:#f5e8e8;color:#8a3a3a;border-color:#e0c0c0;' +
      '}' +
      '.testi-date{' +
        'font-size:.72rem;color:var(--text-light);white-space:nowrap;' +
      '}' +
      '.testi-item-body{' +
        'margin-bottom:.55rem;' +
      '}' +
      '.testi-item-text{' +
        'font-size:.88rem;line-height:1.7;color:var(--text-sec);' +
        'margin:0;white-space:pre-wrap;word-break:break-word;' +
      '}' +
      '.testi-item-actions{' +
        'display:flex;justify-content:flex-end;' +
      '}' +
      '.testi-delete{' +
        'background:none;border:none;cursor:pointer;' +
        'font-size:.75rem;color:var(--text-light);' +
        'padding:.25rem .5rem;border-radius:6px;' +
        'transition:color .2s,background .2s;' +
      '}' +
      '.testi-delete:hover{' +
        'color:#e74c3c;background:rgba(231,76,60,.1);' +
      '}';

    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------ */
  /*  MAIN RENDER                                                       */
  /* ------------------------------------------------------------------ */

  function render() {
    injectStyles();
    renderFAQ();
    renderTestimonials();
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
