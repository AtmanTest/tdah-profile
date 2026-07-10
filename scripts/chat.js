(function () {
  'use strict';

  var STORAGE_KEY = 'tdah_deepseek_key';
  var MSGS_KEY = 'tdah_chat_messages';
  var MAX_CONTEXT = 50;
  var API_URL = 'https://api.deepseek.com/chat/completions';
  var MODEL = 'deepseek-v4-flash';

  var SYSTEM_PROMPT = {
    role: 'system',
    content: "Tu es un assistant spécialisé dans le TDAH chez l'adulte. Tu réponds aux questions sur les symptômes, les traitements, les démarches de soin, les stratégies d'adaptation. Tu restes factuel et prudent : tu ne donnes PAS de conseils médicaux définitifs, tu recommandes toujours de consulter un professionnel. Tu t'exprimes en français."
  };

  // ── Utilities ──────────────────────────────────────────────────────────

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function formatMarkdown(text) {
    // Bold: **text** → <strong>text</strong>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Links: [text](url) → <a href="url" target="_blank" rel="noopener">text</a>
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Line breaks: double newline → <br><br>, single newline → <br>
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  function getSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function getSavedMessages() {
    try {
      var raw = localStorage.getItem(MSGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveMessages(msgs) {
    try { localStorage.setItem(MSGS_KEY, JSON.stringify(msgs.slice(-MAX_CONTEXT))); } catch (e) { /* ignore */ }
  }

  function saveKey(key) {
    try { localStorage.setItem(STORAGE_KEY, key); } catch (e) { /* ignore */ }
  }

  function isMobile() {
    return window.innerWidth <= 640;
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  var STYLES = (function () {
    var el = document.createElement('style');
    el.textContent = [
      /* ── Reset / base ── */
      '.chat-hidden { display: none !important; }',

      /* ── Floating button ── */
      '.chat-button {',
        'position: fixed; bottom: 24px; right: 24px; z-index: 999999;',
        'width: 56px; height: 56px; border-radius: 50%; border: none;',
        'background: var(--chat-primary, #4f46e5); color: #fff;',
        'font-size: 26px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.25);',
        'display: flex; align-items: center; justify-content: center;',
        'transition: transform .2s, opacity .2s;',
      '}',
      '.chat-button:hover { transform: scale(1.08); }',
      '.chat-button:active { transform: scale(0.95); }',

      /* ── Overlay ── */
      '.chat-overlay {',
        'position: fixed; z-index: 999998;',
        'display: flex; flex-direction: column;',
        'background: var(--chat-bg, #ffffff); color: var(--chat-text, #1f2937);',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
        'box-shadow: 0 8px 32px rgba(0,0,0,0.18);',
        'transition: opacity .25s ease, transform .25s ease;',
      '}',
      '.chat-overlay.chat-closed {',
        'opacity: 0; transform: translateY(16px); pointer-events: none;',
      '}',

      /* Desktop */
      '@media (min-width: 641px) {',
        '.chat-overlay {',
          'bottom: 92px; right: 24px;',
          'width: 380px; height: 560px;',
          'border-radius: 16px;',
        '}',
      '}',

      /* Mobile */
      '@media (max-width: 640px) {',
        '.chat-overlay {',
          'top: 0; left: 0; right: 0; bottom: 0;',
          'border-radius: 0;',
        '}',
      '}',

      /* ── Header ── */
      '.chat-header {',
        'display: flex; align-items: center; justify-content: space-between;',
        'padding: 14px 18px;',
        'background: var(--chat-primary, #4f46e5); color: #fff;',
        'border-radius: 16px 16px 0 0; flex-shrink: 0;',
      '}',
      '@media (max-width: 640px) { .chat-header { border-radius: 0; } }',
      '.chat-header-title { font-size: 16px; font-weight: 700; }',
      '.chat-header-close {',
        'background: none; border: none; color: #fff;',
        'font-size: 20px; cursor: pointer; padding: 0 4px; line-height: 1; opacity: .85;',
      '}',
      '.chat-header-close:hover { opacity: 1; }',

      /* ── Messages ── */
      '.chat-messages {',
        'flex: 1; overflow-y: auto; padding: 14px 16px;',
        'display: flex; flex-direction: column; gap: 12px;',
        'background: var(--chat-bg, #ffffff);',
      '}',
      '.chat-msg {',
        'max-width: 85%; padding: 10px 14px; border-radius: 14px;',
        'font-size: 14px; line-height: 1.5; word-wrap: break-word;',
      '}',
      '.chat-msg a { color: var(--chat-link, #4f46e5); text-decoration: underline; }',
      '.chat-msg strong { font-weight: 700; }',
      '.chat-msg-user {',
        'align-self: flex-end;',
        'background: var(--chat-user-bg, #4f46e5); color: #fff;',
        'border-bottom-right-radius: 4px;',
      '}',
      '.chat-msg-user a { color: #c7d2fe; }',
      '.chat-msg-assistant {',
        'align-self: flex-start;',
        'background: var(--chat-ai-bg, #f3f4f6); color: var(--chat-text, #1f2937);',
        'border-bottom-left-radius: 4px;',
      '}',
      '.chat-msg-label {',
        'font-size: 11px; font-weight: 600; margin-bottom: 4px;',
        'opacity: .65; text-transform: uppercase; letter-spacing: .03em;',
      '}',

      /* ── Loading ── */
      '.chat-loading {',
        'display: flex; align-items: center; gap: 6px;',
        'padding: 10px 14px; align-self: flex-start;',
        'background: var(--chat-ai-bg, #f3f4f6); color: var(--chat-text, #1f2937);',
        'border-radius: 14px; border-bottom-left-radius: 4px;',
        'font-size: 14px;',
      '}',
      '.chat-dot {',
        'width: 8px; height: 8px; border-radius: 50%;',
        'background: var(--chat-text-muted, #9ca3af);',
        'animation: chatBounce 1.2s infinite ease-in-out both;',
      '}',
      '.chat-dot:nth-child(1) { animation-delay: -0.32s; }',
      '.chat-dot:nth-child(2) { animation-delay: -0.16s; }',
      '.chat-dot:nth-child(3) { animation-delay: 0s; }',
      '@keyframes chatBounce {',
        '0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1); }',
      '}',

      /* ── Error ── */
      '.chat-error {',
        'align-self: center; text-align: center;',
        'padding: 8px 14px; margin: 4px 0;',
        'font-size: 13px; color: var(--chat-error, #dc2626);',
        'background: var(--chat-error-bg, #fef2f2);',
        'border-radius: 10px; max-width: 90%;',
      '}',

      /* ── Input area ── */
      '.chat-input-area {',
        'display: flex; align-items: flex-end; gap: 8px;',
        'padding: 10px 14px 14px; flex-shrink: 0;',
        'border-top: 1px solid var(--chat-border, #e5e7eb);',
        'background: var(--chat-bg, #ffffff);',
      '}',
      'textarea.chat-input {',
        'flex: 1; resize: none; border: 1px solid var(--chat-border, #d1d5db);',
        'border-radius: 12px; padding: 10px 12px;',
        'font-size: 14px; font-family: inherit; line-height: 1.4;',
        'outline: none; min-height: 40px; max-height: 120px;',
        'background: var(--chat-input-bg, #f9fafb); color: var(--chat-text, #1f2937);',
        'transition: border-color .15s;',
      '}',
      'textarea.chat-input:focus {',
        'border-color: var(--chat-primary, #4f46e5);',
        'box-shadow: 0 0 0 2px var(--chat-primary-alpha, rgba(79,70,229,0.15));',
      '}',
      'textarea.chat-input::placeholder { color: var(--chat-text-muted, #9ca3af); }',
      '.chat-send {',
        'width: 40px; height: 40px; border-radius: 50%; border: none;',
        'background: var(--chat-primary, #4f46e5); color: #fff;',
        'font-size: 18px; cursor: pointer; flex-shrink: 0;',
        'display: flex; align-items: center; justify-content: center;',
        'transition: opacity .15s;',
      '}',
      '.chat-send:disabled { opacity: .45; cursor: default; }',

      /* ── Key prompt ── */
      '.chat-key-prompt {',
        'flex: 1; display: flex; flex-direction: column;',
        'align-items: center; justify-content: center; gap: 16px;',
        'padding: 32px 24px; text-align: center;',
      '}',
      '.chat-key-prompt p { font-size: 14px; color: var(--chat-text-muted, #6b7280); margin: 0; }',
      '.chat-key-prompt input {',
        'width: 100%; max-width: 300px; padding: 10px 14px;',
        'border: 1px solid var(--chat-border, #d1d5db); border-radius: 10px;',
        'font-size: 14px; font-family: inherit;',
        'background: var(--chat-input-bg, #f9fafb); color: var(--chat-text, #1f2937);',
        'outline: none; box-sizing: border-box;',
        'transition: border-color .15s;',
      '}',
      '.chat-key-prompt input:focus {',
        'border-color: var(--chat-primary, #4f46e5);',
      '}',
      '.chat-key-btn {',
        'padding: 10px 28px; border: none; border-radius: 10px;',
        'background: var(--chat-primary, #4f46e5); color: #fff;',
        'font-size: 14px; font-weight: 600; cursor: pointer;',
        'transition: opacity .15s;',
      '}',
      '.chat-key-btn:hover { opacity: .9; }',

      /* ── Dark mode via prefers-color-scheme ── */
      '@media (prefers-color-scheme: dark) {',
        ':root {',
          '--chat-bg: #1f2937;',
          '--chat-text: #f3f4f6;',
          '--chat-primary: #6366f1;',
          '--chat-primary-alpha: rgba(99,102,241,0.2);',
          '--chat-user-bg: #6366f1;',
          '--chat-ai-bg: #374151;',
          '--chat-border: #4b5563;',
          '--chat-input-bg: #374151;',
          '--chat-text-muted: #9ca3af;',
          '--chat-error: #f87171;',
          '--chat-error-bg: rgba(220,38,38,0.2);',
          '--chat-link: #818cf8;',
        '}',
      '}'
    ].join('\n');
    return el;
  }());

  // ── State ──────────────────────────────────────────────────────────────

  var state = {
    open: false,
    loading: false,
    messages: [],
    apiKey: getSavedKey() || ''
  };

  // ── DOM references (created in buildUI) ────────────────────────────────

  var el = {
    button: null,
    overlay: null,
    messages: null,
    input: null,
    send: null,
    headerClose: null,
    keyContainer: null
  };

  // ── Core functions ────────────────────────────────────────────────────

  function buildUI() {
    // ── Button ──
    var btn = document.createElement('button');
    btn.className = 'chat-button';
    btn.setAttribute('aria-label', 'Ouvrir le chat TDAH');
    btn.innerHTML = '💬';

    // ── Overlay ──
    var ov = document.createElement('div');
    ov.className = 'chat-overlay chat-closed';

    // Header
    var header = document.createElement('div');
    header.className = 'chat-header';
    header.innerHTML = '<span class="chat-header-title">🧠 Assistant TDAH</span>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'chat-header-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    // Messages container
    var msgs = document.createElement('div');
    msgs.className = 'chat-messages';

    // Key prompt container (will be shown/hidden)
    var keyContainer = document.createElement('div');
    keyContainer.className = 'chat-key-prompt chat-hidden';

    // Input area
    var inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
    var textarea = document.createElement('textarea');
    textarea.className = 'chat-input';
    textarea.rows = 1;
    textarea.placeholder = 'Pose ta question…';
    var sendBtn = document.createElement('button');
    sendBtn.className = 'chat-send';
    sendBtn.setAttribute('aria-label', 'Envoyer');
    sendBtn.innerHTML = '➤';
    sendBtn.disabled = true;
    inputArea.appendChild(textarea);
    inputArea.appendChild(sendBtn);

    ov.appendChild(header);
    ov.appendChild(msgs);
    ov.appendChild(keyContainer);
    ov.appendChild(inputArea);

    document.body.appendChild(btn);
    document.body.appendChild(ov);

    // Save refs
    el.button = btn;
    el.overlay = ov;
    el.messages = msgs;
    el.input = textarea;
    el.send = sendBtn;
    el.headerClose = closeBtn;
    el.keyContainer = keyContainer;

    // Inject styles
    document.head.appendChild(STYLES);
  }

  function addMessage(role, text) {
    state.messages.push({ role: role, content: text });
    saveMessages(state.messages);

    var bubble = document.createElement('div');
    bubble.className = 'chat-msg chat-msg-' + role;

    var label = document.createElement('div');
    label.className = 'chat-msg-label';
    label.textContent = role === 'user' ? 'Toi' : 'Assistant';
    bubble.appendChild(label);

    var content = document.createElement('div');
    content.innerHTML = role === 'assistant' ? formatMarkdown(escapeHtml(text)) : escapeHtml(text);
    bubble.appendChild(content);

    el.messages.appendChild(bubble);
    scrollToBottom();
  }

  function showLoading() {
    var div = document.createElement('div');
    div.className = 'chat-loading';
    div.id = 'chat-loading-indicator';
    div.innerHTML = '<span class="chat-dot"></span><span class="chat-dot"></span><span class="chat-dot"></span>';
    el.messages.appendChild(div);
    scrollToBottom();
  }

  function removeLoading() {
    var indicator = document.getElementById('chat-loading-indicator');
    if (indicator) indicator.remove();
  }

  function showError(msg) {
    var div = document.createElement('div');
    div.className = 'chat-error';
    div.textContent = msg;
    el.messages.appendChild(div);
    removeLoading();
    scrollToBottom();
  }

  function scrollToBottom() {
    el.messages.scrollTop = el.messages.scrollHeight;
  }

  function buildContextMessages() {
    var history = getSavedMessages();
    var ctx = [SYSTEM_PROMPT].concat(history.slice(-MAX_CONTEXT));
    // Add current messages not yet saved (loading state)
    var unsaved = state.messages.slice(history.length);
    ctx = ctx.concat(unsaved);
    return ctx;
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    if (state.loading) return;

    state.loading = true;
    el.send.disabled = true;

    addMessage('user', text.trim());

    var messagesPayload = buildContextMessages();
    showLoading();

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + state.apiKey);

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      removeLoading();

      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (reply) {
            addMessage('assistant', reply);
          } else {
            showError("Réponse inattendue de l'API. Réessaie.");
          }
        } catch (e) {
          showError("Erreur lors de la lecture de la réponse.");
        }
      } else if (xhr.status === 401) {
        showError("Clé API invalide. Vérifie ta clé DeepSeek.");
      } else {
        var detail = '';
        try {
          var errData = JSON.parse(xhr.responseText);
          detail = errData.error && errData.error.message ? ' : ' + errData.error.message : '';
        } catch (e) { /* ignore */ }
        showError("Erreur API (" + xhr.status + ")" + detail + ". Réessaie plus tard.");
      }

      state.loading = false;
      el.send.disabled = false;
      el.input.focus();
    };

    xhr.onerror = function () {
      removeLoading();
      showError("Impossible de contacter l'API. Vérifie ta connexion internet.");
      state.loading = false;
      el.send.disabled = false;
    };

    var body = JSON.stringify({
      model: MODEL,
      messages: messagesPayload,
      max_tokens: 1500,
      temperature: 0.7
    });

    xhr.send(body);
  }

  function showKeyPrompt() {
    el.messages.classList.add('chat-hidden');
    el.keyContainer.classList.remove('chat-hidden');

    el.keyContainer.innerHTML =
      '<p style="font-size:18px;margin:0;">🔑</p>' +
      '<p>Entre ta clé API DeepSeek pour utiliser l\'assistant.</p>' +
      '<input type="text" class="chat-key-input" placeholder="sk-..." autocomplete="off" />' +
      '<button class="chat-key-btn">Enregistrer</button>';

    var keyInput = el.keyContainer.querySelector('.chat-key-input');
    var keyBtn = el.keyContainer.querySelector('.chat-key-btn');

    function saveKeyHandler() {
      var val = keyInput.value.trim();
      if (!val) {
        keyInput.style.borderColor = '#dc2626';
        return;
      }
      state.apiKey = val;
      saveKey(val);
      el.keyContainer.classList.add('chat-hidden');
      el.messages.classList.remove('chat-hidden');
      el.input.focus();
    }

    keyBtn.addEventListener('click', saveKeyHandler);
    keyInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveKeyHandler();
      }
    });
    keyInput.focus();
  }

  function showInitialContent() {
    if (!state.apiKey) {
      showKeyPrompt();
    } else {
      var saved = getSavedMessages();
      // Restore previous messages
      saved.forEach(function (m) {
        if (m.role === 'system') return;
        state.messages.push(m);
        var bubble = document.createElement('div');
        bubble.className = 'chat-msg chat-msg-' + m.role;
        var label = document.createElement('div');
        label.className = 'chat-msg-label';
        label.textContent = m.role === 'user' ? 'Toi' : 'Assistant';
        bubble.appendChild(label);
        var content = document.createElement('div');
        content.innerHTML = m.role === 'assistant' ? formatMarkdown(escapeHtml(m.content)) : escapeHtml(m.content);
        bubble.appendChild(content);
        el.messages.appendChild(bubble);
      });
      scrollToBottom();
    }
  }

  function openChat() {
    if (state.open) return;
    state.open = true;
    el.overlay.classList.remove('chat-closed');
    el.button.innerHTML = '✕';
    showInitialContent();
    el.input.focus();
  }

  function closeChat() {
    if (!state.open) return;
    state.open = false;
    el.overlay.classList.add('chat-closed');
    el.button.innerHTML = '💬';
  }

  function toggleChat() {
    if (state.open) {
      closeChat();
    } else {
      openChat();
    }
  }

  // ── Event binding ──────────────────────────────────────────────────────

  function bindEvents() {
    el.button.addEventListener('click', toggleChat);
    el.headerClose.addEventListener('click', closeChat);

    el.send.addEventListener('click', function () {
      sendMessage(el.input.value);
      el.input.value = '';
      el.input.style.height = 'auto';
    });

    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.send.click();
      }
    });

    // Auto-resize textarea
    el.input.addEventListener('input', function () {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 120) + 'px';
    });

    // Re-check mobile layout on resize
    window.addEventListener('resize', function () {
      // no layout change needed, CSS handles via media queries
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        buildUI();
        bindEvents();
      });
    } else {
      buildUI();
      bindEvents();
    }
  }

  init();
}());
