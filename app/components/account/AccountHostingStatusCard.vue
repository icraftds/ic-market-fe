<script setup>
/** Kartu status situs gelap (V2HostingDash): status, nama situs, stack, tombol unggah / buka situs. */
import { dotClass, tabPath } from './classMaps'
import { safeUrl } from '~/utils/safeUrl.js'
const hosting = useHostingStore()

const liveHref = computed(() => {
  if (hosting.isMock) return '#'
  const host = hosting.siteName
  if (!host) return '#'
  return safeUrl(/^https?:\/\//i.test(host) ? host : `https://${host}`) || '#'
})
</script>

<template>
  <section class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-[18px] tw:rounded-[20px] tw:bg-ink tw:px-6 tw:py-[22px] tw:text-white">
    <div class="tw:flex tw:flex-col tw:gap-1.5">
      <span class="tw:flex tw:items-center tw:gap-2 tw:text-[12.5px] tw:font-semibold" :class="hosting.live ? 'tw:text-[#86efac]' : 'tw:text-[#fcd34d]'">
        <span aria-hidden="true" class="tw:size-2 tw:rounded-full" :class="dotClass(hosting.live, hosting.configured)" />{{ hosting.statusText }}
      </span>
      <span class="tw:font-mono tw:text-[26px] tw:font-extrabold tw:tracking-[-0.01em]">{{ hosting.siteName }}</span>
      <span class="tw:text-[13px] tw:font-medium tw:text-[#cbd5e1]">{{ hosting.stackName || 'Stack belum dipilih' }} · VPS · SSL aktif</span>
    </div>
    <UiButton
      v-if="!hosting.live"
      :to="tabPath('files')"
      variant="brand"
      size="lg"
      :icon="hosting.fileUploaded ? 'material-symbols:rocket-launch-outline' : 'material-symbols:upload-file-outline'"
      class="tw:rounded-[12px]! tw:px-5!"
    >{{ hosting.fileUploaded ? 'Deploy sekarang' : 'Unggah file project' }}</UiButton>
    <UiButton
      v-else
      :href="liveHref"
      :target="hosting.isMock ? undefined : '_blank'"
      :rel="hosting.isMock ? undefined : 'noopener noreferrer'"
      variant="outline"
      size="lg"
      icon-right="material-symbols:open-in-new"
      class="tw:rounded-[12px]! tw:border-white! tw:px-5!"
    >Buka situs</UiButton>
  </section>
</template>
