/* Pamosii Signer — service worker da extensão (MV3)

   Só faz uma coisa: quando a pessoa carrega no ícone da barra do Chrome, diz à
   extensão da página para abrir/fechar o painel. Não lê, guarda nem envia nada —
   é por isso que o manifest.json não declara nenhuma permissão. */

chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { tipo: 'pamosii-alternar' }, () => {
    void chrome.runtime.lastError;   /* páginas sem content script (nova aba, loja) */
  });
});
