<script setup>
import { nextTick, onMounted, ref } from 'vue';

definePageMeta({ layout: 'default' })

const showWelcomePopup = ref(false);
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
    activeCategory.value = cat;
    currentPage.value = 1;
    loadProducts();
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

    // Event Delegation for Add to Cart
    document.addEventListener('click', async e => {
        const btnBuyDirect = e.target.closest('.card-buy-direct');
        if (btnBuyDirect) {
            e.stopPropagation();
            const card = btnBuyDirect.closest('.product-card');
            if (card && card.dataset.free !== 'true') {
                const success = await apiAddToCart(card.dataset.productId || card.dataset.id, 1);
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
                alert('Mulai mengunduh...');
                return;
            }
            
            await apiAddToCart(card.dataset.productId || card.dataset.id, 1);
            return;
        }
    });
});
</script>

<template>
  <div>

    <!-- ======= WELCOME POPUP ======= -->
    <div v-if="showWelcomePopup" class="welcome-overlay" @click="showWelcomePopup = false">
      <div class="welcome-content" @click.stop>
        <div class="welcome-text">Selamat, kamu pendaftar ke - {{ welcomeUserId }}</div>
        <div class="welcome-text">dan mendapatkan {{ welcomeCoins }} iCoinz!</div>
        <button class="welcome-btn" @click="showWelcomePopup = false">Belanja Sekarang</button>
      </div>
    </div>

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
                                <span v-if="product.price === 0">Gratis</span><span v-else><i class="fa-solid fa-coins" style="color: #f59e0b"></i> {{ Number(product.price).toLocaleString('id-ID') }}</span>
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
                                <span v-if="product.price === 0">Gratis</span><span v-else><i class="fa-solid fa-coins" style="color: #f59e0b"></i> {{ Number(product.price).toLocaleString('id-ID') }}</span>
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

<style scoped>
/* Welcome Popup */
.welcome-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.4s ease-out;
}
.welcome-content {
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.welcome-text {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.welcome-btn {
  margin-top: 24px;
  padding: 14px 36px;
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.3s;
}
.welcome-btn:hover {
  background: #fff;
  color: #000;
  transform: translateY(-2px);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Skeleton Loaders */
.skeleton-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eaeaea;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.skeleton-box {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loadingSkeleton 1.5s infinite;
}
.skeleton-text {
  height: 14px;
  border-radius: 4px;
}
@keyframes loadingSkeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
