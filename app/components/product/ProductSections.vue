<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { sanitizeHtml } from '~/utils/sanitizeHtml'

/** ProductSections: nav isi halaman + Deskripsi, Fitur utama, Detail & lisensi, Ulasan (papan V2Product). */
const props = defineProps({ product: { type: Object, required: true } })

const allLinks = [
  { href: '#deskripsi', label: 'Deskripsi' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#detail', label: 'Detail & lisensi', short: 'Detail' },
  { href: '#ulasan', label: 'Ulasan' },
  { href: '#seller', label: 'Seller', desktopOnly: true }
]
const links = computed(() => allLinks.filter((l) => l.href !== '#fitur' || props.product.features?.length))
const activeTab = ref('#deskripsi')

const rawDesc = computed(() => {
  const d = props.product.description
  if (Array.isArray(d)) return d.join('\n')
  return typeof d === 'string' ? d : ''
})
const isHtmlDesc = computed(() => /<[a-z][\s\S]*>/i.test(rawDesc.value))
const safeHtmlDesc = computed(() => (isHtmlDesc.value ? sanitizeHtml(rawDesc.value) : ''))

function selectTab(href) {
  activeTab.value = href
}

let observer = null
onMounted(() => {
  if (window.location.hash && links.value.some((l) => l.href === window.location.hash)) {
    activeTab.value = window.location.hash
  }
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target?.id) activeTab.value = `#${visible[0].target.id}`
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 })
    for (const l of links.value) {
      const el = document.querySelector(l.href)
      if (el) observer.observe(el)
    }
  }
})
onBeforeUnmount(() => observer?.disconnect())

const h2 = 'tw:m-0 tw:font-display tw:text-[22px] tw:font-bold tw:text-ink'
</script>

<template>
  <div class="tw:contents">
    <nav aria-label="Isi halaman" class="tw:mt-9 tw:flex tw:flex-wrap tw:gap-1 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:font-sans tw:text-sm tw:font-semibold tw:max-lg:mt-4 tw:max-lg:gap-4 tw:max-lg:text-[13.5px]">
      <a
        v-for="l in links"
        :key="l.href"
        :href="l.href"
        :aria-current="activeTab === l.href ? 'true' : undefined"
        class="tw:cursor-pointer tw:px-3.5 tw:py-3.5 tw:no-underline tw:transition-colors tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none tw:max-lg:px-0 tw:max-lg:py-2.5"
        :class="[activeTab === l.href ? 'tw:-mb-px tw:border-0 tw:border-b-2 tw:border-solid tw:border-ink tw:text-ink' : 'tw:text-ink-2', l.desktopOnly ? 'tw:max-lg:hidden' : '']"
        @click="selectTab(l.href)"
      >{{ l.short ? '' : l.label }}<template v-if="l.short"><span class="tw:max-lg:hidden">{{ l.label }}</span><span class="tw:lg:hidden">{{ l.short }}</span></template></a>
    </nav>

    <div class="tw:mt-7 tw:flex tw:flex-wrap tw:items-start tw:gap-7">
    <div class="tw:flex tw:min-w-0 tw:flex-[999_1_620px] tw:flex-col tw:gap-9 tw:max-lg:w-full tw:max-lg:flex-none">
      <section id="deskripsi" aria-labelledby="h-desk">
        <h2 id="h-desk" class="tw:mb-3" :class="h2">Deskripsi</h2>
        <div
          v-if="isHtmlDesc"
          class="product-prose tw:font-sans tw:text-[15px] tw:leading-[1.75] tw:font-normal tw:text-[#33332f]"
          v-html="safeHtmlDesc"
        />
        <template v-else>
          <p
            v-for="(para, i) in product.description"
            :key="i"
            class="tw:m-0 tw:font-sans tw:text-[15px] tw:leading-[1.75] tw:font-normal tw:text-[#33332f]"
            :class="i > 0 ? 'tw:mt-3' : ''"
          >{{ para }}</p>
        </template>
      </section>

      <section v-if="product.features?.length" id="fitur" aria-labelledby="h-fitur">
        <h2 id="h-fitur" class="tw:mb-3.5" :class="h2">Fitur utama</h2>
        <ul class="tw:m-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-3 tw:p-0">
          <li v-for="f in product.features" :key="f" class="tw:flex tw:gap-3 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px] tw:py-4 tw:font-sans tw:text-sm tw:leading-[1.55] tw:font-normal tw:text-ink">
            <span aria-hidden="true" class="tw:grid tw:size-7 tw:flex-none tw:place-items-center tw:rounded-lg tw:bg-[#e8f8ee]"><Icon name="material-symbols:check" class="tw:size-4 tw:text-[#16a34a]" aria-hidden="true" /></span>{{ f }}
          </li>
        </ul>
      </section>

      <section id="detail" aria-labelledby="h-detail">
        <h2 id="h-detail" class="tw:mb-3" :class="h2">Detail &amp; lisensi</h2>
        <dl class="tw:m-0 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-5 tw:py-1 tw:font-sans tw:text-sm tw:font-normal">
          <div v-for="d in product.details" :key="d.k" class="tw:grid tw:grid-cols-[170px_1fr] tw:gap-4 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:py-[13px] tw:max-lg:grid-cols-[120px_1fr]">
            <dt class="tw:text-muted">{{ d.k }}</dt>
            <dd class="tw:m-0 tw:font-semibold">{{ d.v }}</dd>
          </div>
        </dl>
      </section>

      <section id="ulasan" aria-labelledby="h-ulasan">
        <h2 id="h-ulasan" class="tw:mb-3" :class="h2">Ulasan</h2>
        <ul v-if="product.reviews?.length" class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
          <ProductReviewItem v-for="r in product.reviews" :key="r.id" :review="r" />
        </ul>
        <div v-else class="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:rounded-[14px] tw:border tw:border-dashed tw:border-[#d6d6cf] tw:bg-surface tw:p-7 tw:text-center">
          <Icon name="material-symbols:star" class="tw:size-[26px] tw:text-[#b45309]" aria-hidden="true" />
          <span class="tw:font-sans tw:text-[15px] tw:font-bold">Belum ada ulasan</span>
          <span class="tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-ink-2">Pembeli produk ini bisa memberi ulasan dari halaman Pesanan Saya.</span>
        </div>
      </section>
    </div>
    <slot name="aside" />
    </div>
  </div>
</template>

<style scoped>
.product-prose :deep(p) {
  margin: 0 0 0.85rem;
}
.product-prose :deep(p:last-child) {
  margin-bottom: 0;
}
.product-prose :deep(h2),
.product-prose :deep(h3),
.product-prose :deep(h4) {
  margin: 1.4rem 0 0.6rem;
  font-weight: 700;
  color: #141413;
  line-height: 1.35;
}
.product-prose :deep(h2) { font-size: 1.2rem; }
.product-prose :deep(h3) { font-size: 1.05rem; }
.product-prose :deep(ul),
.product-prose :deep(ol) {
  margin: 0.5rem 0 1rem;
  padding-left: 1.35rem;
}
.product-prose :deep(li) {
  margin-bottom: 0.35rem;
}
.product-prose :deep(strong),
.product-prose :deep(b) {
  font-weight: 600;
  color: #141413;
}
.product-prose :deep(code) {
  background: #f3f3ef;
  padding: 0.1rem 0.35rem;
  border-radius: 5px;
  font-size: 0.9em;
}
.product-prose :deep(a) {
  color: #1472ff;
  text-decoration: underline;
}
</style>
