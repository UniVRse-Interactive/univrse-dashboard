(function () {
  var script = document.currentScript;
  if (!script) return;

  var tenantId = script.getAttribute('data-tenant');
  if (!tenantId) return;

  var label = script.getAttribute('data-label') || 'Chat with us';
  var color = script.getAttribute('data-color') || '#7c3aed';
  var origin = new URL(script.src, window.location.href).origin;
  var iframeUrl = origin + '/widget/helpdesk-form?tenant=' + encodeURIComponent(tenantId);

  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', label);
  button.style.position = 'fixed';
  button.style.right = '24px';
  button.style.bottom = '24px';
  button.style.zIndex = '2147483646';
  button.style.border = '0';
  button.style.borderRadius = '9999px';
  button.style.padding = '14px 18px';
  button.style.background = color;
  button.style.color = '#fff';
  button.style.font = '600 14px/1.2 Inter, Arial, sans-serif';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 12px 30px rgba(0,0,0,.25)';

  var iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.title = label;
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
  iframe.style.position = 'fixed';
  iframe.style.right = '24px';
  iframe.style.bottom = '84px';
  iframe.style.width = '360px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.height = '560px';
  iframe.style.maxHeight = 'calc(100vh - 120px)';
  iframe.style.border = '1px solid rgba(255,255,255,0.12)';
  iframe.style.borderRadius = '20px';
  iframe.style.background = '#0a0718';
  iframe.style.boxShadow = '0 20px 45px rgba(0,0,0,.35)';
  iframe.style.zIndex = '2147483647';
  iframe.style.display = 'none';

  function openFrame() {
    iframe.style.display = 'block';
  }

  function closeFrame() {
    iframe.style.display = 'none';
  }

  button.addEventListener('click', function () {
    if (iframe.style.display === 'none') openFrame(); else closeFrame();
  });

  window.addEventListener('message', function (event) {
    if (event.data === 'helpdesk:close') closeFrame();
  });

  document.body.appendChild(button);
  document.body.appendChild(iframe);
})();
