import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  const js = buildWidgetJs()
  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": origin || "*",
    },
  })
}

function buildWidgetJs(): string {
  return `
(function () {
  'use strict';

  var BASE_URL = 'https://dashboard.univrse.io';
  var RESOLVE_URL = BASE_URL + '/api/public/helpdesk/resolve';
  var CHAT_URL = BASE_URL + '/api/public/helpdesk/chat';

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    open: false,
    loading: false,
    sessionToken: null,
    sessionId: null,
    agentName: 'Hani',
    greeting: 'Hi! How can I help you today?',
    themeColor: '#7F3F98',
    resolved: false,
    messages: [],
    rateLimited: false,
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  function uid() {
    return 'xxxx-xxxx'.replace(/x/g, function () {
      return (Math.random() * 16 | 0).toString(16);
    });
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'style') { Object.assign(e.style, attrs[k]); }
      else if (k.startsWith('on')) { e.addEventListener(k.slice(2), attrs[k]); }
      else { e.setAttribute(k, attrs[k]); }
    });
    if (children) {
      if (typeof children === 'string') { e.textContent = children; }
      else children.forEach(function (c) { if (c) e.appendChild(c); });
    }
    return e;
  }

  function $ (selector) { return document.getElementById('_hd_' + selector); }

  // ── CSS ──────────────────────────────────────────────────────────────────
  function injectCSS(color) {
    var css = [
      '#_hd_bubble{position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.25);z-index:2147483647;border:none;outline:none;}',
      '#_hd_bubble svg{width:24px;height:24px;fill:#fff;pointer-events:none;}',
      '#_hd_panel{position:fixed;bottom:82px;right:20px;width:340px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 120px);border-radius:16px;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.18);display:flex;flex-direction:column;z-index:2147483646;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:14px;line-height:1.45;}',
      '#_hd_panel[hidden]{display:none!important;}',
      '#_hd_header{background:' + color + ';color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}',
      '#_hd_header strong{font-size:15px;}',
      '#_hd_close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:0;margin:0;}',
      '#_hd_messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;}',
      '._hd_msg{max-width:82%;padding:9px 13px;border-radius:14px;word-wrap:break-word;white-space:pre-wrap;}',
      '._hd_bot{align-self:flex-start;background:#f2f2f2;color:#222;}',
      '._hd_user{align-self:flex-end;color:#fff;background:' + color + ';}',
      '._hd_typing{align-self:flex-start;color:#888;font-size:12px;padding:4px 0;}',
      '#_hd_footer{border-top:1px solid #eee;padding:10px;display:flex;gap:8px;}',
      '#_hd_input{flex:1;border:1px solid #ddd;border-radius:20px;padding:8px 14px;font-size:14px;outline:none;resize:none;max-height:80px;min-height:36px;}',
      '#_hd_input:focus{border-color:' + color + ';}',
      '#_hd_send{background:' + color + ';color:#fff;border:none;border-radius:50%;width:36px;height:36px;min-width:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
      '#_hd_send svg{width:16px;height:16px;fill:#fff;}',
      '#_hd_send:disabled{opacity:0.45;cursor:not-allowed;}',
    ].join('');
    var s = document.createElement('style');
    s.id = '_hd_style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function appendMessage(text, who) {
    var msgs = $('messages');
    var row = el('div', { class: '_hd_msg _hd_' + who }, text);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var msgs = $('messages');
    var t = el('div', { id: '_hd_typing', class: '_hd_typing' }, state.agentName + ' is typing…');
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('_hd_typing');
    if (t) t.parentNode.removeChild(t);
  }

  // ── Resolve session ──────────────────────────────────────────────────────
  function resolveSession() {
    var domain = window.location.hostname;
    post(RESOLVE_URL, { domain: domain }).then(function (r) {
      if (!r.ok) { return; }
      state.resolved = true;
      state.sessionToken = r.session_token;
      state.sessionId = uid();
      state.agentName = r.agent_name || 'Hani';
      state.greeting = r.greeting || 'Hi! How can I help you today?';
      state.themeColor = r.theme_color || '#7F3F98';
      updateBubbleColor(state.themeColor);
      var header = $('agent_name');
      if (header) header.textContent = state.agentName;
      if (!state.messages.length) {
        appendMessage(state.greeting, 'bot');
        state.messages.push({ role: 'bot', text: state.greeting });
      }
    }).catch(function () { /* silently hide if domain not registered */ });
  }

  function updateBubbleColor(color) {
    var style = document.getElementById('_hd_style');
    if (style) {
      style.textContent = style.textContent.replace(/#7F3F98/g, color);
    }
  }

  // ── Send message ─────────────────────────────────────────────────────────
  function sendMessage() {
    var input = $('input');
    var text = (input.value || '').trim();
    if (!text || state.loading || state.rateLimited) return;
    if (!state.resolved || !state.sessionToken) {
      appendMessage('Chat is temporarily unavailable. Please contact us directly.', 'bot');
      return;
    }

    appendMessage(text, 'user');
    state.messages.push({ role: 'user', text: text });
    input.value = '';
    input.style.height = '';
    state.loading = true;
    $('send').disabled = true;
    showTyping();

    post(CHAT_URL, {
      session_token: state.sessionToken,
      session_id: state.sessionId,
      message: text,
    }).then(function (r) {
      hideTyping();
      state.loading = false;
      $('send').disabled = false;

      if (r.error === 'rate_limited') {
        state.rateLimited = true;
        appendMessage(r.reply || 'You have reached the message limit for this session. Please contact us directly.', 'bot');
        $('input').disabled = true;
        $('send').disabled = true;
        return;
      }

      if (!r.ok || !r.reply) {
        appendMessage('Sorry, I had trouble with that. Please try again.', 'bot');
        return;
      }

      appendMessage(r.reply, 'bot');
      state.messages.push({ role: 'bot', text: r.reply });
    }).catch(function () {
      hideTyping();
      state.loading = false;
      $('send').disabled = false;
      appendMessage('Network error. Please check your connection and try again.', 'bot');
    });
  }

  // ── Build DOM ────────────────────────────────────────────────────────────
  function buildUI() {
    var color = state.themeColor;
    injectCSS(color);

    // Chat bubble button
    var bubble = el('button', {
      id: '_hd_bubble',
      'aria-label': 'Open chat',
      onclick: function () { togglePanel(); },
    }, [
      el('svg', { viewBox: '0 0 24 24' }, [
        (function () {
          var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p.setAttribute('d', 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z');
          return p;
        })(),
      ]),
    ]);

    // Panel header
    var header = el('div', { id: '_hd_header' }, [
      el('strong', { id: '_hd_agent_name' }, state.agentName),
      el('button', { id: '_hd_close', 'aria-label': 'Close chat', onclick: function () { togglePanel(); } }, '\\u00D7'),
    ]);

    // Messages area
    var messages = el('div', { id: '_hd_messages', role: 'log', 'aria-live': 'polite' });

    // Input area
    var input = el('textarea', {
      id: '_hd_input',
      placeholder: 'Type a message…',
      rows: '1',
      'aria-label': 'Chat message',
      onkeydown: function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      },
      oninput: function () {
        this.style.height = '';
        this.style.height = Math.min(this.scrollHeight, 80) + 'px';
      },
    });

    var sendBtn = el('button', {
      id: '_hd_send',
      'aria-label': 'Send message',
      onclick: sendMessage,
    }, [
      el('svg', { viewBox: '0 0 24 24' }, [
        (function () {
          var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p.setAttribute('d', 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z');
          return p;
        })(),
      ]),
    ]);

    var footer = el('div', { id: '_hd_footer' }, [input, sendBtn]);

    var panel = el('div', { id: '_hd_panel', role: 'dialog', 'aria-label': 'Chat with ' + state.agentName, hidden: '' }, [
      header, messages, footer,
    ]);

    document.body.appendChild(bubble);
    document.body.appendChild(panel);
  }

  function togglePanel() {
    var panel = $('panel');
    state.open = !state.open;
    if (state.open) {
      panel.removeAttribute('hidden');
      var inp = $('input');
      if (inp) setTimeout(function () { inp.focus(); }, 50);
      if (!state.resolved) {
        resolveSession();
      } else if (!state.messages.length) {
        appendMessage(state.greeting, 'bot');
      }
    } else {
      panel.setAttribute('hidden', '');
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    buildUI();
    // Pre-resolve on load (quietly) so first open is instant
    resolveSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`.trim()
}
