<script setup>
/** CenterReviews: tab Ulasan papan V2SellerCenter (kartu ulasan + balasan publik). */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const drafts = reactive({})
const editing = reactive({})
const busy = reactive({})
const st = computed(() => seller.loadState.reviews)
const first = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !st.value.loading && st.value.error && !seller.reviewRows.length)
const replyError = computed(() => Object.values(seller.errors.reply || {})[0] || '')
const errorId = ref(null)

if (api) seller.ensure('reviews')
const retry = () => seller.loadReviews({}, { force: true })
const page = computed({ get: () => st.value.meta?.page || 1, set: (v) => seller.loadReviews({ page: v }) })
const pageSize = computed({ get: () => seller.queries.reviews.limit, set: (v) => seller.loadReviews({ page: 1, limit: v }) })

function startEdit(r) {
  drafts[r.id] = r.reply
  editing[r.id] = true
}
async function reply(r) {
  errorId.value = r.id
  if (!api) {
    if (seller.replyReview(r.id, drafts[r.id])) {
      delete drafts[r.id]
      ui.push({ tone: 'success', message: `Balasan untuk ${r.name} terkirim.` })
    } else {
      ui.push({ tone: 'warn', message: 'Tulis balasan terlebih dahulu.' })
    }
    return
  }
  if (!String(drafts[r.id] || '').trim()) { ui.push({ tone: 'warn', message: 'Tulis balasan terlebih dahulu.' }); return }
  busy[r.id] = true
  const ok = await seller.replyReview(r.id, drafts[r.id])
  busy[r.id] = false
  if (ok) { delete drafts[r.id]; delete editing[r.id] }
}
</script>

<template>
  <div v-if="first" class="tw:flex tw:flex-col tw:gap-3"><UiSkeleton v-for="n in 3" :key="n" height-class="tw:h-32" /></div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <div v-else-if="api && st.loaded && !seller.reviewRows.length" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-6 tw:py-10 tw:text-center tw:font-sans tw:text-[14px] tw:font-medium tw:text-panel-ink">Belum ada ulasan untuk produk toko ini.</div>
  <div v-else class="tw:flex tw:flex-col tw:gap-3">
    <article v-for="r in seller.reviewRows" :key="r.id" class="tw:flex tw:flex-col tw:gap-[10px] tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
      <div class="tw:flex tw:flex-wrap tw:justify-between tw:gap-3">
        <span class="tw:flex tw:flex-col tw:gap-0.5">
          <span class="tw:font-sans tw:text-[14px] tw:font-bold">{{ r.name }} <span class="tw:tracking-[1px] tw:text-[#b45309]" :aria-label="`${r.rating} dari 5 bintang`">{{ r.stars }}</span></span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ r.product }} · {{ r.date }}</span>
        </span>
        <span v-if="r.needsReply" class="tw:self-start tw:rounded-full tw:bg-[#fff4d6] tw:px-[10px] tw:py-1 tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-[#8a5a00]">Belum dibalas</span>
      </div>
      <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:leading-[1.6] tw:font-normal">{{ r.text }}</p>
      <form v-if="r.needsReply || editing[r.id]" class="tw:flex tw:gap-2" @submit.prevent="reply(r)">
        <label class="tw:flex tw:flex-1">
          <span class="tw:sr-only">Balas ulasan</span>
          <input v-model="drafts[r.id]" type="text" placeholder="Tulis balasan publik…" :aria-invalid="errorId === r.id && !!replyError" class="tw:m-0 tw:min-h-[42px] tw:min-w-0 tw:flex-1 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-hero tw:outline-none tw:focus:border-seller tw:focus:ring-[3px] tw:focus:ring-seller/20">
        </label>
        <button type="submit" :disabled="busy[r.id]" class="tw:m-0 tw:inline-flex tw:min-h-[42px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-4 tw:font-sans tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-60"><Icon name="material-symbols:reply" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ editing[r.id] ? 'Simpan' : 'Balas' }}</button>
      </form>
      <p v-if="(r.needsReply || editing[r.id]) && errorId === r.id && replyError" role="alert" class="tw:m-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-bad">{{ replyError }}</p>
      <div v-if="!r.needsReply && !editing[r.id] && r.reply" class="tw:rounded-[10px] tw:bg-[#f8fafc] tw:px-3 tw:py-2.5 tw:font-sans tw:text-[13px] tw:text-panel-ink"><strong class="tw:font-semibold tw:text-hero">Balasan toko:</strong> {{ r.reply }}<button v-if="api && !r.auto" type="button" class="tw:m-0 tw:ml-2 tw:cursor-pointer tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-seller tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="startEdit(r)">Ubah</button></div>
    </article>
    <UiTablePager v-if="api && (st.meta?.total || 0) > 0" v-model:page="page" v-model:page-size="pageSize" :total="st.meta.total" noun="ulasan" label="Paginasi ulasan" />
  </div>
</template>
