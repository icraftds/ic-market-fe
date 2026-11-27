<script setup>
/** SellerDetailReviews: tab Ulasan (ringkasan rating + ulasan produk; balasan publik lewat useSellerStore.replyReview). */
import { ref } from 'vue'

const props = defineProps({
  productId: { type: Number, required: true }
})
const seller = useSellerStore()
const ui = useUiStore()
const reviews = computed(() => seller.reviewsOf(props.productId))
const drafts = ref({})

const avg = computed(() => (reviews.value.length ? reviews.value.reduce((a, r) => a + r.rating, 0) / reviews.value.length : 0))
const avgText = computed(() => (Math.round(avg.value * 10) / 10).toString().replace('.', ','))
const avgStars = computed(() => {
  const full = Math.floor(avg.value)
  const half = avg.value - full >= 0.25 && avg.value - full < 0.75
  const round = avg.value - full >= 0.75 ? 1 : 0
  return '★'.repeat(full + round) + (half ? '½' : '')
})

function reply(r) {
  const ok = seller.replyReview(r.id, drafts.value[r.id])
  if (ok) {
    delete drafts.value[r.id]
    ui.push({ tone: 'success', message: 'Balasan terkirim.' })
  } else ui.push({ tone: 'warn', message: 'Tulis balasan terlebih dahulu.' })
}
</script>

<template>
  <UiEmptyState v-if="!reviews.length" icon="material-symbols:star-outline" title="Belum ada ulasan" text="Ulasan pembeli untuk produk ini akan muncul di sini." />
  <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
    <div class="tw:flex-[1_1_220px] tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
      <div class="tw:font-display tw:text-4xl tw:font-extrabold">{{ avgText }}</div>
      <div class="tw:tracking-[2px] tw:text-amber-700" aria-hidden="true">{{ avgStars }}</div>
      <div class="tw:mt-1 tw:font-sans tw:text-[13px] tw:font-medium tw:text-panel-ink">dari {{ reviews.length }} ulasan</div>
    </div>
    <div class="tw:flex tw:min-w-0 tw:flex-[3_1_460px] tw:flex-col tw:gap-3">
      <article v-for="r in reviews" :key="r.id" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
        <div class="tw:flex tw:flex-wrap tw:justify-between tw:gap-2.5">
          <span class="tw:font-sans tw:text-sm tw:font-bold">{{ r.name }} <span class="tw:text-amber-700" role="img" :aria-label="`${r.rating} dari 5 bintang`">{{ r.stars }}</span></span>
          <span v-if="r.needsReply" class="tw:rounded-full tw:bg-amber-100 tw:px-2.5 tw:py-1 tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-amber-800">Belum dibalas</span>
        </div>
        <p class="tw:m-0 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal">{{ r.text }}</p>
        <form v-if="r.needsReply" class="tw:flex tw:gap-2" @submit.prevent="reply(r)">
          <label class="tw:flex tw:flex-1">
            <span class="tw:sr-only">Balasan</span>
            <input
              v-model="drafts[r.id]"
              type="text"
              placeholder="Tulis balasan publik…"
              class="tw:m-0 tw:min-h-[42px] tw:min-w-0 tw:flex-1 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-hero tw:placeholder:text-muted tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
            >
          </label>
          <button
            type="submit"
            class="tw:m-0 tw:inline-flex tw:min-h-[42px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-4 tw:font-sans tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
          ><Icon name="material-symbols:reply" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Balas</button>
        </form>
        <div v-else class="tw:rounded-r-[10px] tw:border-0 tw:border-l-[3px] tw:border-solid tw:border-seller tw:bg-slate-50 tw:px-3 tw:py-2.5 tw:font-sans tw:text-[13.5px] tw:leading-[1.55] tw:font-normal">
          <b>{{ seller.profile.name }}:</b> {{ r.reply }}
        </div>
      </article>
    </div>
  </div>
</template>
