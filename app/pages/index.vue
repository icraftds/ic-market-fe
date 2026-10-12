<script setup>
const productApi = useProductApi()
import { computed, nextTick, onMounted, ref } from 'vue';

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig();

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
const featuredReviews = ref([]);
const categories = ref([]);



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

const fallbackHotItems = [
  { id: 1, name: 'Template E-Commerce Super', category: 'Web Template', price: 350000, images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'], is_hot: true },
  { id: 2, name: 'UI/UX Startup Kit', category: 'UI Kit', price: 150000, images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80'], is_hot: true },
  { id: 3, name: '100+ Minimalist Logo Templates', category: 'Grafis', price: 0, images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80'], is_hot: true },
  { id: 4, name: 'Lofi Chill Beats Pack', category: 'Audio', price: 45000, images: ['https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80'], is_hot: true }
];

const heroFannedCards = computed(() => {
  const hot = (hotProducts.value && hotProducts.value.length)
    ? hotProducts.value.filter(p => p && p.id)
    : fallbackHotItems;

  // 7 cards in the fanned deck matching the reference image
  const targetCount = 7;
  const result = [];
  for (let i = 0; i < targetCount; i++) {
    const product = hot[i % hot.length];
    result.push({
      ...product,
      fanKey: `${product.id}-${i}`,
      bubble: i === 1 
        ? { text: '@coplin', color: 'blue' } 
        : (i === 5 ? { text: '@andrea', color: 'green' } : null)
    });
  }
  return result;
});

const fanSlots = [
  { rot: -13, y: 18 },
  { rot: -8,  y: 8 },
  { rot: -4,  y: 2 },
  { rot: 0,   y: 0 },
  { rot: 4,   y: 2 },
  { rot: 8,   y: 8 },
  { rot: 13,  y: 18 }
];

const getFanCardStyle = (idx) => {
  const slot = fanSlots[idx] || { rot: 0, y: 0 };
  return {
    '--rot': `${slot.rot}deg`,
    '--y': `${slot.y}px`,
    '--z': `${idx + 1}`
  };
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

const catalogRating = (product) => Number(product?.reviews_avg_rating ?? product?.rating ?? 0);
const catalogReviews = (product) => Number(product?.reviews_count ?? product?.review_count ?? 0);

const selectedProduct = ref(null)
const reviewMeta = ref(null)
const reviewsLoading = ref(false)
const reviewsConfig = useRuntimeConfig()
const loadProductReviews = async (page = 1) => {
    if (!selectedProduct.value || reviewsLoading.value) return
    const id = selectedProduct.value.id
    reviewsLoading.value = true
    try {
        const response = await productApi(`${reviewsConfig.public.apiBase}/products/${id}/reviews`, { query: { page, limit: 20 } })
        if (selectedProduct.value?.id !== id) return
        selectedProduct.value = { ...selectedProduct.value, reviews: response.data || [] }
        reviewMeta.value = response.meta
    } finally { reviewsLoading.value = false }
};
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
    reviewMeta.value = null;
    loadProductReviews().catch(() => {});
    activeImageIndex.value = 0;
    if (import.meta.client) {
        document.getElementById('preview-modal')?.showModal();
        document.body.style.overflow = 'hidden';
        
        // Record view asynchronously
        productApi(`${config.public.apiBase}/products/${product.id}/view`, {
            method: 'POST'
        }).catch(err => console.error('Failed to record view:', err));
    }
};

const closePreview = () => {
    if (import.meta.client) {
        const modal = document.getElementById('preview-modal');
        if (modal) {
            modal.style.transform = '';
            modal.close();
        }
        document.body.style.overflow = '';
    }
    setTimeout(() => { selectedProduct.value = null; }, 300);
};

const handleModalClick = (e) => {
    if (e.target.id === 'preview-modal') {
        closePreview();
    }
};

let isDragging = false;
let touchStartY = 0;
let touchCurrentY = 0;

const handleDragStart = (y) => {
    isDragging = true;
    touchStartY = y;
    touchCurrentY = y;
    const modal = document.getElementById('preview-modal');
    if (modal) modal.style.transition = 'none';
    
    // Attach global events for mouse dragging
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
};

const handleDragMove = (y) => {
    if (!isDragging) return;
    const modal = document.getElementById('preview-modal');
    if (!modal) return;
    touchCurrentY = y;
    const diff = touchCurrentY - touchStartY;
    if (diff > 0) {
        modal.style.transform = `translateY(${diff}px)`;
    }
};

const handleDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    
    // Detach global events
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);

    const modal = document.getElementById('preview-modal');
    if (!modal) return;
    modal.style.transition = '';
    const diff = touchCurrentY - touchStartY;
    if (diff > 100) {
        modal.style.transform = '';
        closePreview();
    } else {
        modal.style.transform = 'translateY(0)';
    }
};

const handleTouchStart = (e) => handleDragStart(e.touches[0].clientY);
const handleTouchMove = (e) => handleDragMove(e.touches[0].clientY);
const handleTouchEnd = (e) => handleDragEnd();

const handleMouseDown = (e) => handleDragStart(e.clientY);
const handleGlobalMouseMove = (e) => handleDragMove(e.clientY);
const handleGlobalMouseUp = (e) => handleDragEnd();




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

const fetchFeaturedReviews = async () => {
    try {
        const res = await productApi(`${config.public.apiBase}/reviews/featured`);
        if (res.success) {
            featuredReviews.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch reviews', e);
    }
};

const fetchCategories = async () => {
    try {
        const res = await productApi(`${config.public.apiBase}/products/categories`);
        if (res.success) {
            categories.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch categories', e);
    }
};

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
    await fetchFeaturedReviews();
    await fetchCategories();

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
    

    <!-- ======= PROMO MARQUEE (ABOVE HERO) ======= -->
    <div class="hero-promo-marquee" aria-label="Pengumuman & Promo">
      <div class="marquee-track">
        <div class="marquee-group">
          <NuxtLink to="/topup" class="marquee-item">
            <span class="m-tag"><img src="/icoinz.svg" alt="iCoinz" class="m-tag-icon" /> Top Up</span>
            <span class="m-text">Bonus saldo ekstra hingga <strong>+25% iCoin</strong> setiap isi ulang hari ini</span>
          </NuxtLink>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Flash Sale</span>
            <span class="m-text">Template E-Commerce Super cuma <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 199.000 iCoin</strong> <del class="m-del">350.000</del></span>
          </a>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Best Seller</span>
            <span class="m-text">UI/UX Startup Kit Figma hanya <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 150.000 iCoin</strong></span>
          </a>
          <span class="m-sep">•</span>

          <div class="marquee-item">
            <span class="m-tag">Voucher</span>
            <span class="m-text">Cashback 20% pembelian pertama dengan kode: <code class="m-code">ICMARKETNEW</code></span>
          </div>
          <span class="m-sep">•</span>

          <NuxtLink to="/seller/register" class="marquee-item">
            <span class="m-tag">Buka Toko</span>
            <span class="m-text">Jual aset digital Anda — <strong>0% biaya komisi</strong> untuk seller baru</span>
          </NuxtLink>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Source Code</span>
            <span class="m-text">Laravel Point of Sales Kasir cuma <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 450.000 iCoin</strong></span>
          </a>
          <span class="m-sep">•</span>
        </div>

        <!-- DUPLICATE FOR SEAMLESS 100% INFINITE LOOP -->
        <div class="marquee-group" aria-hidden="true">
          <NuxtLink to="/topup" class="marquee-item">
            <span class="m-tag"><img src="/icoinz.svg" alt="iCoinz" class="m-tag-icon" /> Top Up</span>
            <span class="m-text">Bonus saldo ekstra hingga <strong>+25% iCoin</strong> setiap isi ulang hari ini</span>
          </NuxtLink>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Flash Sale</span>
            <span class="m-text">Template E-Commerce Super cuma <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 199.000 iCoin</strong> <del class="m-del">350.000</del></span>
          </a>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Best Seller</span>
            <span class="m-text">UI/UX Startup Kit Figma hanya <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 150.000 iCoin</strong></span>
          </a>
          <span class="m-sep">•</span>

          <div class="marquee-item">
            <span class="m-tag">Voucher</span>
            <span class="m-text">Cashback 20% pembelian pertama dengan kode: <code class="m-code">ICMARKETNEW</code></span>
          </div>
          <span class="m-sep">•</span>

          <NuxtLink to="/seller/register" class="marquee-item">
            <span class="m-tag">Buka Toko</span>
            <span class="m-text">Jual aset digital Anda — <strong>0% biaya komisi</strong> untuk seller baru</span>
          </NuxtLink>
          <span class="m-sep">•</span>

          <a href="#catalog-section" class="marquee-item">
            <span class="m-tag">Source Code</span>
            <span class="m-text">Laravel Point of Sales Kasir cuma <strong class="m-price"><img src="/icoinz.svg" alt="iCoinz" class="m-coin-img" /> 450.000 iCoin</strong></span>
          </a>
          <span class="m-sep">•</span>
        </div>
      </div>
    </div>

    <!-- ======= HERO (FANNED DECK SHOWCASE) ======= -->
    <section class="hero-strip">
      <div class="hero-container">

        <!-- TOP CONTENT (TITLE) -->
        <div class="hero-top-content">
          <div class="hero-label">IC Market · Open Store</div>
          <h1 class="hero-display-title">
            Aset Digital <em>Premium</em>,<br />Harga Terjangkau.
          </h1>
        </div>

        <!-- MIDDLE: FANNED OVERLAPPING CARDS (MATCHING REFERENCE IMAGE) -->
        <div class="hero-fan-deck" aria-label="Showcase Hot Products">
          <div
            v-for="(product, idx) in heroFannedCards"
            :key="product.fanKey || idx"
            class="hero-fan-card"
            :style="getFanCardStyle(idx)"
            @click="openPreview(product)"
            :title="`Lihat detail hot product: ${product.name}`"
          >
            <!-- Floating Speech Bubble (@coplin & @andrea style) -->
            <div v-if="product.bubble" class="fan-speech-bubble" :class="product.bubble.color">
              {{ product.bubble.text }}
            </div>

            <div class="fan-card-inner">
              <div class="fan-card-thumb">
                <img :src="catalogImage(product)" :alt="product.name" loading="lazy" />
                <span class="fan-card-badge">
                  <i class="fa-solid fa-fire"></i> Hot
                </span>
              </div>
              <div class="fan-card-overlay">
                <span class="fan-card-cat">{{ product.category || 'Asset' }}</span>
                <h4 class="fan-card-title">{{ product.name }}</h4>
                <div class="fan-card-price">
                  <template v-if="product.price === 0">
                    <span class="price-free">Gratis</span>
                  </template>
                  <template v-else>
                    <img src="/icoinz.svg" alt="iCoinz" class="fan-coin-icon" />
                    <span>{{ Number(product.price).toLocaleString('id-ID') }} iCoin</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM CONTENT (SUBTITLE & CTA BUTTONS) -->
        <div class="hero-bottom-content">
          <p class="hero-desc">
            Kreator dapat memamerkan karya terbaiknya, dan pembeli dapat menemukan serta membeli aset digital terverifikasi yang siap pakai.
          </p>
          <div class="hero-cta-group">
            <a href="#catalog-section" class="hero-btn-primary">
              <span>Eksplor Katalog Hot</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
            <NuxtLink to="/seller/register" class="hero-btn-secondary">
              Buka Toko
            </NuxtLink>
          </div>
        </div>

      </div>
    </section>

    <!-- ======= MAIN LAYOUT ======= -->
    <div class="main-layout" id="catalog-section">

        <!-- SIDEBAR -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">Kategori</div>
                <ul class="cat-list" id="cat-list">
        <li class="cat-item" :class="{ active: activeCategory === 'semua' }" @click="setCategory('semua')">
            Semua <span class="cat-count">{{ totalProducts }}</span>
        </li>
        <li v-for="cat in categories" :key="cat" class="cat-item" style="text-transform: capitalize;" :class="{ active: activeCategory === cat }" @click="setCategory(cat)">
            {{ cat }}
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
                    <div v-for="i in 8" :key="'skel-'+i" class="product-card" style="pointer-events: none; opacity: 0.8;">
                        <div class="card-thumb skeleton-box" style="aspect-ratio: 4/3; border-radius: 0;"></div>
                        <div class="card-body" style="display: flex; flex-direction: column;">
                            <div class="skeleton-box" style="height: 12px; width: 30%; margin-bottom: 8px;"></div>
                            <div class="skeleton-box" style="height: 16px; width: 70%; margin-bottom: 12px;"></div>
                            <div class="card-footer" style="border: none; padding-top: 0; margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                                <div class="skeleton-box" style="height: 20px; width: 40%;"></div>
                                <div class="skeleton-box" style="height: 14px; width: 25%;"></div>
                            </div>
                            <div style="text-align: center; padding-top: 12px; font-size: 0.8rem; font-weight: 600; color: var(--muted); border-top: 1px solid var(--border); margin-top: 12px;">
                                <i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 4px;"></i> Memuat produk..
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <ProductCard
                        v-for="product in catalogProducts"
                        :key="product.catalogId"
                        :product="product"
                        :show-quick-view="true"
                        @preview="openPreview"
                        @add-cart="handleAddCart"
                        @direct-buy="handleDirectBuy"
                    />

                </template>

            </div><!-- /product-grid -->

            <!-- Load More Trigger + Spinner -->
            <div ref="loadMoreTrigger" style="height: 1px;"></div>
            <div v-if="isLoadingMore" class="icoinz-loader-wrap" style="padding: 24px;">
                <IcoinzLoader text="Memuat lebih banyak..." size="sm" />
            </div>

        </main>

    </div><!-- /main-layout -->

    <!-- ======= REVIEWS CAROUSEL ======= -->
    <section class="reviews-section">
        <div class="reviews-inner">
            <div class="section-label">Ulasan Pembeli</div>
            <div class="section-title">Apa Kata Mereka</div>
            
            <div v-if="featuredReviews.length === 0" style="text-align: center; padding: 40px; color: var(--muted);">
                <i class="fa-regular fa-comment-dots" style="font-size: 2rem; margin-bottom: 12px; color: #cbd5e1;"></i>
                <p>Data belum tersedia.</p>
            </div>
            
            <div v-else class="reviews-track-wrap">
                <div class="reviews-track" id="reviews-track">
                    <div v-for="review in featuredReviews" :key="review.id" class="review-card">
                        <div class="review-stars">
                            <i v-for="i in 5" :key="i" class="fa-solid fa-star" :style="{ color: i <= review.rating ? '#f59e0b' : '#e5e7eb' }"></i>
                        </div>
                        <p class="review-text">"{{ review.comment }}"</p>
                        <div class="review-author" :class="{ 'is-sultan-author': review.is_sultan }">
                            <div class="author-avatar" :style="{ background: review.is_sultan ? 'linear-gradient(135deg, #fcd34d, #f59e0b)' : 'linear-gradient(135deg, #1472FF, #00f0ff)' }">
                                {{ review.user_name.charAt(0).toUpperCase() }}
                            </div>
                            <div>
                                <div class="author-name">
                                    {{ review.user_name }}
                                    <span v-if="review.is_sultan" class="sultan-badge"><i class="fa-solid fa-crown" style="font-size: 10px;"></i> Sultan</span>
                                </div>
                                <div class="author-role">{{ review.product_name }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======= FOOTER ======= -->
    <SiteFooter />

        <!-- ======= PREVIEW MODAL ======= -->
    <dialog id="preview-modal" class="preview-modal" @click="handleModalClick">
        <button class="modal-close-btn" id="close-preview" aria-label="Tutup" @click="closePreview">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="modal-drag-bar" 
             @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
             @mousedown.prevent="handleMouseDown">
            <div class="drag-handle"></div>
        </div>
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
                        <span class="modal-tag" v-for="tag in catalogTags(selectedProduct)" :key="tag">{{ tag }}</span>
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
                    <a v-if="selectedProduct && selectedProduct.preview_url" :href="selectedProduct.preview_url" target="_blank" class="cta-preview" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; background:var(--subtle); border-radius:var(--radius-md); text-decoration:none; color:var(--text); font-weight:600;">
                        <i class="fa-solid fa-desktop"></i> Lihat Demo / Preview
                    </a>
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
                
                <ApiPagination :meta="reviewMeta" :busy="reviewsLoading" @page="loadProductReviews" />
                <div v-if="selectedProduct && selectedProduct.reviews && selectedProduct.reviews.length" class="modal-reviews" style="padding: 0 24px 24px;">
                    <h3 style="font-size: 1rem; margin-bottom: 12px;">Ulasan Pembeli</h3>
                    <div class="review-scroll" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory;">
                        <div v-for="review in selectedProduct.reviews" :key="review.id" style="flex: 0 0 280px; scroll-snap-align: start; background: var(--subtle); padding: 16px; border-radius: var(--radius); border: 1px solid var(--border);" :class="{ 'is-sultan-bg': review.user?.sultan_expires_at && new Date(review.user.sultan_expires_at) > new Date() }">
                            <div style="display: flex; gap: 4px; color: #f59e0b; font-size: 0.8rem; margin-bottom: 8px;">
                                <i v-for="n in 5" :key="n" :class="n <= review.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                            </div>
                            <p style="font-size: 0.9rem; line-height: 1.4; color: var(--text); margin-bottom: 12px;">"{{ review.comment }}"</p>
                            <div style="font-size: 0.8rem; color: var(--muted); display: flex; align-items: center; flex-wrap: wrap;">
                                <span style="margin-right: 4px;">Oleh: {{ review.user ? review.user.name : 'Pembeli' }}</span>
                                <span v-if="review.user?.sultan_expires_at && new Date(review.user.sultan_expires_at) > new Date()" class="sultan-badge"><i class="fa-solid fa-crown" style="font-size: 10px;"></i> Sultan</span>
                                <span v-if="review.is_auto_generated" style="opacity: 0.5; margin-left: 4px;">(Sistem)</span>
                            </div>
                        </div>
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
/* ===== iCoinz Loader ===== */
.icoinz-loader-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 48px 24px;
    width: 100%;
}
.icoinz-loader-wrap.grid-loader {
    grid-column: 1 / -1;
    min-height: 300px;
}
.icoinz-spin {
    width: 64px;
    height: 64px;
    animation: icoinzFlip 1.2s linear infinite;
    filter: drop-shadow(0 0 12px rgba(20, 114, 255, 0.5));
}
.icoinz-loader-text {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.3px;
    animation: icoinzPulse 1.2s ease-in-out infinite alternate;
}
@keyframes icoinzFlip {
    0%   { transform: perspective(400px) rotateY(0deg); }
    100% { transform: perspective(400px) rotateY(360deg); }
}
@keyframes icoinzPulse {
    from { opacity: 0.5; }
    to   { opacity: 1; }
}

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


