// RGAA 8.3 — La langue par défaut de chaque page web est indiquée.
// Critère : L'attribut lang est présent sur la balise <html>.

module.exports = {
  id: 'RGAA 8.3',
  title: 'Langue par défaut de la page',
  script: () => {
    const lang = document.documentElement.getAttribute('lang');
    if (lang === null) {
      return { status: 'fail', value: null, info: 'Attribut lang absent sur <html>' };
    }
    if (lang.trim() === '') {
      return { status: 'warn', value: '', info: 'Attribut lang présent mais vide' };
    }
    return { status: 'pass', value: lang, info: `lang="${lang}"` };
  }
};
