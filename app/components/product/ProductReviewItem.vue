<script setup>
/** ProductReviewItem: satu ulasan (produk atau toko). Props: review { rating, comment, user, productName, productSlug, createdAt }. */
import { dateId } from '~/utils/format'

const props = defineProps({
  review: { type: Object, required: true },
  showProduct: { type: Boolean, default: false }
})
const date = computed(() => (props.review.createdAt ? dateId(props.review.createdAt) : ''))
</script>

<template>
  <li class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px] tw:py-4">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
      <span class="tw:flex tw:items-center tw:gap-2.5">
        <span aria-hidden="true" class="tw:grid tw:size-8 tw:place-items-center tw:rounded-full tw:bg-ink tw:font-sans tw:text-[13px] tw:font-bold tw:text-white">{{ review.user.charAt(0).toUpperCase() }}</span>
        <span class="tw:font-sans tw:text-sm tw:font-bold tw:text-ink">{{ review.user }}</span>
      </span>
      <span class="tw:flex tw:items-center tw:gap-2.5">
        <span role="img" :aria-label="`Rating ${review.rating} dari 5`" class="tw:inline-flex tw:gap-0.5">
          <Icon v-for="n in 5" :key="n" name="material-symbols:star" class="tw:size-4" :class="n <= review.rating ? 'tw:text-[#b45309]' : 'tw:text-line'" aria-hidden="true" />
        </span>
        <time v-if="date" :datetime="review.createdAt" class="tw:font-sans tw:text-xs tw:font-medium tw:text-muted">{{ date }}</time>
      </span>
    </div>
    <NuxtLink v-if="showProduct && review.productSlug" :to="`/product/${review.productSlug}`" class="tw:w-fit tw:font-sans tw:text-[13px] tw:font-semibold tw:text-brand tw:no-underline tw:hover:underline">{{ review.productName }}</NuxtLink>
    <p v-if="review.comment" class="tw:m-0 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-[#33332f]">{{ review.comment }}</p>
  </li>
</template>
