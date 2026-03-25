// cart.js
// - Delegation: captura cliques em botões .buy e adiciona item ao localStorage 'cart_items'.
// - Detecta o botão "Carrinho" no cabeçalho e ao clicar seta sessionStorage.openCart e navega para carrinho.html.
// - Exports helpers window.cartAPI for debugging.

(() => {
  const CART_KEY = 'cart_items';
  const SESSION_FLAG = 'openCartAt';
  const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutos

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('cart read error', e);
      return [];
    }
  }

  function writeCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items || []));
    } catch (e) {
      console.error('cart write error', e);
    }
  }

  function addToCart(item) {
    const cart = readCart();
    // simple id: timestamp + random
    const id = Date.now().toString(36) + '-' + Math.floor(Math.random()*10000);
    const entry = Object.assign({ id, qty: 1, addedAt: Date.now() }, item);
    cart.push(entry);
    writeCart(cart);
    return entry;
  }

  function removeFromCart(id) {
    const cart = readCart().filter(i => i.id !== id);
    writeCart(cart);
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  function findHeaderCartButton() {
    // Prefer an element with exact text "Carrinho" in header
    // search header buttons and anchors
    const header = document.querySelector('header');
    if (!header) return null;
    const candidates = [...header.querySelectorAll('button, a')];
    for (const el of candidates) {
      if (el.textContent && el.textContent.trim().toLowerCase() === 'carrinho') return el;
    }
    // fallback: first button with class containing bg-[#A78BFA] and text contains 'Carr'
    for (const el of candidates) {
      if (el.textContent && el.textContent.trim().toLowerCase().includes('carr')) return el;
    }
    return null;
  }

  function attachCartButtonHandler() {
    const btn = findHeaderCartButton();
    if (!btn) {
      console.warn('Cart button not found in header');
      return;
    }
    btn.addEventListener('click', (e) => {
      // mark session and navigate
      try {
        sessionStorage.setItem(SESSION_FLAG, Date.now().toString());
      } catch (err) { console.warn('sessionStorage set failed', err); }
      // navigate to carrinho.html
      window.location.href = 'carrinho.html';
    });
  }

  function getCardInfoFromElement(cardEl) {
    if (!cardEl) return null;
    // image
    const img = cardEl.querySelector('img');
    const cover = img ? (img.src || img.getAttribute('data-src') || img.getAttribute('data-title') || null) : null;
    // title: common selectors: h3, .font-semibold, .card .font-semibold
    let title = '';
    const h3 = cardEl.querySelector('h3');
    if (h3 && h3.textContent.trim()) title = h3.textContent.trim();
    else {
      const fs = cardEl.querySelector('.font-semibold');
      if (fs && fs.textContent.trim()) title = fs.textContent.trim();
      else {
        // card-slide caption was simple div.mt-2 text
        const mt = cardEl.querySelector('div.mt-2, .mt-2');
        if (mt && mt.textContent.trim()) title = mt.textContent.trim();
      }
    }
    // author (if present)
    let author = '';
    // attempt to parse from caption if contains "—" or "—"
    if (!author) {
      const caption = cardEl.querySelector('.mt-2, .text-sm');
      if (caption && caption.textContent) {
        const txt = caption.textContent.trim();
        // if contains '—' maybe "Title — Author" or just author; try split
        if (txt.includes('—')) {
          const parts = txt.split('—').map(s=>s.trim());
          if (parts.length >= 2) { author = parts.slice(1).join(' — '); if (!title) title = parts[0]; }
        }
      }
    }
    // price
    let priceStr = '';
    let priceNum = null;
    const px = cardEl.querySelector('.font-bold');
    if (px && px.textContent) priceStr = px.textContent.trim();
    if (!priceStr) {
      // search for R$ in text nodes
      const txt = cardEl.textContent || '';
      const match = txt.match(/R\$[\s]*([0-9\.,]+)/);
      if (match) priceStr = 'R$ ' + match[1];
    }
    if (priceStr) {
      // normalize
      const num = (priceStr.replace(/[^\d,\.]/g, '')).replace(/\./g,'').replace(',', '.');
      priceNum = parseFloat(num) || null;
    }
    // fallback title from image data-title attribute
    if ((!title || title.length < 1) && img && img.getAttribute('data-title')) {
      title = img.getAttribute('data-title');
    }
    if (!title) return null;
    return { title, author, cover, priceStr, priceNum };
  }

  // Delegation: capture clicks on any ".buy" button
  function attachBuyDelegation() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.buy');
      if (!btn) return;
      // find nearest card container
      const card = btn.closest('.card, .product, .book-card, .card-slide, .swiper-slide, .product, article');
      const info = getCardInfoFromElement(card);
      if (!info) {
        // try to extract from nearby DOM (e.g., parent article)
        console.warn('Unable to extract book info for cart addition');
        return;
      }
      // add to cart
      const entry = addToCart({
        title: info.title,
        author: info.author,
        cover: info.cover,
        priceStr: info.priceStr || '',
        price: info.priceNum || null
      });
      // visual feedback
      const originalText = btn.innerText;
      btn.innerText = 'Adicionado ✓';
      btn.setAttribute('disabled','true');
      setTimeout(() => { btn.innerText = originalText; btn.removeAttribute('disabled'); }, 1200);
      // small toast or console
      try { console.info('Adicionado ao carrinho', entry); } catch(e){}
    });
  }

  // Expose minimal API for debug
  window.cartAPI = {
    addToCart,
    removeFromCart,
    readCart,
    writeCart,
    clearCart
  };

  // initialize
  try {
    attachCartButtonHandler();
    attachBuyDelegation();
  } catch (err) {
    console.error('cart init error', err);
  }
})();