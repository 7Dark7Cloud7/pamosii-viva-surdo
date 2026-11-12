(() => {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search);
  root.classList.toggle('emb', query.get('emb') === '1');
  root.classList.toggle('native', query.get('native') === '1');
  try {
    const preferences = JSON.parse(localStorage.getItem('vs.a11y') || '{}');
    root.toggleAttribute('data-tema-escuro', !!preferences.temaEscuro);
    root.toggleAttribute('data-contraste-alto', !!preferences.contraste);
    root.toggleAttribute('data-movimento-reduzido', !!preferences.movimento);
    root.style.setProperty('--escala', ([100, 115, 130, 150].includes(Number(preferences.escala)) ? Number(preferences.escala) : 100) / 100);
  } catch (_) {}
})();
