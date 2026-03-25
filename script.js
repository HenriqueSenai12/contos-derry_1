// script.js (limpo; sem funcionalidades de busca duplicadas)
// - Geração de slides por categoria
// - Carregamento de capas (OpenLibrary -> GoogleBooks fallback)
// - Swipers (carrosséis), máscaras, ViaCEP, formulário de contato
// - Animações "aparecer ao scroll"
// - Exposição de window._coverFallbacks e window._renderInjectedResults (hook para search-google.js)

(() => {
  const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // manual fallbacks para capas
  const manualFallbacks = {};

  // categoriesData
  const categoriesData = {
    psych: [
      { title: "Bird Box", author: "Josh Malerman" },
      { title: "The Cabin at the End of the World", author: "Paul Tremblay" },
      { title: "The Sun Down Motel", author: "Simone St. James" },
      { title: "The Only Good Indians", author: "Stephen Graham Jones" },
      { title: "The Silent Patient", author: "Alex Michaelides" },
      { title: "Gone Girl", author: "Gillian Flynn" },
      { title: "Dark Places", author: "Gillian Flynn" },
      { title: "Sharp Objects", author: "Gillian Flynn" }
    ],
    folk: [
      { title: "Mexican Gothic", author: "Silvia Moreno-Garcia" },
      { title: "The Devil and the Dark Water", author: "Stuart Turton" },
      { title: "The Fisherman", author: "John Langan" },
      { title: "The Ritual", author: "Adam Nevill" },
      { title: "The Ballad of Black Tom", author: "Victor LaValle" }
    ],
    thriller: [
      { title: "Gone Girl", author: "Gillian Flynn" },
      { title: "The Girl on the Train", author: "Paula Hawkins" },
      { title: "The Couple Next Door", author: "Shari Lapena" },
      { title: "Big Little Lies", author: "Liane Moriarty" },
      { title: "The Night Fire", author: "Michael Connelly" }
    ],
    cosmic: [
      { title: "At the Mountains of Madness", author: "H. P. Lovecraft" },
      { title: "Annihilation", author: "Jeff VanderMeer" },
      { title: "The Ballad of Black Tom", author: "Victor LaValle" },
      { title: "Lovecraft Country", author: "Matt Ruff" },
      { title: "The Fisherman", author: "John Langan" }
    ],
    ya: [
      { title: "Coraline", author: "Neil Gaiman" },
      { title: "Miss Peregrine's Home for Peculiar Children", author: "Ransom Riggs" },
      { title: "The Graveyard Book", author: "Neil Gaiman" },
      { title: "Goosebumps: Deep Trouble", author: "R. L. Stine" }
    ],
    classicos: [
      { title: "Dracula", author: "Bram Stoker" },
      { title: "Frankenstein", author: "Mary Shelley" },
      { title: "The Strange Case of Dr Jekyll & Mr Hyde", author: "R. L. Stevenson" },
      { title: "The Turn of the Screw", author: "Henry James" }
    ],
    contemporaneos: [
      { title: "It", author: "Stephen King" },
      { title: "Mexican Gothic", author: "Silvia Moreno-Garcia" },
      { title: "The Fisherman", author: "John Langan" },
      { title: "The Only Good Indians", author: "Stephen Graham Jones" }
    ],
    infanto: [
      { title: "Coraline", author: "Neil Gaiman" },
      { title: "Goosebumps: Deep Trouble", author: "R. L. Stine" },
      { title: "The Graveyard Book", author: "Neil Gaiman" }
    ],
    graphic: [
      { title: "Uzumaki", author: "Junji Ito" },
      { title: "Through the Woods", author: "Emily Carroll" },
      { title: "Sandman", author: "Neil Gaiman" }
    ],
    short: [
      { title: "Night Shift", author: "Stephen King" },
      { title: "The King in Yellow", author: "Robert W. Chambers" },
      { title: "Nocturnes", author: "Kazuo Ishiguro" }
    ],
    nonfiction: [
      { title: "Helter Skelter", author: "Vincent Bugliosi" },
      { title: "In Cold Blood", author: "Truman Capote" },
      { title: "The Devil in the White City", author: "Erik Larson" }
    ],
    international: [
      { title: "Uzumaki", author: "Junji Ito" },
      { title: "The Vegetarian", author: "Han Kang" },
      { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson" }
    ],
    adapt: [
      { title: "The Shining", author: "Stephen King" },
      { title: "The Exorcist", author: "William Peter Blatty" },
      { title: "Misery", author: "Stephen King" }
    ],
    famous: [
      { title: "It", author: "Stephen King" },
      { title: "Coraline", author: "Neil Gaiman" },
      { title: "Dracula", author: "Bram Stoker" },
      { title: "The Shining", author: "Stephen King" }
    ]
  };

  // --- DOM helpers and slide generation ---
  function makeSlideElement(item) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide card-slide';
    const img = document.createElement('img');
    img.setAttribute('data-title', `${item.title} ${item.author}`);
    img.alt = `${item.title} — ${item.author}`;
    img.className = 'w-full h-72 md:h-80 object-cover rounded shadow cover-loader';
    const caption = document.createElement('div');
    caption.className = 'mt-2 text-center text-sm';
    caption.textContent = item.title;
    slide.appendChild(img);
    slide.appendChild(caption);
    return slide;
  }

  function populateCategorySlides() {
    Object.keys(categoriesData).forEach(key => {
      const selector = `.swiper-${key}`;
      const container = document.querySelector(selector);
      if (!container) return;
      const wrapper = container.querySelector('.swiper-wrapper');
      if (!wrapper) return;
      wrapper.innerHTML = '';
      categoriesData[key].forEach(item => wrapper.appendChild(makeSlideElement(item)));
    });

    const mainWrapper = document.querySelector('.mySwiper .swiper-wrapper');
    if (mainWrapper) {
      mainWrapper.innerHTML = '';
      (categoriesData.famous || []).forEach(item => mainWrapper.appendChild(makeSlideElement(item)));
    }
  }

  // --- Cover fetching (OpenLibrary -> GoogleBooks fallback) ---
  function buildQueryVariants(title) {
    const variants = new Set();
    const clean = (title || '').trim();
    if (!clean) return [];
    variants.add(clean);
    variants.add(`${clean} novel`);
    variants.add(`${clean} book`);
    variants.add(`${clean} (novel)`);
    const short = clean.split(':')[0].trim();
    if (short) variants.add(short);
    return Array.from(variants);
  }

  async function fetchOpenLibraryCover(title) {
    const variants = buildQueryVariants(title);
    for (const q of variants) {
      try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (!json || !Array.isArray(json.docs) || !json.docs.length) continue;
        const withCover = json.docs.find(d => d.cover_i);
        if (withCover && withCover.cover_i) return `https://covers.openlibrary.org/b/id/${withCover.cover_i}-L.jpg`;
        const withEdition = json.docs.find(d => Array.isArray(d.edition_key) && d.edition_key.length);
        if (withEdition) return `https://covers.openlibrary.org/b/olid/${withEdition.edition_key[0]}-L.jpg`;
        const withIsbn = json.docs.find(d => Array.isArray(d.isbn) && d.isbn.length);
        if (withIsbn) return `https://covers.openlibrary.org/b/isbn/${withIsbn.isbn[0]}-L.jpg`;
      } catch (err) { continue; }
    }
    return null;
  }

  async function fetchGoogleBooksCover(title) {
    const variants = buildQueryVariants(title);
    for (const q of variants) {
      try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (!json || !Array.isArray(json.items) || !json.items.length) continue;
        for (const item of json.items) {
          const info = item.volumeInfo || {};
          if (info.imageLinks) {
            const links = info.imageLinks;
            const candidate = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
            if (candidate) return candidate.startsWith('http') ? candidate.replace(/^http:/, 'https:') : candidate;
          }
        }
      } catch (err) { continue; }
    }
    return null;
  }

  async function fetchCoverForTitle(title) {
    if (!title) return null;
    if (manualFallbacks[title]) return manualFallbacks[title];
    let cover = await fetchOpenLibraryCover(title);
    if (cover) return cover;
    cover = await fetchGoogleBooksCover(title);
    if (cover) return cover;
    const cleaned = title.replace(/['"“”()]/g, '').split(':')[0].trim();
    if (cleaned && cleaned !== title) {
      cover = await fetchOpenLibraryCover(cleaned);
      if (cover) return cover;
      cover = await fetchGoogleBooksCover(cleaned);
      if (cover) return cover;
    }
    return null;
  }

  async function populateCovers(timeoutMs = 14000) {
    const imgs = Array.from(document.querySelectorAll('img[data-title]'));
    if (!imgs.length) return 0;
    const concurrency = 4;
    let index = 0;
    async function worker() {
      while (true) {
        const i = index++;
        if (i >= imgs.length) break;
        const img = imgs[i];
        const title = img.getAttribute('data-title') || '';
        try {
          if (manualFallbacks[title]) {
            img.src = manualFallbacks[title];
            img.classList.add('cover-loaded');
            img.style.background = '';
            continue;
          }
          const coverUrl = await fetchCoverForTitle(title);
          if (coverUrl) {
            await new Promise((resolve, reject) => {
              const pre = new Image();
              pre.crossOrigin = 'anonymous';
              pre.onload = () => resolve(pre.src);
              pre.onerror = () => reject(new Error('load-fail'));
              pre.src = coverUrl;
            });
            img.src = coverUrl;
            img.classList.add('cover-loaded');
            img.style.background = '';
          } else {
            img.src = TRANSPARENT_GIF;
            img.classList.remove('cover-loaded');
            img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(109,40,217,0.08))';
          }
        } catch (err) {
          img.src = TRANSPARENT_GIF;
          img.classList.remove('cover-loaded');
          img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(109,40,217,0.08))';
        }
      }
    }
    const workers = Array.from({ length: concurrency }).map(() => worker());
    await Promise.race([ Promise.all(workers), new Promise(resolve => setTimeout(resolve, timeoutMs)) ]);
    return imgs.length;
  }

  // --- UI: dots / scroll / nav ---
  function getHeaderAndSearchOffset() {
    const header = document.querySelector('header');
    const searchRow = document.getElementById('searchRow');
    const headerH = header ? header.offsetHeight : 0;
    const searchH = (searchRow && getComputedStyle(searchRow).display !== 'none') ? searchRow.offsetHeight : 0;
    return headerH + searchH + 12;
  }

  const sections = Array.from(document.querySelectorAll('.section'));
  const navDots = document.getElementById('dots');

  function initDots() {
    if (!navDots) return;
    navDots.innerHTML = '';
    sections.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = i === 0 ? 'active' : '';
      btn.title = `Ir para seção ${i+1}`;
      btn.setAttribute('aria-label', `Ir para seção ${i+1}`);
      btn.addEventListener('click', (e) => { e.preventDefault(); scrollToIndex(i); });
      navDots.appendChild(btn);
    });
  }
  initDots();

  const topLinks = Array.from(document.querySelectorAll('.nav-link'));
  topLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href') || '';
      const target = document.querySelector(href);
      if (target) {
        const idx = sections.indexOf(target);
        if (idx >= 0) scrollToIndex(idx);
      }
    });
  });

  const mobileToggle = document.getElementById('mobileToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const mobileNav = document.getElementById('mobileNav');
      mobileNav.classList.toggle('hidden');
    });
  }

  let current = 0;
  let isScrolling = false;
  function updateDots(idx) {
    const buttons = Array.from(navDots.children);
    buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
    topLinks.forEach((link, i) => link.classList.toggle('text-[#A78BFA]', i === idx));
  }

  function scrollToIndex(idx) {
    if (idx < 0) idx = 0;
    if (idx >= sections.length) idx = sections.length - 1;
    current = idx;
    isScrolling = true;
    const headerOffset = getHeaderAndSearchOffset();
    const targetTop = window.scrollY + (sections[idx].getBoundingClientRect().top) - headerOffset + 4;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
    updateDots(idx);
    setTimeout(() => isScrolling = false, 700);
  }

  window.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaY) < 6) return;
    if (e.deltaY > 0) {
      if (current < sections.length - 1) scrollToIndex(current + 1);
    } else {
      if (current > 0) scrollToIndex(current - 1);
    }
  }, { passive: true });

  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const headerOffset = getHeaderAndSearchOffset();
      let nearest = 0;
      let smallest = Infinity;
      sections.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        const distance = Math.abs(rect.top - headerOffset);
        if (distance < smallest) {
          smallest = distance;
          nearest = i;
        }
      });
      current = nearest;
      updateDots(current);
    }, 120);
  });

  // ---------- Buy buttons ----------
  function initBuyButtons() {
    document.querySelectorAll('.buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const original = btn.innerText;
        btn.innerText = 'Adicionado ✓';
        btn.setAttribute('disabled', 'true');
        setTimeout(() => {
          btn.innerText = original;
          btn.removeAttribute('disabled');
        }, 1200);
      });
    });
  }

  // ---------- Swipers ----------
  const swiperInstances = {};
  function initSwipers() {
    if (typeof Swiper === 'undefined') return;
    const configs = [
      { sel: '.mySwiper', key: 'main', slidesPerViewDefault: {0:1,768:2,1200:3}, delay: 3000, next: '.swiper-button-next', prev: '.swiper-button-prev', pg: '.swiper-pagination' },
      { sel: '.swiper-psych', key: 'psych', slides:{0:1,640:2,900:3,1200:4}, delay:3500, next:'.swiper-psych-next', prev:'.swiper-psych-prev', pg:'.swiper-psych-pg' },
      { sel: '.swiper-folk', key: 'folk', slides:{0:1,640:2,900:3,1200:4}, delay:3600, next:'.swiper-folk-next', prev:'.swiper-folk-prev', pg:'.swiper-folk-pg' },
      { sel: '.swiper-thriller', key: 'thriller', slides:{0:1,640:2,900:3,1200:4}, delay:3200, next:'.swiper-thriller-next', prev:'.swiper-thriller-prev', pg:'.swiper-thriller-pg' },
      { sel: '.swiper-cosmic', key: 'cosmic', slides:{0:1,640:2,900:3,1200:4}, delay:3700, next:'.swiper-cosmic-next', prev:'.swiper-cosmic-prev', pg:'.swiper-cosmic-pg' },
      { sel: '.swiper-ya', key: 'ya', slides:{0:1,640:2,900:3}, delay:3800, next:'.swiper-ya-next', prev:'.swiper-ya-prev', pg:'.swiper-ya-pg' },
      { sel: '.swiper-classicos', key:'classicos', slides:{0:1,640:2,900:3,1200:4}, delay:3500, next:'.swiper-classicos-next', prev:'.swiper-classicos-prev', pg:'.swiper-classicos-pg' },
      { sel: '.swiper-contemporaneos', key:'contemporaneos', slides:{0:1,640:2,900:3,1200:4}, delay:3200, next:'.swiper-contemporaneos-next', prev:'.swiper-contemporaneos-prev', pg:'.swiper-contemporaneos-pg' },
      { sel: '.swiper-infanto', key:'infanto', slides:{0:1,640:2,900:3}, delay:3600, next:'.swiper-infanto-next', prev:'.swiper-infanto-prev', pg:'.swiper-infanto-pg' },
      { sel: '.swiper-graphic', key:'graphic', slides:{0:1,640:2,900:3,1200:4}, delay:3400, next:'.swiper-graphic-next', prev:'.swiper-graphic-prev', pg:'.swiper-graphic-pg' },
      { sel: '.swiper-short', key:'short', slides:{0:1,640:2,900:3,1200:4}, delay:3300, next:'.swiper-short-next', prev:'.swiper-short-prev', pg:'.swiper-short-pg' },
      { sel: '.swiper-nonfiction', key:'nonfiction', slides:{0:1,640:2,900:3,1200:4}, delay:3800, next:'.swiper-nonfiction-next', prev:'.swiper-nonfiction-prev', pg:'.swiper-nonfiction-pg' },
      { sel: '.swiper-international', key:'international', slides:{0:1,640:2,900:3,1200:4}, delay:3600, next:'.swiper-international-next', prev:'.swiper-international-prev', pg:'.swiper-international-pg' },
      { sel: '.swiper-adapt', key:'adapt', slides:{0:1,640:2,900:3,1200:4}, delay:3500, next:'.swiper-adapt-next', prev:'.swiper-adapt-prev', pg:'.swiper-adapt-pg' }
    ];

    configs.forEach(cfg => {
      if (!document.querySelector(cfg.sel)) return;
      if (swiperInstances[cfg.key]) return;

      const breakpoints = {};
      if (cfg.slides) {
        Object.keys(cfg.slides).forEach(bp => { breakpoints[bp] = { slidesPerView: cfg.slides[bp] }; });
      } else if (cfg.slidesPerViewDefault) {
        Object.keys(cfg.slidesPerViewDefault).forEach(bp => { breakpoints[bp] = { slidesPerView: cfg.slidesPerViewDefault[bp] }; });
      }

      swiperInstances[cfg.key] = new Swiper(cfg.sel, {
        loop: true,
        autoplay: { delay: cfg.delay || 3000, disableOnInteraction: false },
        slidesPerView: 3,
        spaceBetween: 16,
        navigation: { nextEl: cfg.next, prevEl: cfg.prev },
        pagination: { el: cfg.pg, clickable: true },
        breakpoints: Object.keys(breakpoints).length ? breakpoints : { 0:{ slidesPerView:1 }, 640:{ slidesPerView:2 }, 900:{ slidesPerView:3 }, 1200:{ slidesPerView:4 } }
      });

      const el = swiperInstances[cfg.key].el;
      if (el) {
        el.addEventListener('mouseenter', () => swiperInstances[cfg.key].autoplay && swiperInstances[cfg.key].autoplay.stop());
        el.addEventListener('mouseleave', () => swiperInstances[cfg.key].autoplay && swiperInstances[cfg.key].autoplay.start());
      }
    });

    window.swiperInstances = swiperInstances;
  }

  // ----------------------------
  // Phone mask + ViaCEP + Contact
  // ----------------------------
  function applyPhoneMask(el) {
    if (!el) return;
    el.addEventListener('input', () => {
      let v = el.value.replace(/\D/g, '');
      v = v.replace(/^0+/, '');
      if (v.length > 11) v = v.slice(0,11);
      if (v.length <= 10) {
        v = v.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (m,a,b,c) => { return b ? `(${a}) ${b}${c ? '-' + c : ''}` : (a ? `(${a}` : a); });
      } else {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (m,a,b,c) => { return b ? `(${a}) ${b}${c ? '-' + c : ''}` : (a ? `(${a}` : a); });
      }
      el.value = v;
    });
  }
  applyPhoneMask(document.getElementById('phone'));

  const zipInput = document.getElementById('zip');
  const streetInput = document.getElementById('street');
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const cepMsg = document.getElementById('cepMsg');

  async function lookupCep(cepRaw) {
    const cep = (cepRaw || '').replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      if (cepMsg) cepMsg.innerText = 'CEP inválido (use 8 dígitos).';
      return null;
    }
    if (cepMsg) cepMsg.innerText = 'Buscando endereço...';
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error('Erro na requisição');
      const data = await res.json();
      if (data.erro) { if (cepMsg) cepMsg.innerText = 'CEP não encontrado.'; return null; }
      if (streetInput && !streetInput.value) streetInput.value = data.logradouro || '';
      if (cityInput && !cityInput.value) cityInput.value = data.localidade || '';
      if (stateInput && !stateInput.value) stateInput.value = data.uf || '';
      if (cepMsg) cepMsg.innerText = 'Endereço preenchido (verifique e ajuste se necessário).';
      return data;
    } catch (err) { if (cepMsg) cepMsg.innerText = 'Falha ao consultar CEP.'; return null; }
  }

  if (zipInput) {
    zipInput.addEventListener('blur', () => lookupCep(zipInput.value));
    zipInput.addEventListener('input', () => { zipInput.value = zipInput.value.replace(/\D/g, '').slice(0,8).replace(/^(\d{5})(\d{0,3})/, (m,a,b) => b ? `${a}-${b}` : a); });
  }

  // Contact
  const contactForm = document.getElementById('contactForm');
  const contactMsg = document.getElementById('contactMsg');

  function validateContact(formData) {
    const errors = [];
    const email = formData.get('email') || '';
    const name = (formData.get('name') || '').trim();
    const phone = (formData.get('phone') || '').replace(/\D/g, '');
    const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
    if (!name) errors.push('Nome é obrigatório.');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('E-mail inválido.');
    if (!phone || phone.length < 8) errors.push('Telefone inválido.');
    if (!consent) errors.push('É necessário concordar com o contato.');
    return errors;
  }

  async function submitContact(formData) {
    const ENDPOINT = ''; // configure seu endpoint real aqui se houver
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      message: formData.get('message'),
      consent: !!(formData.get('consent') === 'on' || formData.get('consent') === 'true')
    };
    if (ENDPOINT) {
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Erro no servidor');
        return { ok: true, source: 'remote' };
      } catch (err) { return { ok: false, error: err.message || 'Erro' }; }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
        stored.push(Object.assign({ createdAt: new Date().toISOString() }, payload));
        localStorage.setItem('contact_submissions', JSON.stringify(stored));
        return { ok: true, source: 'local' };
      } catch (err) { return { ok: false, error: err.message || 'Erro local' }; }
    }
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!contactMsg) return;
      contactMsg.innerText = '';
      const fd = new FormData(contactForm);
      const errors = validateContact(fd);
      if (errors.length) {
        contactMsg.innerHTML = `<div class="text-sm text-rose-400">${errors.join(' ')}</div>`;
        return;
      }
      const submitBtn = document.getElementById('contactSubmit');
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.innerText = 'Enviando...';
      const result = await submitContact(fd);
      if (result.ok) {
        contactMsg.innerHTML = `<div class="text-sm text-green-300">Mensagem enviada com sucesso (${result.source}). Responderemos em breve.</div>`;
        contactForm.reset();
      } else {
        contactMsg.innerHTML = `<div class="text-sm text-rose-400">Falha ao enviar: ${result.error || 'erro desconhecido'}.</div>`;
      }
      submitBtn.removeAttribute('disabled');
      submitBtn.innerText = 'Enviar mensagem';
    });
  }

  // ----------------------------
  // Scroll animations
  // ----------------------------
  function initScrollAnimations() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const selectors = [
      '.book-card',
      '.product',
      '.card',
      '.swiper-slide',
      '.card-slide',
      '.section h2',
      'blockquote',
      '.testimonial',
      'footer .container > div'
    ];
    const els = Array.from(document.querySelectorAll(selectors.join(',')));
    els.forEach((el, i) => {
      if (el.classList.contains('appear') || el.classList.contains('appear-visible')) return;
      el.classList.add('appear');
      const delay = Math.min(i * 40, 450);
      el.style.transitionDelay = `${delay}ms`;
    });
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('appear-visible');
          el.style.transitionDelay = '';
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

  // ----------------------------
  // Start
  // ----------------------------
  async function start() {
    populateCategorySlides();
    await new Promise(r => setTimeout(r, 80));
    await populateCovers(14000).catch(()=>null);
    initSwipers();
    initScrollAnimations();
    setTimeout(()=>{ Object.values(swiperInstances || {}).forEach(sw => { if (sw && typeof sw.update === 'function') sw.update(); }); }, 900);
    initBuyButtons();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') start(); else window.addEventListener('DOMContentLoaded', start);

  // ----------------------------
  // Exposed helpers for search integration
  // ----------------------------
  window._coverFallbacks = {
    set: (map) => { Object.assign(manualFallbacks, map); populateCovers(6000).then(()=>{ Object.values(swiperInstances || {}).forEach(sw => { if (sw && typeof sw.update === 'function') sw.update(); }); }).catch(()=>{}); },
    log: () => console.info('manualFallbacks:', manualFallbacks)
  };

  // Hook used by search-google.js to inject results
  window._renderInjectedResults = function(items = [], options = {}) {
    const { append = false } = options;
    // find or create #searchGrid inside #section-search
    let grid = document.getElementById('searchGrid');
    if (!grid) {
      const section = document.getElementById('section-search');
      const container = (section && (section.querySelector('.container') || section)) || document.querySelector('main') || document.body;
      grid = document.createElement('div');
      grid.id = 'searchGrid';
      grid.className = 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      container.appendChild(grid);
    }
    if (!append) grid.innerHTML = '';
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      img.alt = `${it.title} ${it.author || ''}`;
      img.className = 'w-full h-48 object-cover mb-3 rounded';
      if (it.cover) { img.src = it.cover; img.onload = () => img.classList.add('cover-loaded'); img.onerror = () => { img.src = TRANSPARENT_GIF; img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(109,40,217,0.08))'; }; }
      else { img.src = TRANSPARENT_GIF; img.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(109,40,217,0.08))'; }
      const titleEl = document.createElement('div'); titleEl.className = 'font-semibold'; titleEl.innerText = it.title || '';
      const authorEl = document.createElement('div'); authorEl.className = 'text-sm text-gray-300/90'; authorEl.innerText = it.author || '';
      const descEl = document.createElement('div'); descEl.className = 'text-sm text-gray-400 mt-2'; descEl.innerText = it.description ? (it.description.length>180?it.description.slice(0,180)+'…':it.description) : '';
      const priceRow = document.createElement('div'); priceRow.className = 'mt-3 flex items-center justify-between';
      const price = document.createElement('div'); price.className = 'font-bold'; price.innerText = `R$ ${Math.floor(20+Math.random()*80)},90`;
      const buyBtn = document.createElement('button'); buyBtn.className = 'buy px-3 py-2 rounded bg-[#A78BFA] text-black'; buyBtn.innerText = 'Comprar';
      buyBtn.addEventListener('click', (e) => { e.preventDefault(); buyBtn.innerText = 'Adicionado ✓'; buyBtn.setAttribute('disabled','true'); setTimeout(()=>{ buyBtn.innerText='Comprar'; buyBtn.removeAttribute('disabled'); },1200); });
      priceRow.appendChild(price); priceRow.appendChild(buyBtn);
      card.appendChild(img); card.appendChild(titleEl); card.appendChild(authorEl); card.appendChild(descEl); card.appendChild(priceRow);
      grid.appendChild(card);
    });
    if (typeof initScrollAnimations === 'function') initScrollAnimations();
  };

  document.documentElement.style.scrollBehavior = 'smooth';
})();