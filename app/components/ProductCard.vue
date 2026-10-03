<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showQuickView: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['preview', 'add-cart', 'direct-buy'])

const router = useRouter()
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80'

const catalogImage = (product) => {
  let imgs = []
  if (product?.images && Array.isArray(product.images)) {
    imgs = product.images.map(img => typeof img === 'string' ? img : (img?.imageUrl || img))
  } else if (typeof product?.images === 'string') {
    try {
      const parsed = JSON.parse(product.images)
      imgs = parsed.map(img => typeof img === 'string' ? img : (img?.imageUrl || img))
    } catch (e) {}
  }
  if (product?.thumbnailUrl && !imgs.includes(product.thumbnailUrl)) {
    imgs.unshift(product.thumbnailUrl)
  }
  if (product?.image && !imgs.includes(product.image)) {
    imgs.unshift(product.image)
  }
  if (imgs.length === 0) {
    imgs = [FALLBACK_PRODUCT_IMAGE]
  }
  return imgs[0] || FALLBACK_PRODUCT_IMAGE
}

const catalogRating = (product) => Number(product?.rating || 0)
const catalogReviews = (product) => Number(product?.review_count || 0)

const { cart: apiCart } = useCart()
const isInCart = (productId) => {
  return apiCart.value?.some(item => item.product_id === productId || item.id === productId)
}

const handlePreview = () => {
  if (props.showQuickView) {
    emit('preview', props.product)
  } else {
    router.push(`/store/${props.product.storeSlug}`)
  }
}
</script>

<template>
  <article
    class="product-card"
    @click="handlePreview"
  >
    <div class="card-thumb">
      <img :src="catalogImage(product)" :alt="product.name" loading="lazy">
      <span class="card-badge" :class="product.price === 0 ? 'free' : 'premium'">
        {{ product.price === 0 ? 'Gratis' : 'Seller' }}
      </span>
      <button v-if="showQuickView" class="card-quick-view" aria-label="Quick View">
        <i class="fa-solid fa-eye"></i>
      </button>
    </div>
    <div class="card-body">
      <span class="card-category">{{ product.category }}</span>
      <a class="card-store" :href="`/store/${product.storeSlug || product.storeApplicationId}`" @click.stop>
        Oleh: {{ product.storeName || 'Seller' }}
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
          :style="isInCart(product.id || product.catalogId || product.productId) ? 'opacity: 0.5; cursor: not-allowed;' : ''"
          :disabled="isInCart(product.id || product.catalogId || product.productId)"
          aria-label="Beli Langsung"
          @click.stop="!isInCart(product.id || product.catalogId || product.productId) && emit('direct-buy', product, $event)"
        >
          <i class="fa-solid fa-bolt"></i> Beli
        </button>
        <button
          class="btn-icon card-add-cart"
          :class="{ 'btn-primary download': product.price === 0, 'in-cart': product.price > 0 && isInCart(product.id || product.catalogId || product.productId) }"
          :style="product.price === 0 ? 'width:100%;' : ''"
          :aria-label="product.price === 0 ? 'Download gratis' : 'Tambahkan Keranjang'"
          @click.stop="emit('add-cart', product, $event)"
        >
          <template v-if="product.price === 0">
            <i class="fa-solid fa-download"></i> Download
          </template>
          <template v-else>
            <i class="fa-solid fa-cart-plus"></i> <span v-if="isInCart(product.id || product.catalogId || product.productId)">Di Keranjang</span><span v-else>Keranjang</span>
          </template>
        </button>
      </div>
    </div>
  </article>
</template>
