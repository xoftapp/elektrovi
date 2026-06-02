document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ ELEKTROVI initialisé');
  
  const SHEET_API = 'https://script.google.com/macros/s/TON_ID_ICI/exec';

  try { if(typeof emailjs !== 'undefined') emailjs.init('HLzQ95uBYNm6V4kJW'); } catch(e) {}

  let cart = JSON.parse(localStorage.getItem('ek_cart')) || [];
  let currentCat = 'all';
  let allProducts = [];
  let currentProduct = null;

  const FALLBACK = [
    {id:1,name:'iPhone 15 Pro Max 256Go',category:'telephones',condition:'neuf',price:850000,sale_price:799000,description:'Smartphone Apple avec puce A17 Pro, écran Super Retina XDR 6.7 pouces, système photo pro avec téléobjectif 5x, action button et titane de qualité aérospatiale. Autonomie exceptionnelle.',images:['https://placehold.co/600x600/1e293b/fff?text=iPhone+Face','https://placehold.co/600x600/334155/fff?text=iPhone+Dos','https://placehold.co/600x600/475569/fff?text=iPhone+Profil']},
    {id:2,name:'Routeur Wi-Fi 6 TP-Link AX3000',category:'connectivite',condition:'neuf',price:85000,sale_price:null,description:'Routeur double bande Wi-Fi 6 ultra-rapide avec 4 antennes haute performance. Idéal pour streaming 4K, gaming sans latence et maisons connectées. Port Gigabit Ethernet.',images:['https://placehold.co/600x600/0f172a/fff?text=Routeur+1','https://placehold.co/600x600/1e293b/fff?text=Routeur+2','https://placehold.co/600x600/334155/fff?text=Routeur+3']},
    {id:3,name:'MacBook Air M2 13"',category:'informatique',condition:'occasion',price:950000,sale_price:875000,description:'Ordinateur portable ultra-léger avec puce Apple M2, écran Liquid Retina 13.6 pouces, 8Go RAM, 256Go SSD. Batterie à 92% de capacité. Garantie 3 mois. Excellent état.',images:['https://placehold.co/600x600/2563eb/fff?text=MacBook+1','https://placehold.co/600x600/1d4ed8/fff?text=MacBook+2','https://placehold.co/600x600/3b82f6/fff?text=MacBook+3']},
    {id:4,name:'Climatiseur Samsung 12000 BTU',category:'electromenager',condition:'neuf',price:420000,sale_price:null,description:'Climatiseur Inverter économe en énergie (classe A+++), silencieux (22dB), mode nuit intelligent, filtration avancée Anti-Dust. Installation disponible sur demande. Garantie 2 ans.',images:['https://placehold.co/600x600/f59e0b/fff?text=Clim+1','https://placehold.co/600x600/d97706/fff?text=Clim+2','https://placehold.co/600x600/b45309/fff?text=Clim+3']}
  ];

  const $ = id => document.getElementById(id);
  const els = {
    grid: $('grid'), catBtn: $('cat-btn'), catMenu: $('cat-menu'), emptyMsg: $('empty-msg'),
    cartBtn: $('cart-btn'), cartBadge: $('cart-badge'), cartModal: $('cart-modal'), cartList: $('cart-list'), cartTotal: $('cart-total'),
    checkoutBtn: $('checkout-btn'), checkoutModal: $('checkout-modal'), checkoutForm: $('checkout-form'), formErr: $('form-err'),
    carousel: $('carousel'), cPrev: $('c-prev'), cNext: $('c-next'), dots: document.querySelectorAll('.dot'),
    productModal: $('product-modal'), productContent: $('product-content'), closeProduct: $('close-product'),
    mobileBtn: $('mobile-btn'), navList: document.querySelector('.nav-list')
  };

  const fmt = p => new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
  const saveCart = () => localStorage.setItem('ek_cart', JSON.stringify(cart));
  const updateBadge = () => { const t = cart.reduce((s,i)=>s+i.qty,0); els.cartBadge.textContent = t; els.cartBadge.style.display = t>0?'flex':'none'; };

  async function loadProducts() {
    els.grid.innerHTML = '<p style="text-align:center;padding:40px;color:#64748b;">⏳ Chargement du catalogue...</p>';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(SHEET_API, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Aucun produit');
      allProducts = data;
      console.log('✅ Sheets chargé:', allProducts.length, 'produits');
    } catch (err) {
      console.warn('⚠️ Sheets indisponible, fallback activé:', err.message);
      allProducts = FALLBACK;
    }
    renderGrid();
  }

  function renderGrid() {
    els.grid.innerHTML = '';
    let visible = 0;
    allProducts.forEach(p => {
      const condLabel = p.condition === 'neuf' ? 'Neuf' : 'Occasion';
      const condClass = p.condition === 'neuf' ? 'badge-neuf' : 'badge-occ';
      const priceHTML = p.sale_price ? `<span class="p-old">${fmt(p.price)}</span><span class="p-sale">${fmt(p.sale_price)}</span>` : `<span class="p-norm">${fmt(p.price)}</span>`;
      const mainImg = p.images?.[0] || 'https://placehold.co/400x400/e2e8f0/64748b?text=Produit';
      
      const card = document.createElement('div');
      card.className = 'card'; card.dataset.cat = p.category; card.dataset.id = p.id;
      card.innerHTML = `
        <div class="card-img">
          <span class="badge-cond ${condClass}">${condLabel}</span>
          <img class="main" src="${mainImg}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x400/e2e8f0/64748b?text=Image+indisponible'">
          <div class="thumbs">
            ${p.images?.slice(1).map((u,i)=>`<img class="thumb ${i===0?'active':''}" src="${u}" data-main="${u}" data-pid="${p.id}" onerror="this.style.display='none'">`).join('') || ''}
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-name">${p.name}</h3>
          <div class="price">${priceHTML}</div>
          <p class="desc">${p.description}</p>
          <button class="btn btn-primary view-btn" data-id="${p.id}"><i class="fa-solid fa-eye"></i> Voir les détails</button>
        </div>`;
      els.grid.appendChild(card);
      card.addEventListener('click', () => openProductModal(p));
      const show = currentCat === 'all' || p.category === currentCat;
      card.classList.toggle('hidden', !show);
      if(show) visible++;
    });
    els.emptyMsg.style.display = visible === 0 ? 'block' : 'none';
  }

  window.openProductModal = function(p) {
    currentProduct = p;
    const condLabel = p.condition === 'neuf' ? 'Neuf' : 'Occasion';
    const condClass = p.condition === 'neuf' ? 'badge-neuf' : 'badge-occ';
    const priceHTML = p.sale_price ? `<span class="p-old">${fmt(p.price)}</span><span class="p-sale">${fmt(p.sale_price)}</span>` : `<span class="p-norm">${fmt(p.price)}</span>`;
    const catLabels = {'telephones':'📱 Téléphones & Accessoires','connectivite':'📡 Connectivité & Réseau','informatique':'💻 Informatique','electromenager':'🌡️ Électroménager'};
    
    els.productContent.innerHTML = `
      <div class="product-detail-scroll">
        <div class="product-detail">
          <div class="product-detail-img"><img src="${p.images?.[0]||'https://placehold.co/600x600/e2e8f0/64748b?text=Produit'}" alt="${p.name}" onerror="this.src='https://placehold.co/600x600/e2e8f0/64748b?text=Image'"></div>
          <div class="product-detail-info">
            <div class="product-detail-header"><h2 class="product-detail-name">${p.name}</h2><div class="product-detail-price">${priceHTML}</div><span class="badge-cond ${condClass}" style="display:inline-block;margin-top:8px">${condLabel}</span></div>
            <div class="product-detail-meta"><p><strong>📂 Catégorie:</strong> ${catLabels[p.category]||p.category}</p><p><strong>🔖 Référence:</strong> #${p.id}</p><p><strong>✅ Disponibilité:</strong> ${p.condition==='neuf'?'En stock (Neuf)':'En stock (Occasion vérifiée)'}</p></div>
            <div class="product-detail-desc"><h3>📋 Description complète</h3><p>${p.description}</p></div>
          </div>
        </div>
      </div>
      <div class="product-detail-actions">
        <button class="btn btn-primary" onclick="addToCartFromModal()"><i class="fa-solid fa-cart-plus"></i> Ajouter au panier</button>
        <button class="btn btn-sec" onclick="closeProductModal()">Fermer</button>
      </div>`;
    els.productModal.classList.add('active'); document.body.style.overflow = 'hidden';
  };

  window.closeProductModal = function() { els.productModal.classList.remove('active'); document.body.style.overflow = ''; currentProduct = null; };
  window.addToCartFromModal = function() {
    if(!currentProduct) return;
    const ex = cart.find(x=>x.id===currentProduct.id);
    ex ? ex.qty++ : cart.push({id:currentProduct.id, name:currentProduct.name, price:currentProduct.sale_price||currentProduct.price, qty:1});
    saveCart(); updateBadge(); alert('✅ Produit ajouté au panier !'); closeProductModal();
  };

  // FILTRE
  els.catBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); els.catMenu.classList.toggle('open'); });
  document.addEventListener('click', e => { if(!els.catBtn.contains(e.target) && !els.catMenu.contains(e.target)) els.catMenu.classList.remove('open'); });
  els.catMenu.addEventListener('click', e => {
    if(e.target.classList.contains('dropdown-item')) {
      e.preventDefault(); e.stopPropagation(); currentCat = e.target.dataset.cat;
      document.querySelectorAll('.dropdown-item').forEach(el=>el.classList.toggle('active', el.dataset.cat===currentCat));
      document.querySelectorAll('.cat-card').forEach(c=>c.style.borderColor = c.dataset.cat===currentCat?'var(--p)':'transparent');
      els.catMenu.classList.remove('open'); renderGrid();
    }
  });
  document.querySelectorAll('.cat-card').forEach(c => c.addEventListener('click', () => {
    currentCat = c.dataset.cat; document.querySelectorAll('.cat-card').forEach(x=>x.style.borderColor='transparent');
    c.style.borderColor = 'var(--p)'; renderGrid(); $('produits').scrollIntoView({behavior:'smooth'});
  }));

  // CARROUSEL
  let slide = 0; const totalSlides = 3;
  const goSlide = i => { slide = (i + totalSlides) % totalSlides; els.carousel.style.transform = `translateX(-${slide*100}%)`; els.dots.forEach((d,j)=>d.classList.toggle('active', j===slide)); };
  els.cPrev?.addEventListener('click', ()=>goSlide(slide-1));
  els.cNext?.addEventListener('click', ()=>goSlide(slide+1));
  els.dots.forEach(d => d.addEventListener('click', ()=>goSlide(+d.dataset.i)));
  setInterval(()=>goSlide(slide+1), 4000);

  // MENU MOBILE - CORRECTION
  els.mobileBtn.addEventListener('click', () => {
    els.navList.classList.toggle('mobile-open');
  });
  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (e) => {
    if (!els.mobileBtn.contains(e.target) && !els.navList.contains(e.target)) {
      els.navList.classList.remove('mobile-open');
    }
  });

  // PANIER
  els.cartBtn.addEventListener('click', () => { renderCart(); els.cartModal.classList.add('active'); });
  document.querySelectorAll('.close').forEach(b => b.addEventListener('click', () => { els.cartModal.classList.remove('active'); els.checkoutModal.classList.remove('active'); }));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.classList.remove('active'); }));
  els.closeProduct.addEventListener('click', closeProductModal);

  function renderCart() {
    els.cartList.innerHTML = ''; els.cartTotal.textContent = '0 FCFA';
    if(!cart.length) { els.cartList.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">Panier vide</p>'; return; }
    let tot = 0;
    cart.forEach((item, idx) => {
      tot += item.price * item.qty;
      els.cartList.innerHTML += `<div class="cart-item"><div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">${fmt(item.price)} x ${item.qty}</div></div><div class="qty-ctrl"><button class="q-btn minus" data-idx="${idx}">➖</button><span class="q-val">${item.qty}</span><button class="q-btn plus" data-idx="${idx}">➕</button><button class="q-del" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button></div></div>`;
    });
    els.cartTotal.textContent = fmt(tot);
  }

  els.cartList.addEventListener('click', e => {
    const btn = e.target.closest('.minus,.plus,.q-del'); if(!btn) return;
    const idx = +btn.dataset.idx;
    if(btn.classList.contains('minus')) cart[idx].qty--;
    else if(btn.classList.contains('plus')) cart[idx].qty++;
    else cart.splice(idx, 1);
    cart = cart.filter(i=>i.qty>0); saveCart(); updateBadge(); renderCart();
  });

  els.grid.addEventListener('click', e => {
    if(e.target.classList.contains('thumb')) {
      e.stopPropagation(); const pid = e.target.dataset.pid;
      const main = document.querySelector(`.card[data-id="${pid}"] .main`);
      if(main) main.src = e.target.dataset.main;
      document.querySelectorAll(`.thumb[data-pid="${pid}"]`).forEach(t=>t.classList.remove('active'));
      e.target.classList.add('active');
    }
  });

  // COMMANDE
  els.checkoutBtn.addEventListener('click', () => { if(!cart.length) return alert('Panier vide.'); els.cartModal.classList.remove('active'); els.checkoutModal.classList.add('active'); });
  $('back-cart').addEventListener('click', () => { els.checkoutModal.classList.remove('active'); renderCart(); els.cartModal.classList.add('active'); });

  els.checkoutForm.addEventListener('submit', async e => {
    e.preventDefault(); els.formErr.textContent = '';
    const d = Object.fromEntries(new FormData(els.checkoutForm));
    const err = [];
    if(!d.lastname.trim()) err.push('Nom requis.');
    if(!d.firstname.trim()) err.push('Prénom requis.');
    if(!d.address.trim()) err.push('Adresse requise.');
    if(err.length) { els.formErr.innerHTML = err.map(x=>'• '+x).join('<br>'); return; }

    const sub = els.checkoutForm.querySelector('button[type="submit"]');
    sub.disabled = true; sub.textContent = 'Envoi...';

    const order = {
      id:'CMD-'+Date.now().toString().slice(-6), date:new Date().toLocaleString('fr-FR'),
      client:{nom:d.lastname.trim(),prenom:d.firstname.trim(),tel:d.phone||'Non fourni',email:d.email||'Non fourni',adr:d.address.trim(),notes:d.notes||'Aucune'},
      items:cart.map(i=>({nom:i.name,prix:i.price,qty:i.qty,sous:i.price*i.qty})),
      total:cart.reduce((s,i)=>s+i.price*i.qty,0)
    };

    let wa = `NOUVELLE COMMANDE ELEKTROVI\nRef: ${order.id}\n\nCLIENT: ${order.client.nom} ${order.client.prenom}\nTel: ${order.client.tel}\nAdr: ${order.client.adr}\n\nARTICLES:\n`;
    order.items.forEach(i=>wa+=`- ${i.nom} x${i.qty} = ${fmt(i.sous)}\n`);
    wa+=`\nTOTAL: ${fmt(order.total)}\nMerci de confirmer.`;
    window.open(`https://wa.me/22890393720?text=${encodeURIComponent(wa)}`, '_blank');

    try {
      const itemsList = order.items.map(i => `• ${i.nom} (x${i.qty}) = ${fmt(i.sous)}`).join('\n');
      await emailjs.send('service_7kf80k3', 'template_8b6thud', {
        order_id:order.id, order_date:order.date, client_name:`${order.client.prenom} ${order.client.nom}`,
        client_phone:order.client.tel, client_email:order.client.email, client_address:order.client.adr,
        client_notes:order.client.notes, order_items:itemsList, order_total:fmt(order.total), to_email:'davhbiz@gmail.com'
      });
    } catch(e) { console.error('Email err:', e); }

    alert('✅ Commande envoyée !');
    cart = []; saveCart(); updateBadge(); renderCart(); els.checkoutModal.classList.remove('active'); els.checkoutForm.reset();
    sub.disabled = false; sub.textContent = 'Confirmer & Envoyer';
  });

  $('year').textContent = new Date().getFullYear();
  loadProducts(); updateBadge();
});
