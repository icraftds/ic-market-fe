<script setup>
/** CenterReviews: tab Ulasan papan V2SellerCenter (kartu ulasan + balasan publik). */
const seller = useSellerStore()
const ui = useUiStore()
const drafts = reactive({})

function reply(r) {
  if (seller.replyReview(r.id, drafts[r.id])) {
    delete drafts[r.id]
    ui.push({ tone: 'success', message: `Balasan untuk ${r.name} terkirim.` })
  } else {
    ui.push({ tone: 'warn', message: 'Tulis balasan terlebih dahulu.' })
  }
}
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-3">
    <article v-for="r in seller.reviewRows" :key="r.id" class="tw:flex tw:flex-col tw:gap-[10px] tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
      <div class="tw:flex tw:flex-wrap tw:justify-between tw:gap-3">
        <span class="tw:flex tw:flex-col tw:gap-0.5">
          <span class="tw:font-sans tw:text-[14px] tw:font-bold">{{ r.name }} <span class="tw:tracking-[1px] tw:text-[#b45309]" :aria-label="`${r.rating} dari 5 bintang`">{{ r.stars }}</span></span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ r.product }} · {{ r.date }}</span>
        </span>
        <span v-if="r.needsReply" class="tw:self-start tw:rounded-full tw:bg-[#fff4d6] tw:px-[10px] tw:py-1 tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-[#8a5a00]">Belum dibalas</span>
      </div>
      <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:leading-[1.6] tw:font-normal">{{ r.text }}</p>
      <form v-if="r.needsReply" class="tw:flex tw:gap-2" @submit.prevent="reply(r)">
        <label class="tw:flex tw:flex-1">
          <span class="tw:sr-only">Balas ulasan</span>
          <input v-model="drafts[r.id]" type="text" placeholder="Tulis balasan publik…" class="tw:m-0 tw:min-h-[42px] tw:min-w-0 tw:flex-1 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-hero tw:outline-none tw:focus:border-seller tw:focus:ring-[3px] tw:focus:ring-seller/20">
        </label>
        <button type="submit" class="tw:m-0 tw:inline-flex tw:min-h-[42px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-4 tw:font-sans tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"><Icon name="material-symbols:reply" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Balas</button>
      </form>
      <div v-else-if="r.reply" class="tw:rounded-[10px] tw:bg-[#f8fafc] tw:px-3 tw:py-2.5 tw:font-sans tw:text-[13px] tw:text-panel-ink"><strong class="tw:font-semibold tw:text-hero">Balasan toko:</strong> {{ r.reply }}</div>
    </article>
  </div>
</template>
