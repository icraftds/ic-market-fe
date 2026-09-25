<script setup>
import { nextTick, onMounted } from 'vue';

definePageMeta({ layout: 'default' })


const {
    products: catalogProducts,
    refreshCatalog
} = useProductCatalog();

const { fetchCart, cart: apiCart, addToCart: apiAddToCart } = useCart();

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80';

const catalogImage = (product) =>
    product?.thumbnailUrl ||
    product?.images?.[0]?.imageUrl ||
    FALLBACK_PRODUCT_IMAGE;

const catalogTags = (product) => {
    if (Array.isArray(product?.tags) && product.tags.length) return product.tags;
    return [product?.category, product?.type].filter(Boolean);
};

const catalogFeatures = (product) => {
    if (Array.isArray(product?.features) && product.features.length) return product.features;
    return [
        `Dijual oleh ${product?.storeName || 'Seller IC Market'}`,
        product?.type === 'Digital' ? 'Produk digital' : 'Produk marketplace',
        'Dukungan seller'
    ];
};


const catalogSpecifications = (product) => ({
    lastUpdated:
        product?.specifications?.lastUpdated ||
        new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
            .format(new Date(product?.updatedAt || product?.createdAt || Date.now())),
    support: product?.specifications?.support || '30 Hari',
    fileFormat:
        product?.specifications?.fileFormat ||
        (product?.type === 'Digital' ? 'File Digital' : 'Produk Fisik'),
    license: product?.specifications?.license || 'Personal'
});

const catalogRating = (product) => Number(product?.rating || 0);
const catalogReviews = (product) => Number(product?.reviews || 0);

onMounted(async () => {

    await refreshCatalog();
    await nextTick();

    const authToken = useCookie('icmarket_auth_token');

    (() => {
        'use strict';

        /* ── Category Filter ── */
        const catItems = document.querySelectorAll('.cat-item');
        const cards    = document.querySelectorAll('.product-card');
        const countEl  = document.getElementById('product-count');
        if (countEl) countEl.textContent = cards.length;

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
        function getCart() { return apiCart.value; }
        
        function getSession() { return authToken.value; }

        async function addToCart(card) {
            if (!getSession()) {
                window.location.href = '/login';
                return;
            }
            
            const productId = card.dataset.productId || card.dataset.id;
            if (!productId) {
                showToast("Produk ini belum siap ditambahkan.");
                return;
            }
            
            const success = await apiAddToCart(productId, 1);
            if (success) {
                showToast(`"${card.dataset.title || 'Produk'}" ditambahkan ke keranjang!`);
                updateCartBadge();
                return true;
            } else {
                showToast(`Gagal menambahkan "${card.dataset.title || 'Produk'}". Silakan login ulang.`);
                return false;
            }
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
        ].filter(Boolean);

        stackCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // If clicked on the buy button, don't rotate
                if (e.target.closest('.hero-featured-btn') || e.target.closest('.card-store')) return;

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
                    store:    btn.dataset.store || '',
                    storeSlug: btn.dataset.storeSlug || '',
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

            const sellerLink = document.getElementById('modal-seller-link');
            const sellerName = card.dataset.store || 'iCraft Demo Store';
            const sellerSlug = card.dataset.storeSlug || '';
            if (sellerLink) {
                sellerLink.textContent = `Oleh: ${sellerName}`;
                sellerLink.href = sellerSlug ? `/store/${sellerSlug}` : '#';
                sellerLink.style.pointerEvents = sellerSlug ? 'auto' : 'none';
            }

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


            const specUpdated = document.getElementById('modal-spec-updated');
            const specSupport = document.getElementById('modal-spec-support');
            const specFormat = document.getElementById('modal-spec-format');
            const specLicense = document.getElementById('modal-spec-license');

            if (specUpdated) specUpdated.textContent = card.dataset.specUpdated || 'Agustus 2026';
            if (specSupport) specSupport.textContent = card.dataset.specSupport || '30 Hari';
            if (specFormat) specFormat.textContent = card.dataset.specFormat || '.ZIP + Docs';
            if (specLicense) specLicense.textContent = card.dataset.specLicense || 'Extended';

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
        document.querySelector('.modal-drag-bar').addEventListener('click', closePreviewModal);

        function animateAddToCart(btn, card, isModal) {
            // 1. Success state on button
            const originalHTML = btn.innerHTML;
            const originalBg = btn.style.background;
            const originalColor = btn.style.color;
            const originalBorder = btn.style.borderColor;
            
            btn.style.background = '#10b981';
            btn.style.color = '#fff';
            btn.style.borderColor = '#10b981';
            
            if (isModal) {
                btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Berhasil!</span>`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
            }
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = originalBg;
                btn.style.color = originalColor;
                btn.style.borderColor = originalBorder;
            }, 1500);

            // 2. Flying flyer (image)
            const rect = btn.getBoundingClientRect();
            const cartBtn = document.getElementById('cart-btn');
            
            // If cartBtn is missing, fallback immediately without animation
            if (!cartBtn) {
                setTimeout(() => {
                    addToCart(card);
                }, 600);
                return;
            }

            const cartBtnRect = cartBtn.getBoundingClientRect();
            
            const flyer = document.createElement('div');
            flyer.className = 'flying-flyer';
            
            if (card.dataset.img) {
                flyer.style.backgroundImage = `url(${card.dataset.img})`;
            }
            
            const startSize = 60; 
            flyer.style.width = startSize + 'px';
            flyer.style.height = startSize + 'px';
            flyer.style.left = (rect.left + rect.width/2 - startSize/2) + 'px';
            flyer.style.top = (rect.top + rect.height/2 - startSize/2) + 'px';
            
            document.body.appendChild(flyer);
            
            flyer.offsetHeight; // reflow
            
            requestAnimationFrame(() => {
                flyer.style.left = (cartBtnRect.left + cartBtnRect.width/2 - 10) + 'px';
                flyer.style.top = (cartBtnRect.top + cartBtnRect.height/2 - 10) + 'px';
                flyer.style.transform = 'scale(0.2) rotate(15deg)';
                flyer.style.opacity = '0.5';
            });
            
            setTimeout(() => {
                flyer.remove();
                
                cartBtn.classList.remove('cart-bump');
                void cartBtn.offsetWidth; // reflow
                cartBtn.classList.add('cart-bump');
                
                addToCart(card);
            }, 800);
        }

        document.getElementById('modal-buy-direct-btn').addEventListener('click', async () => {
            const btn  = document.getElementById('modal-buy-direct-btn');
            const card = btn._card;
            if (!card || card.dataset.free === 'true') return;
            const success = await addToCart(card);
            if (success) window.location.href = '/checkout';
        });

        document.getElementById('modal-add-cart-btn').addEventListener('click', (e) => {
            const btn  = document.getElementById('modal-add-cart-btn');
            const card = btn._card;
            if (!card) return;
            if (card.dataset.free === 'true') return; // download logic

            animateAddToCart(btn, card, true);

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
                if (!e.target.closest('.btn-primary') && !e.target.closest('.btn-icon') && !e.target.closest('.card-store')) {
                    openPreview(card);
                }
            });
        });

        // Use Event Delegation for buttons since dynamic cards are rendered asynchronously
        document.addEventListener('click', async e => {
            const btnBuyDirect = e.target.closest('.card-buy-direct');
            if (btnBuyDirect) {
                e.stopPropagation();
                const card = btnBuyDirect.closest('.product-card');
                if (card && card.dataset.free !== 'true') {
                    const success = await addToCart(card);
                    if (success) window.location.href = '/checkout';
                }
                return;
            }

            const btnAddCart = e.target.closest('.card-add-cart');
            if (btnAddCart) {
                e.stopPropagation();
                const card = btnAddCart.closest('.product-card');
                if (!card) return;
                
                if (card.dataset.free === 'true') {
                    showToast(`Mulai mengunduh "${card.dataset.title}"...`);
                    return;
                }

                animateAddToCart(btnAddCart, card, false);
                return;
            }
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

                <article v-for="(product, index) in catalogProducts.slice(0, 3)" :key="product.id"
                    class="stack-card product-card"
                    :class="[`stack-card--${3 - index}`, index === 0 ? 'stack-active' : '']"
                    :data-title="product.name"
                    :data-store="product.storeName"
                    :data-store-slug="product.storeSlug"
                    :data-category="product.category"
                    :data-price="product.price"
                    :data-img="catalogImage(product)"
                    :data-tags="catalogTags(product).join(',')">
                    <div class="card-thumb">
                        <img :src="catalogImage(product)" :alt="product.name">
                        <span class="card-badge" :class="product.price === 0 ? 'free' : 'premium'">
                            {{ product.price === 0 ? 'Gratis' : 'Premium' }}
                        </span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">{{ product.category }}</span>
                        <a class="card-store" :href="`/store/${product.storeSlug}`">Oleh: {{ product.storeName }}</a>
                        <h3 class="card-title">{{ product.name }}</h3>
                        <div class="card-footer">
                            <span class="card-price" :class="{ 'free-price': product.price === 0 }">
                                {{ product.price === 0 ? 'Gratis' : `Rp ${Number(product.price).toLocaleString('id-ID')}` }}
                            </span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i>
                                {{ catalogReviews(product) > 0 ? `${catalogRating(product).toFixed(1)} (${catalogReviews(product)})` : 'Baru' }}
                            </div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;"
                            :data-title="product.name"
                            :data-store="product.storeName"
                            :data-store-slug="product.storeSlug"
                            :data-category="product.category"
                            :data-price="product.price"
                            :data-product-id="product.id"
                            :data-img="catalogImage(product)"
                            :data-tags="catalogTags(product).join(',')">
                            <button class="btn-primary" style="width:100%">
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

                <!-- Produk seller dinamis: memakai UI card yang sama dengan file ZIP -->
                <article
                    v-for="product in catalogProducts"
                    :key="product.catalogId"
                    class="product-card"
                    :data-category="String(product.category || '').toLowerCase()"
                    :data-price="product.price"
                    :data-img="catalogImage(product)"
                    :data-title="product.name"
                    :data-store="product.storeName"
                    :data-store-slug="product.storeSlug"
                    :data-store-id="product.storeId"
                    :data-store-application-id="product.storeApplicationId"
                    :data-tenant-schema="product.tenantSchema"
                    :data-product-id="product.id"
                    :data-catalog-id="product.catalogId"
                    :data-desc="product.description || 'Produk dari seller IC Market.'"
                    :data-features="catalogFeatures(product).join(',')"
                    :data-spec-updated="catalogSpecifications(product).lastUpdated"
                    :data-spec-support="catalogSpecifications(product).support"
                    :data-spec-format="catalogSpecifications(product).fileFormat"
                    :data-spec-license="catalogSpecifications(product).license"
                    :data-tags="catalogTags(product).join(',')"
                    :data-rating="catalogRating(product)"
                    :data-reviews="catalogReviews(product)"
                    :data-free="product.price === 0 ? 'true' : 'false'"
                    :data-type="product.type || 'Digital'"
                >
                    <div class="card-thumb">
                        <img :src="catalogImage(product)" :alt="product.name" loading="lazy">
                        <span class="card-badge" :class="product.price === 0 ? 'free' : 'premium'">
                            {{ product.price === 0 ? 'Gratis' : 'Seller' }}
                        </span>
                        <button class="card-quick-view" aria-label="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <span class="card-category">{{ product.category }}</span>
                        <a class="card-store" :href="`/store/${product.storeSlug}`">
                            Oleh: {{ product.storeName }}
                        </a>
                        <h3 class="card-title">{{ product.name }}</h3>
                        <div class="card-footer">
                            <span class="card-price" :class="{ 'free-price': product.price === 0 }">
                                {{ product.price === 0 ? 'Gratis' : `Rp ${Number(product.price).toLocaleString('id-ID')}` }}
                            </span>
                            <div class="card-rating">
                                <i class="fa-solid fa-star"></i>
                                {{ catalogReviews(product) > 0 ? `${catalogRating(product).toFixed(1)} (${catalogReviews(product)})` : 'Baru' }}
                            </div>
                        </div>
                        <div class="card-actions">
                            <button
                                v-if="product.price > 0"
                                class="btn-primary card-buy-direct"
                                aria-label="Beli Langsung"
                            >
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button
                                class="btn-icon card-add-cart"
                                :class="{ 'btn-primary download': product.price === 0 }"
                                :style="product.price === 0 ? 'width:100%;' : ''"
                                :aria-label="product.price === 0 ? 'Download gratis' : 'Tambahkan Keranjang'"
                            >
                                <i :class="product.price === 0 ? 'fa-solid fa-download' : 'fa-solid fa-cart-plus'"></i>
                                <template v-if="product.price === 0"> Download</template>
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
                    <a id="modal-seller-link" class="card-store" href="#" style="margin-top:0; margin-bottom:2px; width:max-content;">Oleh: —</a>
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
                                <span class="spec-pill-val"><i class="fa-regular fa-calendar"></i><span id="modal-spec-updated">Agustus 2026</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Dukungan</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-headset"></i><span id="modal-spec-support">30 Hari</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Format File</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-file-zipper"></i><span id="modal-spec-format">.ZIP + Docs</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Lisensi</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-shield"></i><span id="modal-spec-license">Extended</span></span>
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
