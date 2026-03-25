/* search-google.js
   Resultados exibidos em painel enquadrado logo abaixo da barra de pesquisa (#searchRow),
   capas proporcionais (mantêm aspecto) e grid responsivo.
   Inclua APÓS script.js no index.html.
   API key já embutida (fornecida).
*/

(() => {
  const LOG = (...args) => { try { console.info('[search-google]', ...args); } catch(e){} };
  // ===== CONFIG =====
  const API_KEY = 'AIzaSyBt-KEhezd4rUWggzo0q1c6vaXWsV7zRUA';
  const PAGE_SIZE = 12;
  const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // ===== Helpers: cria painel abaixo da barra de pesquisa (#searchRow) =====
  function ensureResultsPanel() {
    // se já existe painel, retorna
    let panel = document.getElementById('search-results-panel');
    if (panel) return panel;

    // localiza searchRow (barra de pesquisa)
    const searchRow = document.getElementById('searchRow');
    // cria painel
    panel = document.createElement('div');
    panel.id = 'search-results-panel';
    // estilo inline leve para enquadramento (não altera CSS global)
    panel.style.width = '100%';
    panel.style.boxSizing = 'border-box';
    panel.style.padding = '18px 0';
    panel.style.background = 'transparent';
    panel.style.zIndex = '30';

    // cria container centralizado (mesma largura do restante)
    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 lg:px-20';
    container.style.boxSizing = 'border-box';

    // painel interno com borda sutil e fundo escuro semi-transparente para "enquadrar"
    const frame = document.createElement('div');
    frame.id = 'search-results-frame';
    frame.style.background = 'rgba(10,8,15,0.6)';
    frame.style.border = '1px solid rgba(255,255,255,0.04)';
    frame.style.padding = '18px';
    frame.style.borderRadius = '12px';
    frame.style.boxShadow = '0 8px 30px rgba(0,0,0,0.45)';
    frame.style.minHeight = '60px';
    frame.style.overflow = 'visible';

    // heading row
    const headingRow = document.createElement('div');
    headingRow.className = 'flex items-center justify-between mb-4';
    const h2 = document.createElement('h2');
    h2.id = 'searchHeading';
    h2.className = 'text-2xl font-bold';
    h2.style.color = '#EDE7FE';
    h2.innerText = 'Resultados';
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearSearchPanel';
    clearBtn.className = 'text-sm text-gray-400 underline';
    clearBtn.type = 'button';
    clearBtn.innerText = 'Limpar';
    headingRow.appendChild(h2);
    headingRow.appendChild(clearBtn);
    frame.appendChild(headingRow);

    // grid responsivo
    const grid = document.createElement('div');
    grid.id = 'searchGrid';
    grid.className = 'search-grid';
    // estilos inline para o grid (mantém responsivo)
    grid.style.display = 'grid';
    grid.style.gridGap = '16px';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(160px, 1fr))';
    grid.style.alignItems = 'start';

    frame.appendChild(grid);

    // load more wrapper
    const moreRow = document.createElement('div');
    moreRow.style.marginTop = '16px';
    moreRow.style.textAlign = 'center';
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMore';
    loadMoreBtn.className = 'px-4 py-2 rounded';
    loadMoreBtn.style.background = '#7C3AED';
    loadMoreBtn.style.color = '#000';
    loadMoreBtn.style.border = 'none';
    loadMoreBtn.style.display = 'none';
    loadMoreBtn.innerText = 'Carregar mais';
    moreRow.appendChild(loadMoreBtn);
    frame.appendChild(moreRow);

    container.appendChild(frame);
    panel.appendChild(container);

    // inserir logo após searchRow; se não existir, inserir abaixo do header
    if (searchRow && searchRow.parentNode) {
      searchRow.parentNode.insertBefore(panel, searchRow.nextSibling);
    } else {
      const header = document.querySelector('header');
      if (header && header.parentNode) header.parentNode.insertBefore(panel, header.nextSibling);
      else document.body.insertBefore(panel, document.body.firstChild);
    }

    // clear button behavior
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearResults();
    });

    return panel;
  }

  function ensureGrid() {
    ensureResultsPanel();
    return document.getElementById('searchGrid');
  }

  function getLoadMore() {
    ensureResultsPanel();
    return document.getElementById('loadMore');
  }

  function setLoadMoreVisible(show) {
    const btn = getLoadMore();
    if (!btn) return;
    btn.style.display = show ? 'inline-block' : 'none';
  }

  // ===== Google Books fetch & mapping =====
  function mapGoogleItem(item) {
    const info = item.volumeInfo || {};
    const links = info.imageLinks || {};
    const cover = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail || null;
    const title = info.title || 'Sem título';
    const author = Array.isArray(info.authors) && info.authors.length ? info.authors.join(', ') : '';
    const description = info.description || info.subtitle || '';
    return { title, author, cover, description };
  }

  async function fetchGoogleBooks(query, startIndex = 0, maxResults = PAGE_SIZE) {
    try {
      const keyPart = API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : '';
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}${keyPart}`;
      const res = await fetch(url);
      if (!res.ok) {
        let body = null;
        try { body = await res.json(); } catch(e) { body = await res.text(); }
        LOG('Google Books não OK', res.status, body);
        return { items: [], total: 0, error: { status: res.status, body } };
      }
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items.map(mapGoogleItem) : [];
      return { items, total: json.totalItems || 0, error: null };
    } catch (err) {
      LOG('fetch error', err);
      return { items: [], total: 0, error: err };
    }
  }

  // ===== Render cartões com capas proporcionais =====
  function createCard(book) {
    const card = document.createElement('div');
    card.className = 'search-card';
    card.style.background = 'transparent';
    card.style.borderRadius = '8px';
    card.style.overflow = 'hidden';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.textAlign = 'center';
    card.style.padding = '8px';

    // imagem: manter proporção (object-fit: contain) e centralizada
    const imgWrap = document.createElement('div');
    imgWrap.style.width = '100%';
    imgWrap.style.display = 'flex';
    imgWrap.style.justifyContent = 'center';
    imgWrap.style.alignItems = 'center';
    imgWrap.style.height = '220px'; // altura proporcional
    imgWrap.style.background = 'rgba(255,255,255,0.02)';
    imgWrap.style.borderRadius = '6px';
    imgWrap.style.boxSizing = 'border-box';
    imgWrap.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.alt = `${book.title} ${book.author || ''}`;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';

    if (book.cover) {
      img.src = book.cover;
      img.onload = () => img.classList.add('cover-loaded');
      img.onerror = () => { img.src = TRANSPARENT; img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.06), rgba(109,40,217,0.04))'; };
    } else {
      img.src = TRANSPARENT;
      img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.06), rgba(109,40,217,0.04))';
    }

    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    const titleEl = document.createElement('div');
    titleEl.className = 'font-semibold';
    titleEl.style.marginTop = '8px';
    titleEl.style.fontSize = '0.95rem';
    titleEl.style.color = '#EDE7FE';
    titleEl.innerText = book.title || '';

    const authorEl = document.createElement('div');
    authorEl.className = 'text-sm text-gray-300/90';
    authorEl.style.marginTop = '6px';
    authorEl.innerText = book.author || '';

    card.appendChild(titleEl);
    card.appendChild(authorEl);

    return card;
  }

  // ===== Estado / fluxo de busca =====
  let currentQuery = '';
  let currentIndex = 0;
  let totalItems = 0;

  function showLoading() {
    const grid = ensureGrid();
    let loading = document.getElementById('search-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'search-loading';
      loading.className = 'text-gray-400';
      loading.style.marginTop = '8px';
      loading.innerText = 'Buscando...';
      grid.appendChild(loading);
    } else loading.style.display = '';
  }
  function hideLoading() {
    const loading = document.getElementById('search-loading');
    if (loading) loading.style.display = 'none';
  }

  async function searchAndRender(query, reset = true) {
    if (!query || !query.trim()) return;
    if (reset) {
      currentIndex = 0;
      totalItems = 0;
      const grid = ensureGrid();
      grid.innerHTML = '';
      const heading = document.getElementById('searchHeading');
      if (heading) heading.innerText = `Resultados para "${query}"`;
      const panel = document.getElementById('search-results-panel');
      if (panel) try { panel.style.display = 'block'; } catch(e){}
    }

    showLoading();
    const { items, total, error } = await fetchGoogleBooks(query, currentIndex, PAGE_SIZE);
    hideLoading();

    if (error) {
      // fallback mensagem
      const grid = ensureGrid();
      const errEl = document.createElement('div');
      errEl.className = 'text-gray-400';
      errEl.innerText = `Erro na busca (Google Books): ${error && error.status ? error.status : 'ver console'}`;
      grid.appendChild(errEl);
      setLoadMoreVisible(false);
      return;
    }

    if (!items || items.length === 0) {
      if (currentIndex === 0) {
        const grid = ensureGrid();
        const empty = document.createElement('div');
        empty.className = 'text-gray-400';
        empty.innerText = 'Nenhum resultado encontrado.';
        grid.appendChild(empty);
      }
      setLoadMoreVisible(false);
      return;
    }

    // injetar itens (usamos hook do script principal se disponível)
    const mapped = items.map(it => ({ title: it.title, author: it.author, cover: it.cover, description: it.description }));
    if (typeof window._renderInjectedResults === 'function') {
      try {
        window._renderInjectedResults(mapped, { query, append: !reset });
      } catch (err) {
        LOG && LOG('hook threw', err);
        const grid = ensureGrid();
        items.forEach(it => grid.appendChild(createCard(it)));
      }
    } else {
      const grid = ensureGrid();
      items.forEach(it => grid.appendChild(createCard(it)));
    }

    currentIndex += items.length;
    totalItems = total || totalItems;

    setLoadMoreVisible(totalItems > currentIndex);
  }

  // ===== Handlers do formulário: PREVINE o envio padrão e usa a função nova =====
  function attachSearchHandlers() {
    const mainForm = document.getElementById('searchForm');
    const mobileForm = document.getElementById('searchFormMobile');
    const inputMain = document.getElementById('searchInput');
    const inputMobile = document.getElementById('searchInputMobile');

    function onSubmit(e, inputEl) {
      e.preventDefault();
      const q = (inputEl && inputEl.value) ? inputEl.value.trim() : '';
      if (!q) return;
      currentQuery = q;
      searchAndRender(currentQuery, true).catch(err => LOG && LOG('search err', err));
      const mobileNav = document.getElementById('mobileNav');
      if (mobileNav && !mobileNav.classList.contains('hidden')) mobileNav.classList.add('hidden');
    }

    if (mainForm && inputMain) mainForm.addEventListener('submit', (e) => onSubmit(e, inputMain));
    if (mobileForm && inputMobile) mobileForm.addEventListener('submit', (e) => onSubmit(e, inputMobile));

    const loadBtn = getLoadMore();
    if (loadBtn && !loadBtn._attached) {
      loadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentQuery) return;
        searchAndRender(currentQuery, false).catch(err => LOG && LOG('load more err', err));
      });
      loadBtn._attached = true;
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureResultsPanel();
      attachSearchHandlers();
      LOG && LOG('initialized (API key set)');
    });
  } else {
    ensureResultsPanel();
    attachSearchHandlers();
    LOG && LOG('initialized (API key set)');
  }

  // expose debug
  window._searchGoogle = { apiKey: API_KEY, searchAndRender, fetchGoogleBooks };

})();