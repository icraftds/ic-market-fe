<script setup>
import { onMounted } from 'vue';

definePageMeta({ layout: 'default' })

onMounted(() => {

    (() => {
        'use strict';

        /* ── Category Filter ── */
        const catItems = document.querySelectorAll('.cat-item');
        const cards    = document.querySelectorAll('.product-card');
        const countEl  = document.getElementById('product-count');

        function filterCards(cat) {
            let visible = 0;
            cards.forEach(card => {
                const cardCat = card.dataset.category;
                const show    = cat === 'semua' || cardCat === cat;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });
            if (countEl) countEl.textContent = visible;
        }

        catItems.forEach(item => {
            item.addEventListener('click', () => {
                catItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                filterCards(item.dataset.cat);
            });
        });

        /* ── Search Filter ── */
        const searchInput = document.getElementById('main-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.toLowerCase().trim();
                let visible = 0;
                cards.forEach(card => {
                    const title = (card.dataset.title || '').toLowerCase();
                    const cat   = (card.dataset.category || '').toLowerCase();
                    const tags  = (card.dataset.tags || '').toLowerCase();
                    const show  = !q || title.includes(q) || cat.includes(q) || tags.includes(q);
                    card.style.display = show ? '' : 'none';
                    if (show) visible++;
                });
                if (countEl) countEl.textContent = visible;
            });
        }

        /* ── Wishlist Toggle ── */
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                btn.classList.toggle('wishlisted');
                const icon = btn.querySelector('i');
                if (btn.classList.contains('wishlisted')) {
                    icon.className = 'fa-solid fa-heart';
                } else {
                    icon.className = 'fa-regular fa-heart';
                }
            });
        });

        /* ── Cart (localStorage) ── */
        const CART_KEY = 'icmarket_cart';
        function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
        function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); window.dispatchEvent(new CustomEvent('icmarket-cart-updated')); }

        function addToCart(card) {
            const cart = getCart();
            const item = {
                id:       card.dataset.title.replace(/\s+/g,'-').toLowerCase() + '-' + Date.now(),
                name:     card.dataset.title,
                category: card.dataset.category,
                store:    card.dataset.store || 'iCraft Demo Store',
                tags:     (card.dataset.tags || '').split(',').map(t => t.trim()),
                price:    parseInt(card.dataset.price) || 0,
                img:      card.dataset.img || '',
                isFree:   card.dataset.free === 'true'
            };
            // Prevent duplicate titles
            if (!cart.find(i => i.name === item.name)) cart.push(item);
            saveCart(cart);
            updateCartBadge();
        }

        function updateCartBadge() {
            const n = getCart().length;
            const el = document.getElementById('cart-count');
            if (el) el.textContent = n;
        }
        updateCartBadge();

        /* ── Header cart button → /cart ── */
        document.getElementById('cart-btn')?.addEventListener('click', () => {
            window.location.href = '/cart';
        });

        /* ── Hero Card Stack Logic ── */
        const stackCards = Array.from(document.querySelectorAll('.stack-card'));
        const stackBtns  = document.querySelectorAll('.hero-featured-btn');
        
        // Let's store the current order in an array [front, middle, back]
        // Initially, card--1 is front, card--2 is middle, card--3 is back.
        let order = [
            document.querySelector('.stack-card--1'),
            document.querySelector('.stack-card--2'),
            document.querySelector('.stack-card--3')
        ];

        stackCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // If clicked on the buy button, don't rotate
                if (e.target.closest('.hero-featured-btn')) return;

                const clickedIndex = order.indexOf(card);
                if (clickedIndex === 0) return; // already front

                // Remove old classes
                order.forEach((c, i) => {
                    c.classList.remove(`stack-card--${i+1}`);
                    c.classList.remove('stack-active');
                });

                if (clickedIndex === 1) {
                    // Clicked middle: middle goes front, front goes back, back goes middle
                    order = [order[1], order[2], order[0]];
                } else if (clickedIndex === 2) {
                    // Clicked back: back goes front, front goes middle, middle goes back
                    order = [order[2], order[0], order[1]];
                }

                // Apply new classes
                order.forEach((c, i) => {
                    c.classList.add(`stack-card--${i+1}`);
                    if (i === 0) c.classList.add('stack-active');
                });
            });
        });

        /* ── Featured Card Buy Button ── */
        stackBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const fakeCard = { dataset: {
                    title:    btn.dataset.title,
                    category: btn.dataset.category,
                    price:    btn.dataset.price,
                    img:      btn.dataset.img,
                    tags:     btn.dataset.tags,
                    free:     'false'
                }};
                addToCart(fakeCard);
                showToast(`"${btn.dataset.title}" ditambahkan ke keranjang!`);
            });
        });

        /* ── Preview Modal ── */
        const previewModal = document.getElementById('preview-modal');
        const closePreview = document.getElementById('close-preview');

        function openPreview(card) {
            document.getElementById('modal-img').src = card.dataset.img || '';
            document.getElementById('modal-title').textContent = card.dataset.title || '—';

            const isFree = card.dataset.free === 'true';
            const priceEl = document.getElementById('modal-price');
            priceEl.textContent = isFree ? 'Gratis' : `Rp ${parseInt(card.dataset.price).toLocaleString('id-ID')}`;
            priceEl.className   = 'modal-price' + (isFree ? ' free' : '');

            document.getElementById('modal-rating-text').textContent =
                `${card.dataset.rating} (${card.dataset.reviews} ulasan)`;
            document.getElementById('modal-desc').textContent = card.dataset.desc || '—';

            const tagsEl = document.getElementById('modal-tags');
            tagsEl.innerHTML = '';
            (card.dataset.tags || '').split(',').forEach(t => {
                const span = document.createElement('span');
                span.className = 'modal-tag';
                span.textContent = t.trim();
                tagsEl.appendChild(span);
            });

            const featEl = document.getElementById('modal-features');
            featEl.innerHTML = '';
            (card.dataset.features || '').split(',').forEach(f => {
                const li = document.createElement('li');
                li.textContent = f.trim();
                featEl.appendChild(li);
            });

            const buyDirectBtn = document.getElementById('modal-buy-direct-btn');
            const addCartBtn   = document.getElementById('modal-add-cart-btn');
            
            if (isFree) {
                buyDirectBtn.style.display = 'none';
                addCartBtn.querySelector('span').textContent = 'Download Gratis';
                addCartBtn.querySelector('i').className = 'fa-solid fa-download';
            } else {
                buyDirectBtn.style.display = '';
                addCartBtn.querySelector('span').textContent = 'Tambahkan Keranjang';
                addCartBtn.querySelector('i').className = 'fa-solid fa-cart-plus';
            }
            buyDirectBtn._card = card;
            addCartBtn._card = card;

            previewModal.showModal();
        }

        function closePreviewModal() {
            previewModal.classList.add('closing');
            setTimeout(() => { previewModal.close(); previewModal.classList.remove('closing'); }, 500);
        }

        closePreview.addEventListener('click', closePreviewModal);
        previewModal.addEventListener('cancel', e => { e.preventDefault(); closePreviewModal(); });
        previewModal.addEventListener('click', e => {
            if (e.target === previewModal) closePreviewModal();
        });
        document.querySelector('.modal-drag-bar')?.addEventListener('click', closePreviewModal);

        document.getElementById('modal-buy-direct-btn').addEventListener('click', () => {
            const btn  = document.getElementById('modal-buy-direct-btn');
            const card = btn._card;
            if (!card || card.dataset.free === 'true') return;
            addToCart(card);
            window.location.href = '/checkout';
        });

        document.getElementById('modal-add-cart-btn').addEventListener('click', (e) => {
            const btn  = document.getElementById('modal-add-cart-btn');
            const card = btn._card;
            if (!card) return;
            if (card.dataset.free === 'true') return; // download logic

            // Flying Dot Animation
            const rect = btn.getBoundingClientRect();
            const cartButton = document.getElementById('cart-btn');
            const cartBtnRect = cartButton ? cartButton.getBoundingClientRect() : null;
            
            const dot = document.createElement('div');
            dot.className = 'flying-dot';
            dot.style.left = (rect.left + rect.width/2 - 10) + 'px';
            dot.style.top = (rect.top + rect.height/2 - 10) + 'px';
            document.body.appendChild(dot);
            
            requestAnimationFrame(() => {
                if (cartBtnRect) {
                    dot.style.left = (cartBtnRect.left + cartBtnRect.width/2 - 10) + 'px';
                    dot.style.top = (cartBtnRect.top + cartBtnRect.height/2 - 10) + 'px';
                    dot.style.transform = 'scale(0.2)';
                } else {
                    dot.style.opacity = '0';
                }
            });
            
            setTimeout(() => {
                dot.remove();
                addToCart(card);
                showToast(`"${card.dataset.title}" ditambahkan ke keranjang!`);
            }, 700);

            closePreviewModal();
        });

        // Grid/List View Toggle
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');
        const productGrid = document.getElementById('product-grid');
        
        gridBtn?.addEventListener('click', () => {
            gridBtn.classList.add('active');
            listBtn?.classList.remove('active');
            productGrid?.classList.remove('list-view');
        });
        listBtn?.addEventListener('click', () => {
            listBtn.classList.add('active');
            gridBtn?.classList.remove('active');
            productGrid?.classList.add('list-view');
        });

        // Quick view buttons
        document.querySelectorAll('.card-quick-view').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openPreview(btn.closest('.product-card'));
            });
        });

        // Whole card click opens preview
        cards.forEach(card => {
            card.addEventListener('click', e => {
                if (!e.target.closest('.btn-primary') && !e.target.closest('.btn-icon')) {
                    openPreview(card);
                }
            });
        });

        // Card "Beli Langsung" buttons
        document.querySelectorAll('.card-buy-direct').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const card = btn.closest('.product-card');
                if (card.dataset.free === 'true') return;
                addToCart(card);
                window.location.href = '/checkout';
            });
        });

        // Card "Tambahkan Keranjang" buttons
        document.querySelectorAll('.card-add-cart').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const card = btn.closest('.product-card');
                if (card.dataset.free === 'true') {
                    showToast(`Mulai mengunduh "${card.dataset.title}"...`);
                    return;
                }


                // Flying Dot Animation
                const rect = btn.getBoundingClientRect();
                const cartButton = document.getElementById('cart-btn');
            const cartBtnRect = cartButton ? cartButton.getBoundingClientRect() : null;
                
                const dot = document.createElement('div');
                dot.className = 'flying-dot';
                dot.style.left = (rect.left + rect.width/2 - 10) + 'px';
                dot.style.top = (rect.top + rect.height/2 - 10) + 'px';
                document.body.appendChild(dot);
                
                requestAnimationFrame(() => {
                    dot.style.left = (cartBtnRect.left + cartBtnRect.width/2 - 10) + 'px';
                    dot.style.top = (cartBtnRect.top + cartBtnRect.height/2 - 10) + 'px';
                    dot.style.transform = 'scale(0.2)';
                });
                
                setTimeout(() => {
                    dot.remove();
                    addToCart(card);
                    showToast(`"${card.dataset.title}" ditambahkan ke keranjang!`);
                }, 700);
            });
        });

        /* ── Toast Notification ── */
        function showToast(msg) {
            let toast = document.getElementById('cart-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'cart-toast';
                toast.style.cssText = `
                    position:fixed;bottom:28px;right:28px;z-index:9999;
                    background:#111110;color:white;
                    padding:13px 20px;border-radius:10px;
                    font-family:'Inter',sans-serif;font-size:0.85rem;font-weight:600;
                    display:flex;align-items:center;gap:10px;
                    box-shadow:0 8px 32px rgba(0,0,0,0.25);
                    transform:translateY(20px);opacity:0;
                    transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                `;
                document.body.appendChild(toast);
            }
            toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#22c55e;"></i> ${msg} <a href="/cart" style="color:#60a5fa;margin-left:8px;text-decoration:none;font-weight:700;">Lihat Keranjang →</a>`;
            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity   = '1';
            });
            clearTimeout(toast._t);
            toast._t = setTimeout(() => {
                toast.style.transform = 'translateY(20px)';
                toast.style.opacity   = '0';
            }, 3500);
        }

    })();
    
});
</script>

<template>
  <div>


    <!-- ======= HEADER ======= -->
    

    <!-- ======= HERO ======= -->
    <section class="hero-strip">
        <div class="hero-text">
            <div class="hero-label">IC Market · Open Store</div>
            <h1>Aset Digital<br><em>Premium,</em><br>Harga Terjangkau.</h1>
            <p>Template, UI Kit, dan Source Code siap pakai yang dirancang untuk mempercepat pengembangan project Anda—dari ide hingga produksi.</p>
            
            <!-- Stats pindah ke kiri -->
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="num">50+</span>
                    <span class="lbl">Produk Digital</span>
                </div>
                <div class="stat-item">
                    <span class="num">2k+</span>
                    <span class="lbl">Pembeli Puas</span>
                </div>
                <div class="stat-item">
                    <span class="num">4.9</span>
                    <span class="lbl">Rating Rata-rata</span>
                </div>
            </div>
        </div>

        <div class="hero-right">
            <!-- Label Produk Terpanas -->
            <div class="hot-label">🔥 Produk Terpanassss</div>

            <!-- Card Stack (bertumpuk & miring) -->
            <div class="hero-card-stack" id="hero-card-stack">

                
                <!-- Card 3 — paling belakang -->
                <article class="stack-card stack-card--3 product-card"
                    data-title="Admin Dashboard Pro"
                    data-store="Creative Studio"
                    data-category="Web Template"
                    data-price="199000"
                    data-img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                    data-tags="Dashboard,HTML">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=70" alt="Admin Dashboard Pro">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <a class="card-store" href="/store/creative-studio">Oleh: Creative Studio</a>
                        <h3 class="card-title">Admin Dashboard Pro</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 199.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 4.8</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;" data-title="Admin Dashboard Pro"
                                data-category="Web Template"
                                data-price="199000"
                                data-img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                                data-tags="Dashboard,HTML">
                            <button class="btn-primary card-buy-direct" style="width:100%">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 2 — tengah -->
                <article class="stack-card stack-card--2 product-card"
                    data-title="UI/UX Startup Kit"
                    data-store="Pixel Art Lab"
                    data-category="UI Kit"
                    data-price="150000"
                    data-img="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
                    data-tags="Figma,Design">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=70" alt="UI/UX Startup Kit">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">UI Kit</span>
                        <a class="card-store" href="/store/pixel-art-lab">Oleh: Pixel Art Lab</a>
                        <h3 class="card-title">UI/UX Startup Kit</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 150.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 5.0</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;" data-title="UI/UX Startup Kit"
                                data-category="UI Kit"
                                data-price="150000"
                                data-img="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
                                data-tags="Figma,Design">
                            <button class="btn-primary card-buy-direct" style="width:100%">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 1 — paling depan (aktif) -->
                <article class="stack-card stack-card--1 stack-active product-card"
                    data-title="Template E-Commerce Super"
                    data-store="Creative Studio"
                    data-category="Web Template"
                    data-price="350000"
                    data-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
                    data-tags="HTML,E-Commerce">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" alt="Template E-Commerce Super">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <a class="card-store" href="/store/creative-studio">Oleh: Creative Studio</a>
                        <h3 class="card-title">Template E-Commerce Super</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 350.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 4.9</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;" data-title="Template E-Commerce Super"
                                data-category="Web Template"
                                data-price="350000"
                                data-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
                                data-tags="HTML,E-Commerce">
                            <button class="btn-primary card-buy-direct" style="width:100%">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Hint klik -->
                <div class="stack-hint">
                    <i class="fa-solid fa-hand-pointer"></i> Klik kartu belakang untuk pindah
                </div>
            </div>
        </div>
    </section>

    <!-- ======= TICKER ======= -->
    <div class="ticker-bar" aria-hidden="true">
        <div class="ticker-track">
            <span>E-Commerce Template</span>
            <span>UI/UX Starter Kit</span>
            <span>Laravel Point of Sales</span>
            <span>Admin Dashboard</span>
            <span>Mobile App UI</span>
            <span>Free Wireframe Pack</span>
            <span>Food Delivery App</span>
            <span>Landing Page Kit</span>
            <span>E-Commerce Template</span>
            <span>UI/UX Starter Kit</span>
            <span>Laravel Point of Sales</span>
            <span>Admin Dashboard</span>
            <span>Mobile App UI</span>
            <span>Free Wireframe Pack</span>
            <span>Food Delivery App</span>
            <span>Landing Page Kit</span>
        </div>
    </div>

    <!-- ======= MAIN LAYOUT ======= -->
    <div class="main-layout">

        <!-- SIDEBAR -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">Kategori</div>
                <ul class="cat-list" id="cat-list">
                    <li class="cat-item active" data-cat="semua">
                        Semua <span class="cat-count">6</span>
                    </li>
                    <li class="cat-item" data-cat="web template">
                        Web Template <span class="cat-count">2</span>
                    </li>
                    <li class="cat-item" data-cat="ui kit">
                        UI Kit <span class="cat-count">2</span>
                    </li>
                    <li class="cat-item" data-cat="source code">
                        Source Code <span class="cat-count">2</span>
                    </li>
                </ul>
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">Urutkan</div>
                <select class="sort-select" id="sort-select">
                    <option value="newest">Terbaru</option>
                    <option value="price-asc">Harga: Rendah ke Tinggi</option>
                    <option value="price-desc">Harga: Tinggi ke Rendah</option>
                    <option value="rating">Rating Tertinggi</option>
                </select>
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">Info</div>
                <div style="font-size:0.8rem; color:var(--muted); line-height:1.6; font-family:'Inter',sans-serif;">
                    Semua produk dilengkapi dokumentasi dan dukungan after-sales selama 30 hari.
                </div>
            </div>
        </aside>

        <!-- CATALOG AREA -->
        <main class="catalog-area">
            <div class="catalog-top">
                <span class="catalog-count">Menampilkan <strong id="product-count">6</strong> produk</span>
                <div class="catalog-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="main-search" placeholder="Cari template, UI kit, source code…" autocomplete="off">
                </div>
                <div class="view-toggle">
                    <button class="view-btn active" id="grid-view-btn" title="Grid View">
                        <i class="fa-solid fa-grid-2"></i>
                    </button>
                    <button class="view-btn" id="list-view-btn" title="List View">
                        <i class="fa-solid fa-list"></i>
                    </button>
                </div>
            </div>

            <!-- PRODUCT GRID -->
            <div class="product-grid" id="product-grid">

                <!-- Card 1: E-Commerce Template -->
                <article class="product-card"
                    data-category="web template"
                    data-price="350000"
                    data-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                    data-title="Template E-Commerce Super"
                    data-desc="Template e-commerce lengkap dengan fitur checkout, keranjang belanja, manajemen produk, dan integrasi payment gateway. Dibangun dengan HTML/CSS/JS murni, performa tinggi, dan mudah dikustomisasi."
                    data-features="Checkout Flow,Responsive Design,Payment Gateway Ready,Clean Code,SEO Optimized"
                    data-tags="Web Template,HTML,E-Commerce"
                    data-rating="4.9"
                    data-reviews="128">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" alt="Template E-Commerce Super" loading="lazy">
                        <span class="card-badge premium">Premium</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <h3 class="card-title">Template E-Commerce Super</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 350.000</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 4.9 (128)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary card-buy-direct" aria-label="Beli Langsung">
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button class="btn-icon card-add-cart" aria-label="Tambahkan Keranjang">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 2: UI/UX Startup Kit -->
                <article class="product-card"
                    data-category="ui kit"
                    data-price="150000"
                    data-img="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80"
                    data-title="UI/UX Startup Kit"
                    data-desc="Ratusan komponen Figma dengan Auto Layout, design system lengkap, dan panduan penggunaan. Cocok untuk tim yang ingin mempercepat proses desain MVP dari nol."
                    data-features="Auto Layout,Design System,Figma Components,Light & Dark Mode,Icon Set"
                    data-tags="UI Kit,Figma,Design"
                    data-rating="5.0"
                    data-reviews="86">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80" alt="UI/UX Startup Kit" loading="lazy">
                        <span class="card-badge premium">Premium</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">UI Kit</span>
                        <h3 class="card-title">UI/UX Startup Kit</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 150.000</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 5.0 (86)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary card-buy-direct" aria-label="Beli Langsung">
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button class="btn-icon card-add-cart" aria-label="Tambahkan Keranjang">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 3: Laravel POS -->
                <article class="product-card"
                    data-category="source code"
                    data-price="250000"
                    data-img="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80"
                    data-title="Laravel Point of Sales"
                    data-store="CodeCraft Store"
                    data-desc="Aplikasi POS berbasis web lengkap dengan manajemen stok, laporan penjualan, dan dukungan cetak struk thermal. Dibangun dengan Laravel 10 dan Livewire."
                    data-features="Inventory Management,Thermal Printing,Sales Reports,Laravel 10,Livewire"
                    data-tags="Source Code,Laravel,PHP"
                    data-rating="4.5"
                    data-reviews="54">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=600&q=80" alt="Laravel Point of Sales" loading="lazy">
                        <span class="card-badge">Source Code</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Source Code</span>
                        <a class="card-store" href="/store/codecraft-store">Oleh: CodeCraft Store</a>
                        <h3 class="card-title">Laravel Point of Sales</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 250.000</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 4.5 (54)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary card-buy-direct" aria-label="Beli Langsung">
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button class="btn-icon card-add-cart" aria-label="Tambahkan Keranjang">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 4: Admin Dashboard -->
                <article class="product-card"
                    data-category="web template"
                    data-price="199000"
                    data-img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                    data-title="Admin Dashboard Pro"
                    data-desc="Template admin dashboard modern dengan chart animasi, manajemen user, dark mode, dan lebih dari 40 komponen UI siap pakai. Integrasi API sangat mudah dilakukan."
                    data-features="40+ Components,Animated Charts,Dark Mode,API Ready,Responsive"
                    data-tags="Web Template,Dashboard,HTML"
                    data-rating="4.8"
                    data-reviews="97">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="Admin Dashboard Pro" loading="lazy">
                        <span class="card-badge premium">Premium</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <h3 class="card-title">Admin Dashboard Pro</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 199.000</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 4.8 (97)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary card-buy-direct" aria-label="Beli Langsung">
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button class="btn-icon card-add-cart" aria-label="Tambahkan Keranjang">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 5: Mobile App UI -->
                <article class="product-card"
                    data-category="ui kit"
                    data-price="120000"
                    data-img="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80"
                    data-title="Mobile App UI Kit"
                    data-store="Pixel Art Lab"
                    data-desc="Koleksi 200+ screen desain aplikasi mobile dalam format Figma. Mencakup onboarding, autentikasi, home, profile, dan banyak lagi. Siap untuk handoff ke developer."
                    data-features="200+ Screens,iOS & Android,Auto Layout,Dev-Ready,Prototype Included"
                    data-tags="UI Kit,Mobile,Figma"
                    data-rating="4.7"
                    data-reviews="63">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80" alt="Mobile App UI Kit" loading="lazy">
                        <span class="card-badge premium">Premium</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">UI Kit</span>
                        <a class="card-store" href="/store/pixel-art-lab">Oleh: Pixel Art Lab</a>
                        <h3 class="card-title">Mobile App UI Kit</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 120.000</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 4.7 (63)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary card-buy-direct" aria-label="Beli Langsung">
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button class="btn-icon card-add-cart" aria-label="Tambahkan Keranjang">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 6: Wireframe Pack (FREE) -->
                <article class="product-card"
                    data-category="source code"
                    data-price="0"
                    data-img="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
                    data-title="Wireframe Pack — Gratis"
                    data-store="Design Hub"
                    data-desc="Paket wireframe gratis untuk referensi awal desain UI Anda. Tersedia dalam format Figma dan PDF, mencakup lebih dari 80 layout berbeda untuk berbagai jenis aplikasi."
                    data-features="80+ Layouts,Figma & PDF,Free Forever,Regular Updates,Community Support"
                    data-tags="Free,Figma,Wireframe"
                    data-rating="4.9"
                    data-reviews="211"
                    data-free="true">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80" alt="Wireframe Pack Gratis" loading="lazy">
                        <span class="card-badge free">Gratis</span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Source Code</span>
                        <a class="card-store" href="/store/design-hub">Oleh: Design Hub</a>
                        <h3 class="card-title">Wireframe Pack — Gratis</h3>
                        <div class="card-footer">
                            <span class="card-price free-price">Gratis</span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i> 4.9 (211)
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary download card-add-cart" aria-label="Download gratis" style="width: 100%;">
                                <i class="fa-solid fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </article>

            </div><!-- /product-grid -->
        </main>

    </div><!-- /main-layout -->

    <!-- ======= REVIEWS CAROUSEL ======= -->
    <section class="reviews-section">
        <div class="section-label">Ulasan Pembeli</div>
        <div class="section-title">Apa Kata Mereka</div>
        <div class="reviews-track-wrap">
            <div class="reviews-track" id="reviews-track">
                <!-- Review 1 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Template E-Commerce Super ini sungguh menghemat waktu development tim saya hingga berbulan-bulan! Sangat clean dan mudah dikustomisasi."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: linear-gradient(135deg, #1472FF, #00f0ff);">AS</div>
                        <div>
                            <div class="author-name">Ahmad Syamsudin</div>
                            <div class="author-role">Tech Lead · Startup X</div>
                        </div>
                    </div>
                </div>
                <!-- Review 2 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"UI/UX Startup Kit-nya bener-bener lifesaver! Ratusan komponen Figma yang sudah pakai Auto Layout bikin proses desain MVP jadi secepat kilat."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #eab308;">NR</div>
                        <div>
                            <div class="author-name">Nadia Ramadhani</div>
                            <div class="author-role">UI/UX Designer Freelance</div>
                        </div>
                    </div>
                </div>
                <!-- Review 3 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <p class="review-text">"Source code Point of Sales-nya mantap, dokumentasinya rapih. Ada sedikit kendala saat setup print thermal tapi CS-nya fast respon banget."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #a855f7;">BK</div>
                        <div>
                            <div class="author-name">Budi Kurniawan</div>
                            <div class="author-role">Pemilik Toko Retail</div>
                        </div>
                    </div>
                </div>
                <!-- Review 4 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Wireframe Pack gratisannya gila sih! Lengkap banget buat referensi awal. Ga nyangka dapet aset se-premium ini cuma-cuma."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #22c55e;">SA</div>
                        <div>
                            <div class="author-name">Siska Anggraeni</div>
                            <div class="author-role">Mahasiswa IT</div>
                        </div>
                    </div>
                </div>
                <!-- Review 5 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Baru pertama kali beli source code Food Delivery di sini, arsitektur kodenya bagus pakai GetX. Recommended banget buat referensi skripsi!"</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #ef4444;">FA</div>
                        <div>
                            <div class="author-name">Faisal Akbar</div>
                            <div class="author-role">Mobile Developer</div>
                        </div>
                    </div>
                </div>
                <!-- Review 6 -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Template Admin Dashboard ini bikin klien saya puas banget! Animasi chart-nya halus dan integrasi API-nya gampang dipahami."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #3b82f6;">DW</div>
                        <div>
                            <div class="author-name">Dian Wibowo</div>
                            <div class="author-role">Web Agency Founder</div>
                        </div>
                    </div>
                </div>
                <!-- Duplicate for seamless loop -->
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Template E-Commerce Super ini sungguh menghemat waktu development tim saya hingga berbulan-bulan! Sangat clean dan mudah dikustomisasi."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: linear-gradient(135deg, #1472FF, #00f0ff);">AS</div>
                        <div>
                            <div class="author-name">Ahmad Syamsudin</div>
                            <div class="author-role">Tech Lead · Startup X</div>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"UI/UX Startup Kit-nya bener-bener lifesaver! Ratusan komponen Figma yang sudah pakai Auto Layout bikin proses desain MVP jadi secepat kilat."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #eab308;">NR</div>
                        <div>
                            <div class="author-name">Nadia Ramadhani</div>
                            <div class="author-role">UI/UX Designer Freelance</div>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <p class="review-text">"Source code Point of Sales-nya mantap, dokumentasinya rapih. Ada sedikit kendala saat setup print thermal tapi CS-nya fast respon banget."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #a855f7;">BK</div>
                        <div>
                            <div class="author-name">Budi Kurniawan</div>
                            <div class="author-role">Pemilik Toko Retail</div>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Wireframe Pack gratisannya gila sih! Lengkap banget buat referensi awal. Ga nyangka dapet aset se-premium ini cuma-cuma."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #22c55e;">SA</div>
                        <div>
                            <div class="author-name">Siska Anggraeni</div>
                            <div class="author-role">Mahasiswa IT</div>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Baru pertama kali beli source code Food Delivery di sini, arsitektur kodenya bagus pakai GetX. Recommended banget buat referensi skripsi!"</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #ef4444;">FA</div>
                        <div>
                            <div class="author-name">Faisal Akbar</div>
                            <div class="author-role">Mobile Developer</div>
                        </div>
                    </div>
                </div>
                <div class="review-card">
                    <div class="review-stars">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <p class="review-text">"Template Admin Dashboard ini bikin klien saya puas banget! Animasi chart-nya halus dan integrasi API-nya gampang dipahami."</p>
                    <div class="review-author">
                        <div class="author-avatar" style="background: #3b82f6;">DW</div>
                        <div>
                            <div class="author-name">Dian Wibowo</div>
                            <div class="author-role">Web Agency Founder</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======= FOOTER ======= -->
    <footer class="site-footer">
        <div class="footer-brand">
            <span class="logo"><span>IC</span> Market</span>
            <p class="footer-tagline">Platform aset digital premium untuk developer dan desainer Indonesia.</p>
        </div>
        <div>
            <div class="footer-col-title">Produk</div>
            <ul class="footer-links">
                <li><a href="#">Web Template</a></li>
                <li><a href="#">UI Kit</a></li>
                <li><a href="#">Source Code</a></li>
                <li><a href="#">Gratis</a></li>
            </ul>
        </div>
        <div>
            <div class="footer-col-title">Bantuan</div>
            <ul class="footer-links">
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Panduan Pembelian</a></li>
                <li><a href="#">Kebijakan Refund</a></li>
                <li><a href="#">Hubungi Kami</a></li>
            </ul>
        </div>
        <div>
            <div class="footer-col-title">Lainnya</div>
            <ul class="footer-links">
                <li><a href="/">iCraft Studio</a></li>
                <li><a href="#">Tentang Kami</a></li>
                <li><a href="#">Jadi Seller</a></li>
                <li><a href="#">Blog</a></li>
            </ul>
        </div>
    </footer>
    <div class="footer-bottom">
        <span class="footer-bottom-text">© 2026 IC Market · iCraft Studio. All rights reserved.</span>
        <span class="footer-bottom-text">Made with ♥ in Indonesia</span>
    </div>

    <!-- ======= PREVIEW MODAL ======= -->
    <dialog id="preview-modal" class="preview-modal">
        <button class="modal-close-btn" id="close-preview" aria-label="Tutup">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="modal-drag-bar"><div class="drag-handle"></div></div>
        <div class="modal-inner">
            <!-- Gallery -->
            <div class="modal-gallery">
                <img src="" alt="Preview" id="modal-img">
                <div class="gallery-nav">
                    <button class="gallery-nav-btn"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="gallery-nav-btn"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
            <!-- Detail -->
            <div class="modal-detail">
                <div class="modal-detail-header">
                    <div class="modal-tags" id="modal-tags"></div>
                    <h2 class="modal-title" id="modal-title">—</h2>
                    <div class="modal-price-row">
                        <span class="modal-price" id="modal-price">—</span>
                        <div class="modal-stars" id="modal-stars">
                            <i class="fa-solid fa-star"></i>
                            <span id="modal-rating-text">—</span>
                        </div>
                    </div>
                </div>
                <div class="modal-detail-body">
                    <div>
                        <div class="detail-section-label">Deskripsi</div>
                        <p class="detail-desc" id="modal-desc">—</p>
                    </div>
                    <div>
                        <div class="detail-section-label">Fitur Utama</div>
                        <ul class="feature-list" id="modal-features"></ul>
                    </div>
                    <div>
                        <div class="detail-section-label">Spesifikasi</div>
                        <div class="specs-row">
                            <div class="spec-pill">
                                <span class="spec-pill-label">Terakhir Update</span>
                                <span class="spec-pill-val"><i class="fa-regular fa-calendar"></i>Agustus 2026</span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Dukungan</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-headset"></i>30 Hari</span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Format File</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-file-zipper"></i>.ZIP + Docs</span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Lisensi</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-shield"></i>Extended</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-cta" style="display:flex; flex-direction:column; gap:12px;">
                    <div style="display:flex; gap:12px; width:100%;">
                        <button class="cta-buy" id="modal-buy-direct-btn" style="flex:1;">
                            <i class="fa-solid fa-bolt"></i>
                            <span>Beli Langsung</span>
                        </button>
                        <button class="cta-buy" id="modal-add-cart-btn" style="flex:1; background:var(--surface); color:var(--text); border:1px solid var(--border);">
                            <i class="fa-solid fa-cart-plus"></i>
                            <span>Tambahkan Keranjang</span>
                        </button>
                    </div>
                    <a href="#" class="cta-preview-link" target="_blank" style="align-self:center;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        Live Preview
                    </a>
                </div>
            </div>
        </div>
    </dialog>

    <!-- ======= CHECKOUT MODAL ======= -->
    <dialog id="checkout-modal" class="checkout-modal">
        <div class="checkout-content" style="position:relative;">
            <button class="checkout-close" id="close-checkout" aria-label="Tutup">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="checkout-product-preview">
                <img src="" alt="Product" id="co-img">
                <div class="checkout-product-info">
                    <div class="checkout-product-name" id="co-name">—</div>
                    <div class="checkout-product-price" id="co-price">—</div>
                </div>
            </div>
            <div class="checkout-divider"></div>
            <div>
                <div class="payment-label">Metode Pembayaran</div>
                <div class="payment-grid">
                    <div class="payment-method active" data-method="cc">
                        <i class="fa-brands fa-cc-visa"></i>
                        <span>Kartu Kredit</span>
                    </div>
                    <div class="payment-method" data-method="bank">
                        <i class="fa-solid fa-building-columns"></i>
                        <span>Transfer Bank</span>
                    </div>
                    <div class="payment-method" data-method="ewallet">
                        <i class="fa-solid fa-wallet"></i>
                        <span>E-Wallet</span>
                    </div>
                    <div class="payment-method" data-method="paypal">
                        <i class="fa-brands fa-paypal"></i>
                        <span>PayPal</span>
                    </div>
                </div>
            </div>
            <button class="pay-now-btn">
                <i class="fa-solid fa-lock"></i> Bayar Sekarang
            </button>
        </div>
    </dialog>

    <!-- ======= SCRIPTS ======= -->
    
  </div>
</template>
