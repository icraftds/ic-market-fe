<script setup>
import { nextTick, onMounted, ref } from 'vue';

definePageMeta({ layout: 'default' })

const welcomeUserId = ref('1');
const welcomeCoins = ref('1.000');


const { products: catalogProducts, hotProducts, refreshCatalog, refreshHotProducts } = useProductCatalog();


const isLoading = ref(true);
const route = useRoute();
const activeCategory = ref('semua');
const sortBy = ref('newest');
const catalogSearch = ref('');
const currentPage = ref(1);
const totalProducts = ref(0);
const hasMore = ref(false);
const isLoadingMore = ref(false);
const loadMoreTrigger = ref(null);
const showWelcome = ref(false);
const welcomeUser = ref('');
const welcomeType = ref('login');


const { fetchCart, cart: apiCart, addToCart: apiAddToCart } = useCart();

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80';

const catalogImage = (product) => {
    const imgs = catalogImages(product);
    return imgs[0] || FALLBACK_PRODUCT_IMAGE;
};

const catalogImages = (product) => {
    let imgs = [];
    if (product?.images && Array.isArray(product.images)) {
        imgs = product.images.map(img => typeof img === 'string' ? img : (img?.imageUrl || img));
    } else if (typeof product?.images === 'string') {
        try {
            const parsed = JSON.parse(product.images);
            imgs = parsed.map(img => typeof img === 'string' ? img : (img?.imageUrl || img));
        } catch (e) {}
    }
    if (product?.thumbnailUrl && !imgs.includes(product.thumbnailUrl)) {
        imgs.unshift(product.thumbnailUrl);
    }
    if (imgs.length === 0) {
        imgs = [FALLBACK_PRODUCT_IMAGE];
    }
    return imgs;
};

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

const selectedProduct = ref(null);
const activeImageIndex = ref(0);




const isInCart = (productId) => {
    return apiCart.value?.some(item => item.product_id === productId || item.id === productId);
};

const handleDirectBuy = async (product, e) => {
    if (product.price === 0) return;
    useState('global_loader').value = true;
    const success = await apiAddToCart(product.id || product.catalogId, 1);
    if (success) {
        useRouter().push('/checkout');
    } else {
        useState('global_loader').value = false;
    }
};

const handleAddCart = async (product, e) => {
    if (product.price === 0) {
        alert('Mulai mengunduh...');
        return;
    }
    
    if (isInCart(product.id || product.catalogId)) {
        return; // already in cart
    }
    
    const btn = e.currentTarget;
    animateToCart(btn);
    await apiAddToCart(product.id || product.catalogId, 1);
};

const animateToCart = (btn) => {
    if (!import.meta.client || !btn) return;
    
    // Flying dot
    const rect = btn.getBoundingClientRect();
    const cartBtn = document.querySelector('#cart-btn');
    if (!cartBtn) return;
    
    const cartBtnRect = cartBtn.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = (rect.left + rect.width / 2) + 'px';
    dot.style.top = (rect.top + rect.height / 2) + 'px';
    dot.style.width = '20px';
    dot.style.height = '20px';
    dot.style.borderRadius = '50%';
    dot.style.background = 'var(--primary, #1472ff)';
    dot.style.boxShadow = '0 0 10px var(--primary, #1472ff)';
    dot.style.zIndex = '999999';
    dot.style.transition = 'all 0.7s cubic-bezier(0.2, -0.2, 0.2, 1.2)';
    dot.style.pointerEvents = 'none';
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
        dot.style.left = (cartBtnRect.left + cartBtnRect.width/2 - 10) + 'px';
        dot.style.top = (cartBtnRect.top + cartBtnRect.height/2 - 10) + 'px';
        dot.style.transform = 'scale(0.3)';
        dot.style.opacity = '0.5';
    });
    
    setTimeout(() => {
        dot.remove();
        // optionally animate cart icon slightly
        cartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => cartBtn.style.transform = '', 200);
    }, 700);
};

const openPreview = (product) => {
    selectedProduct.value = product;
    activeImageIndex.value = 0;
    if (import.meta.client) {
        document.getElementById('preview-modal')?.showModal();
        document.body.style.overflow = 'hidden';
    }
};

const closePreview = () => {
    if (import.meta.client) {
        document.getElementById('preview-modal')?.close();
        document.body.style.overflow = '';
    }
    setTimeout(() => { selectedProduct.value = null; }, 300);
};




const loadProducts = async (append = false) => {
    if (!append) isLoading.value = true;
    else isLoadingMore.value = true;

    const params = { page: currentPage.value, limit: 12 };
    if (activeCategory.value !== 'semua') params.category = activeCategory.value;
    if (catalogSearch.value) params.search = catalogSearch.value;
    if (sortBy.value) params.sort = sortBy.value;

    const response = await refreshCatalog(params, append);
    if (response?.meta) {
        totalProducts.value = response.meta.total;
        hasMore.value = response.meta.current_page < response.meta.last_page;
    } else if (response?.data) {
        // Fallback if backend doesn't return meta (not updated yet)
        totalProducts.value = Array.isArray(response.data) ? response.data.length : 0;
        hasMore.value = false;
    }
    
    if (!append) isLoading.value = false;
    else isLoadingMore.value = false;
};

const setCategory = (cat) => {
    const router = useRouter();
    if (cat === 'semua') {
        router.push({ path: '/' });
    } else {
        router.push({ path: '/', query: { category: cat } });
    }
};

const reloadCatalog = () => {
    currentPage.value = 1;
    loadProducts();
};

const applyRouteQuery = async () => {
    const q = route.query.q;
    const cat = route.query.category;
    
    if (q) {
        catalogSearch.value = q.toString().toLowerCase();
        activeCategory.value = 'semua';
    } else if (cat) {
        const catStr = String(cat).toLowerCase();
        let searchKeyword = catStr;
        if (catStr === 'ui-templates') searchKeyword = 'ui kit';
        else if (catStr === 'plugins') searchKeyword = 'plugin';
        else if (catStr === 'source-code') searchKeyword = 'source code';
        activeCategory.value = searchKeyword;
        catalogSearch.value = '';
    } else {
        catalogSearch.value = '';
        activeCategory.value = 'semua';
    }
    currentPage.value = 1;
    await loadProducts();
    if (q || cat) {
        setTimeout(() => document.querySelector('.catalog-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
};

watch(() => route.query, () => {
    applyRouteQuery();
});

onMounted(async () => {
    if (import.meta.client && sessionStorage.getItem('icmarket_show_welcome')) {
        const type = sessionStorage.getItem('icmarket_show_welcome');
        const { session } = useDemoAuth();
        welcomeUser.value = (session.value?.name || 'Pengguna').split(' ').slice(0, 2).join(' ');
        welcomeType.value = type;
        showWelcome.value = true;
        sessionStorage.removeItem('icmarket_show_welcome');
        
    }
    await applyRouteQuery();
    await refreshHotProducts();

    // Intersection Observer for infinite scroll
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
            currentPage.value++;
            loadProducts(true);
        }
    }, { rootMargin: '100px' });

    if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value);

});
</script>

<template>
  <div>

    

    <!-- ======= HEADER ======= -->
    

    <!-- ======= HERO ======= -->
    <section class="hero-strip">
        <div class="hero-inner">
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

                <template v-if="isLoading">
                    <article v-for="i in 3" :key="i"
                        class="stack-card product-card skeleton-card"
                        :class="[`stack-card--${4 - i}`, i === 1 ? 'stack-active' : '']">
                        <div class="card-thumb skeleton-box" style="height: 120px;"></div>
                        <div class="card-body">
                            <div class="skeleton-box skeleton-text small" style="width: 40%; margin-bottom: 8px;"></div>
                            <div class="skeleton-box skeleton-text medium" style="width: 70%; margin-bottom: 8px;"></div>
                            <div class="skeleton-box skeleton-text large" style="width: 90%; margin-bottom: 16px;"></div>
                        </div>
                    </article>
                </template>

                <template v-else>
                    <article v-for="(product, index) in hotProducts" :key="product.id"
                        class="stack-card product-card" @click="openPreview(product)"
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
                                <span v-if="product.price === 0">Gratis</span><span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ Number(product.price).toLocaleString('id-ID') }}</span>
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
                </template>

                <!-- Hint klik -->
                <div class="stack-hint">
                    <i class="fa-solid fa-hand-pointer"></i> Klik kartu belakang untuk pindah
                </div>
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
        <li class="cat-item" :class="{ active: activeCategory === 'semua' }" @click="setCategory('semua')">
            Semua <span class="cat-count">{{ totalProducts }}</span>
        </li>
        <li class="cat-item" :class="{ active: activeCategory === 'web template' }" @click="setCategory('web template')">
            Web Template
        </li>
        <li class="cat-item" :class="{ active: activeCategory === 'ui kit' }" @click="setCategory('ui kit')">
            UI Kit
        </li>
        <li class="cat-item" :class="{ active: activeCategory === 'source code' }" @click="setCategory('source code')">
            Source Code
        </li>
    </ul>
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">Urutkan</div>
                <select class="sort-select" id="sort-select" v-model="sortBy" @change="reloadCatalog()">
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
                <span class="catalog-count">Menampilkan <strong id="product-count">{{ totalProducts }}</strong> produk</span>
                <div class="catalog-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="catalog-search-input" v-model="catalogSearch" @keyup.enter="reloadCatalog()" placeholder="Cari template, UI kit, source code…" autocomplete="off">
                </div>
            </div>

            <!-- PRODUCT GRID -->
            <div class="product-grid" id="product-grid">
                
                <template v-if="isLoading">
                    <!-- Skeleton Cards -->
                    <article v-for="i in 6" :key="i" class="product-card skeleton-card">
                        <div class="card-thumb skeleton-box" style="height: 180px;"></div>
                        <div class="card-body">
                            <div class="skeleton-box skeleton-text small" style="width: 40%; margin-bottom: 8px;"></div>
                            <div class="skeleton-box skeleton-text medium" style="width: 70%; margin-bottom: 8px;"></div>
                            <div class="skeleton-box skeleton-text large" style="width: 90%; margin-bottom: 16px;"></div>
                            <div class="skeleton-box skeleton-btn" style="height: 38px; border-radius: 8px;"></div>
                        </div>
                    </article>
                </template>

                <template v-else>
                    <!-- Produk seller dinamis: memakai UI card yang sama dengan file ZIP -->
                    <article
                        v-for="product in catalogProducts"
                    :key="product.catalogId"
                    class="product-card" @click="openPreview(product)"
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
                                <span v-if="product.price === 0">Gratis</span><span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ Number(product.price).toLocaleString('id-ID') }}</span>
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
                                :style="isInCart(product.id || product.catalogId) ? 'opacity: 0.5; cursor: not-allowed;' : ''"
                                :disabled="isInCart(product.id || product.catalogId)"
                                aria-label="Beli Langsung"
                                @click.stop="!isInCart(product.id || product.catalogId) && handleDirectBuy(product, $event)"
                            >
                                <i class="fa-solid fa-bolt"></i> Beli
                            </button>
                            <button
                                class="btn-icon card-add-cart"
                                :class="{ 'btn-primary download': product.price === 0, 'in-cart': product.price > 0 && isInCart(product.id || product.catalogId) }"
                                :style="product.price === 0 ? 'width:100%;' : ''"
                                :aria-label="product.price === 0 ? 'Download gratis' : 'Tambahkan Keranjang'"
                                @click.stop="handleAddCart(product, $event)"
                            >
                                <template v-if="product.price === 0">
                                    <i class="fa-solid fa-download"></i> Download
                                </template>
                                <template v-else-if="isInCart(product.id || product.catalogId)">
                                    <i class="fa-solid fa-check"></i>
                                </template>
                                <template v-else>
                                    <i class="fa-solid fa-cart-plus"></i>
                                </template>
                            </button>
                        </div>
                    </div>
                </article>
                </template>

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
        <button class="modal-close-btn" id="close-preview" aria-label="Tutup" @click="closePreview">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="modal-drag-bar"><div class="drag-handle"></div></div>
        <div class="modal-inner" v-if="selectedProduct">
            <!-- Gallery -->
            <div class="modal-gallery">
                <div class="gallery-main">
                    <img :src="catalogImages(selectedProduct)[activeImageIndex]" :alt="selectedProduct.name" id="modal-img">
                </div>
                <div class="gallery-thumbs" v-if="catalogImages(selectedProduct).length > 1">
                    <button v-for="(img, idx) in catalogImages(selectedProduct)" :key="idx" 
                            class="thumb-btn" :class="{ active: idx === activeImageIndex }" 
                            @click="activeImageIndex = idx">
                        <img :src="img" alt="Thumbnail">
                    </button>
                </div>
            </div>
            <!-- Detail -->
            <div class="modal-detail">
                <div class="modal-detail-header">
                    <div class="modal-tags" id="modal-tags">
                        <span class="card-badge premium" v-for="tag in catalogTags(selectedProduct)" :key="tag">{{ tag }}</span>
                    </div>
                    <h2 class="modal-title" id="modal-title">{{ selectedProduct.name }}</h2>
                    <NuxtLink :to="'/store/' + selectedProduct.storeSlug" id="modal-seller-link" class="card-store" style="margin-top:0; margin-bottom:2px; width:max-content;">
                        Oleh: {{ selectedProduct.storeName }}
                    </NuxtLink>
                    <div class="modal-price-row">
                        <span class="modal-price" id="modal-price">
                            <span v-if="selectedProduct.price === 0">Gratis</span>
                            <span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ Number(selectedProduct.price).toLocaleString('id-ID') }}</span>
                        </span>
                        <div class="modal-stars" id="modal-stars">
                            <i class="fa-solid fa-star"></i>
                            <span id="modal-rating-text">{{ catalogRating(selectedProduct) }} ({{ catalogReviews(selectedProduct) }} ulasan)</span>
                        </div>
                    </div>
                </div>
                <div class="modal-detail-body">
                    <div>
                        <div class="detail-section-label">Deskripsi</div>
                        <p class="detail-desc" id="modal-desc">{{ selectedProduct.description }}</p>
                    </div>
                    <div>
                        <div class="detail-section-label">Fitur Utama</div>
                        <ul class="feature-list" id="modal-features">
                            <li v-for="feature in catalogFeatures(selectedProduct)" :key="feature"><i class="fa-solid fa-check"></i> <span>{{ feature }}</span></li>
                        </ul>
                    </div>
                    <div>
                        <div class="detail-section-label">Spesifikasi</div>
                        <div class="specs-row">
                            <div class="spec-pill">
                                <span class="spec-pill-label">Terakhir Update</span>
                                <span class="spec-pill-val"><i class="fa-regular fa-calendar"></i><span id="modal-spec-updated">{{ catalogSpecifications(selectedProduct).lastUpdated }}</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Dukungan</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-headset"></i><span id="modal-spec-support">{{ catalogSpecifications(selectedProduct).support }}</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Format File</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-file-zipper"></i><span id="modal-spec-format">{{ catalogSpecifications(selectedProduct).fileFormat }}</span></span>
                            </div>
                            <div class="spec-pill">
                                <span class="spec-pill-label">Lisensi</span>
                                <span class="spec-pill-val"><i class="fa-solid fa-shield"></i><span id="modal-spec-license">{{ catalogSpecifications(selectedProduct).license }}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-cta" style="display:flex; flex-direction:column; gap:12px;">
                    <div style="display:flex; gap:12px; width:100%;">
                        <button class="cta-buy" id="modal-buy-direct-btn" 
                                style="flex:1;" 
                                :style="selectedProduct && isInCart(selectedProduct.id || selectedProduct.catalogId) ? 'opacity: 0.5; cursor: not-allowed;' : ''"
                                :disabled="selectedProduct && isInCart(selectedProduct.id || selectedProduct.catalogId)"
                                @click="handleDirectBuy(selectedProduct, $event); closePreview()">
                            <i class="fa-solid fa-bolt"></i>
                            <span>Beli Langsung</span>
                        </button>
                        <button class="cta-buy" id="modal-add-cart-btn" 
                                style="flex:1;"
                                :style="selectedProduct && isInCart(selectedProduct.id || selectedProduct.catalogId) ? 'background: #10b981; color: #fff; border: 1px solid #10b981;' : 'background:var(--surface); color:var(--text); border:1px solid var(--border);'"
                                @click="handleAddCart(selectedProduct, $event); closePreview()">
                            <template v-if="selectedProduct && isInCart(selectedProduct.id || selectedProduct.catalogId)">
                                <i class="fa-solid fa-check"></i>
                                <span>Di Keranjang</span>
                            </template>
                            <template v-else>
                                <i class="fa-solid fa-cart-plus"></i>
                                <span>Tambahkan Keranjang</span>
                            </template>
                        </button>
                    </div>
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

    <!-- Welcome Popup -->
    <Transition name="welcome-fade">
        <div v-if="showWelcome" class="welcome-overlay">
            
            <div v-if="welcomeType === 'register'" class="welcome-card welcome-card-register">
                <div class="welcome-glow-bg"></div>
                
                <div class="welcome-content">
                    <div class="welcome-header">
                        <h2>🎉 Selamat Datang!</h2>
                    </div>
                    
                    <div class="welcome-body">
                        <p class="greeting-name">Halo, <strong>{{ welcomeUser }}</strong></p>
                        <p class="greeting-desc">Terima kasih telah bergabung. Sebagai pengguna baru, Anda mendapatkan hadiah spesial:</p>
                        
                        <div class="bonus-box">
                            <img src="/icoinz.svg" alt="iCoinz" class="bonus-icon" />
                            <div class="bonus-amount-wrap">
                                <span class="bonus-amount">10.000</span>
                                <span class="bonus-currency">iCoin-Z</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="welcome-close-btn" @click="showWelcome = false">
                        Mulai Belanja <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <!-- Confetti/Sparkles -->
                <div class="sparkle s1">✨</div>
                <div class="sparkle s2">✨</div>
                <div class="sparkle s3">⭐</div>
                <div class="sparkle s4">⭐</div>
            </div>

            <div v-else class="welcome-card welcome-card-login">
                <div class="welcome-glow-bg login-glow"></div>
                <div class="welcome-content">
                    <img src="/icoinz.svg" class="welcome-logo-login" alt="iCoinz" />
                    <h2 class="welcome-title">Selamat Datang, {{ welcomeUser }}!</h2>
                    <p class="welcome-subtitle">Berhasil masuk ke IC Market</p>
                    <button class="welcome-close-btn" @click="showWelcome = false">
                        Tutup <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

        </div>
    </Transition>

</template>

<style scoped>
/* Welcome Popup */
.welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    background: rgba(10, 15, 30, 0.7);
    backdrop-filter: blur(8px);
}
.welcome-card {
    position: relative;
    width: 90%;
    max-width: 400px;
    background: rgba(20, 25, 45, 0.85);
    border-radius: 24px;
    padding: 32px 24px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: floatUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}
.welcome-glow-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(20, 114, 255, 0.2) 0%, transparent 60%);
    animation: spinSlow 10s linear infinite;
    z-index: 0;
    pointer-events: none;
}
.login-glow {
    background: radial-gradient(circle, rgba(100, 100, 255, 0.15) 0%, transparent 60%);
}
.welcome-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.welcome-header h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    margin: 0;
    text-shadow: 0 0 20px rgba(20,114,255,0.8);
}
.greeting-name {
    font-size: 1.25rem;
    color: #e2e8f0;
    margin-top: 16px;
    margin-bottom: 8px;
}
.greeting-name strong {
    color: #fff;
}
.greeting-desc {
    font-size: 0.95rem;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 24px;
}
.bonus-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: linear-gradient(135deg, rgba(20, 114, 255, 0.2), rgba(0, 80, 200, 0.1));
    border: 1px solid rgba(20, 114, 255, 0.4);
    border-radius: 16px;
    padding: 16px 24px;
    width: 100%;
    box-shadow: inset 0 0 20px rgba(20, 114, 255, 0.1), 0 8px 32px rgba(20, 114, 255, 0.2);
    margin-bottom: 32px;
    animation: pulseBox 2s infinite alternate;
}
.bonus-icon {
    width: 56px;
    height: 56px;
    filter: drop-shadow(0 0 12px rgba(255,255,255,0.4));
    animation: bounceSlow 3s infinite;
}
.bonus-amount-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
}
.bonus-amount {
    font-family: 'Outfit', sans-serif;
    font-size: 2.5rem;
    font-weight: 900;
    color: #4db8ff;
    line-height: 1;
    text-shadow: 0 0 10px rgba(77, 184, 255, 0.5);
}
.bonus-currency {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 1px;
}
.welcome-close-btn {
    background: linear-gradient(135deg, #1472ff, #0a4ebd);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(20, 114, 255, 0.4);
}
.welcome-close-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(20, 114, 255, 0.6);
}
.welcome-logo-login {
    width: 72px;
    height: 72px;
    margin-bottom: 24px;
    filter: drop-shadow(0 0 16px rgba(255,255,255,0.3));
}
.welcome-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: #fff;
}
.welcome-subtitle {
    color: #94a3b8;
    margin-bottom: 32px;
}
.sparkle {
    position: absolute;
    font-size: 1.5rem;
    pointer-events: none;
    animation: floatSparkle 3s ease-in-out infinite alternate;
}
.s1 { top: 15%; left: 10%; animation-delay: 0s; font-size: 1.2rem; }
.s2 { top: 25%; right: 10%; animation-delay: 0.5s; font-size: 1.8rem; }
.s3 { bottom: 35%; left: 15%; animation-delay: 1s; font-size: 1.5rem; }
.s4 { bottom: 20%; right: 15%; animation-delay: 1.5s; font-size: 1rem; }

.welcome-fade-enter-active,
.welcome-fade-leave-active {
    transition: opacity 0.4s ease;
}
.welcome-fade-enter-from,
.welcome-fade-leave-to {
    opacity: 0;
}
@keyframes pulseBox {
    0% { box-shadow: inset 0 0 10px rgba(20,114,255,0.1), 0 8px 24px rgba(20,114,255,0.1); }
    100% { box-shadow: inset 0 0 20px rgba(20,114,255,0.3), 0 12px 40px rgba(20,114,255,0.3); }
}
@keyframes bounceSlow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}
@keyframes floatUp {
    0% { transform: translateY(40px) scale(0.95); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes floatSparkle {
    0% { transform: translateY(0) scale(1); opacity: 0.5; }
    100% { transform: translateY(-10px) scale(1.2); opacity: 1; }
}
@keyframes spinSlow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.card-add-cart.in-cart {
    background: #10b981 !important;
    color: #fff !important;
    border-color: #10b981 !important;
}
.card-add-cart.in-cart:hover {
    background: #059669 !important;
    border-color: #059669 !important;
}
</style>


