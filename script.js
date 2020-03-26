
function selectUserLang(languages) {
  let lang = navigator.language.toLowerCase();
  if (lang in languages) {
    return lang;
  }
  lang = lang.substring(0, 2);
  if (lang in languages) {
    return lang;
  }
  return 'en';
}

async function getLanguages() {
  const apiUrl = 'https://www.wikidata.org/w/api.php?action=query&meta=siteinfo&siprop=languages&format=json&origin=*';
  // todo: check fetch error
  const content = await fetch(apiUrl);
  const json = await content.json();
  return json.query.languages.map(lang => lang.code);
}

async function getLabels(qIds, language, languageFallback) {
  const qIdsStr = qIds.join('|');
  const apiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qIdsStr}&props=labels&languages=${language}&languagefallback=${languageFallback}&format=json&origin=*`;
  // todo: check fetch error
  const content = await fetch(apiUrl);
  const json = await content.json();
  if (json.success !== 1) {
    throw new Error('Get label not successful');
  }
  let result = {};
  for (let [key, value] of Object.entries(json.entities)) {
    result[key] = value.labels[language].value;
  }
  return result;
}

start();

async function start() {
  const content = await fetch('list.json');
  const listJson = await content.json();
  let wikis = listJson.wikis;
  const qIds = wikis.map(wiki => wiki.qid);
  const languages = await getLanguages();
  const userLang = selectUserLang(languages);
  const labels = await getLabels(qIds, userLang, 'en');
  const ul = document.getElementById('list');

  wikis = wikis.map(wiki => {
    wiki.label = labels[wiki.qid];
    return wiki;
  })
    .sort((a, b) => b.label - a.label);

  ul.innerHTML = '';
  wikis
    .forEach((wiki) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      li.appendChild(a);
      a.href = wiki.url;
      a.innerText = wiki.label;
      ul.appendChild(li);
    });
}
