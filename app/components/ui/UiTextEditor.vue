<script setup>
/**
 * UiTextEditor: editor teks kaya berbasis TipTap (tebal, miring, judul, daftar, kutipan, tautan, undo/redo).
 *
 *   <UiTextEditor v-model="form.description" label="Deskripsi" placeholder="Ceritakan produk Anda…" />
 *
 * v-model berisi HTML ('' saat kosong).
 * PENTING: HTML dari pengguna WAJIB disanitasi sebelum dirender dengan v-html (mis. DOMPurify) dan
 * divalidasi ulang di backend. Editor ini hanya membatasi skema, bukan pengganti sanitasi.
 */
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: 'Tulis di sini…' },
  disabled: { type: Boolean, default: false },
  minHeight: { type: String, default: '10rem' }
})
const emit = defineEmits(['update:modelValue'])

const id = useId()
// Buang paragraf kosong di ujung (TipTap menyisipkannya setelah daftar/blok) supaya tidak ikut tersimpan.
const cleanHtml = e => (e.isEmpty ? '' : e.getHTML().replace(/(<p><\/p>|<p>\s*<br\s*\/?>\s*<\/p>)+$/g, ''))
const linkOpen = ref(false)
const linkUrl = ref('')
const linkInput = ref(null)

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  immediatelyRender: false,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      code: false,
      horizontalRule: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto'], HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }
    }),
    Placeholder.configure({ placeholder: props.placeholder })
  ],
  editorProps: { attributes: { id, role: 'textbox', 'aria-multiline': 'true', 'aria-label': props.label || 'Editor teks' } },
  onUpdate: ({ editor: e }) => emit('update:modelValue', cleanHtml(e))
})

watch(() => props.modelValue, (value) => {
  const e = editor.value
  if (e && value !== cleanHtml(e)) e.commands.setContent(value || '', { emitUpdate: false })
})
watch(() => props.disabled, value => editor.value?.setEditable(!value))
onBeforeUnmount(() => editor.value?.destroy())

const run = chain => editor.value && chain(editor.value.chain().focus()).run()
const active = (name, attrs) => Boolean(editor.value?.isActive(name, attrs))

const openLink = () => {
  linkUrl.value = editor.value?.getAttributes('link').href || ''
  linkOpen.value = true
  setTimeout(() => linkInput.value?.focus(), 0)
}
const applyLink = () => {
  const url = linkUrl.value.trim()
  if (!url) run(c => c.unsetLink())
  else if (/^(https?:\/\/|mailto:)/i.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url)) run(c => c.setLink({ href: url }))
  linkOpen.value = false
}
const removeLink = () => { run(c => c.unsetLink()); linkOpen.value = false }

const tools = computed(() => [
  { key: 'bold', label: 'Tebal', text: 'B', cls: 'tw:font-extrabold', on: () => active('bold'), do: () => run(c => c.toggleBold()) },
  { key: 'italic', label: 'Miring', text: 'I', cls: 'tw:italic tw:font-serif', on: () => active('italic'), do: () => run(c => c.toggleItalic()) },
  { key: 'underline', label: 'Garis bawah', text: 'U', cls: 'tw:underline', on: () => active('underline'), do: () => run(c => c.toggleUnderline()) },
  { key: 'strike', label: 'Coret', text: 'S', cls: 'tw:line-through', on: () => active('strike'), do: () => run(c => c.toggleStrike()) },
  { sep: true, key: 's1' },
  { key: 'h2', label: 'Judul 2', text: 'H2', cls: 'tw:text-[11px] tw:font-extrabold', on: () => active('heading', { level: 2 }), do: () => run(c => c.toggleHeading({ level: 2 })) },
  { key: 'h3', label: 'Judul 3', text: 'H3', cls: 'tw:text-[11px] tw:font-extrabold', on: () => active('heading', { level: 3 }), do: () => run(c => c.toggleHeading({ level: 3 })) },
  { sep: true, key: 's2' },
  { key: 'ul', label: 'Daftar poin', icon: 'M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01', on: () => active('bulletList'), do: () => run(c => c.toggleBulletList()) },
  { key: 'ol', label: 'Daftar angka', icon: 'M8 5h9M8 10h9M8 15h9M3 4l1-.5V7M3 12h2l-2 3h2', on: () => active('orderedList'), do: () => run(c => c.toggleOrderedList()) },
  { key: 'quote', label: 'Kutipan', icon: 'M4 6h5v5H6.5c0 1.5.5 2.5 2.5 3M12 6h5v5h-2.5c0 1.5.5 2.5 2.5 3', on: () => active('blockquote'), do: () => run(c => c.toggleBlockquote()) },
  { key: 'link', label: 'Tautan', icon: 'M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.9.9M11.5 8.5a3 3 0 0 0-4.2 0L4.7 11.1a3 3 0 0 0 4.2 4.2l.9-.9', on: () => active('link'), do: openLink },
  { sep: true, key: 's3' },
  { key: 'undo', label: 'Urungkan', icon: 'M7 6 3.5 9.5 7 13M4 9.5h8a4 4 0 0 1 0 8h-1', can: () => editor.value?.can().undo(), do: () => run(c => c.undo()) },
  { key: 'redo', label: 'Ulangi', icon: 'M13 6l3.5 3.5L13 13M16 9.5H8a4 4 0 0 0 0 8h1', can: () => editor.value?.can().redo(), do: () => run(c => c.redo()) }
])
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-1.5">
    <label v-if="label" :for="id" class="tw:text-[12.5px] tw:font-bold tw:text-slate-700" @click.prevent="editor?.commands.focus()">{{ label }}</label>

    <div
      class="tw:rounded-field tw:border tw:bg-white tw:transition focus-within:tw:ring-4"
      :class="[
        error ? 'tw:border-red-500 focus-within:tw:border-red-500 focus-within:tw:ring-red-500/15' : 'tw:border-line focus-within:tw:border-brand focus-within:tw:ring-brand/15',
        disabled ? 'tw:bg-slate-50 tw:opacity-70' : ''
      ]"
    >
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-0.5 tw:border-b tw:border-slate-100 tw:p-1.5" role="toolbar" aria-label="Format teks">
        <template v-for="tool in tools" :key="tool.key">
          <span v-if="tool.sep" class="tw:mx-1 tw:h-5 tw:w-px tw:bg-slate-200" aria-hidden="true" />
          <button
            v-else
            type="button"
            :title="tool.label"
            :aria-label="tool.label"
            :aria-pressed="tool.on ? tool.on() : undefined"
            :disabled="disabled || (tool.can && !tool.can())"
            class="tw:grid tw:size-8 tw:cursor-pointer tw:place-items-center tw:rounded-md tw:border-0 tw:text-[13px] tw:text-slate-600 tw:transition tw:hover:bg-slate-100 tw:hover:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-blue-500/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-35 tw:disabled:hover:bg-transparent"
            :class="tool.on && tool.on() ? 'tw:bg-blue-50 tw:text-brand' : 'tw:bg-transparent'"
            @mousedown.prevent
            @click="tool.do()"
          >
            <span v-if="tool.text" :class="tool.cls">{{ tool.text }}</span>
            <svg v-else viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path :d="tool.icon" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </template>
      </div>

      <form v-if="linkOpen" class="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:bg-slate-50 tw:p-2" @submit.prevent="applyLink" @keydown.esc="linkOpen = false">
        <input ref="linkInput" v-model="linkUrl" type="text" inputmode="url" placeholder="https://contoh.com" aria-label="Alamat tautan" class="tw:min-w-0 tw:flex-1 tw:rounded-lg tw:border tw:border-line tw:bg-white tw:px-3 tw:py-1.5 tw:text-sm tw:outline-none tw:focus:border-brand tw:focus:ring-2 tw:focus:ring-brand/20">
        <UiButton size="sm" type="submit">Terapkan</UiButton>
        <UiButton v-if="active('link')" size="sm" variant="danger-soft" @click="removeLink">Hapus</UiButton>
        <UiButton size="sm" variant="ghost" @click="linkOpen = false">Batal</UiButton>
      </form>

      <ClientOnly>
        <EditorContent :editor="editor" class="ui-editor" :style="{ '--ui-editor-min': minHeight }" />
        <template #fallback><div class="tw:p-3 tw:text-sm tw:text-slate-400" :style="{ minHeight }">Memuat editor…</div></template>
      </ClientOnly>
    </div>

    <p v-if="error || hint" class="tw:m-0 tw:text-[11.5px] tw:font-medium" :class="error ? 'tw:text-red-600' : 'tw:text-muted'">{{ error || hint }}</p>
  </div>
</template>

<style scoped>
.ui-editor :deep(.tiptap) { min-height: var(--ui-editor-min, 10rem); padding: 12px 14px; outline: none; font-size: 14px; line-height: 1.65; color: #0f172a; }
.ui-editor :deep(.tiptap > * + *) { margin-top: .6em; }
.ui-editor :deep(.tiptap p) { margin: 0; }
.ui-editor :deep(.tiptap h2) { margin: 1em 0 0; font-size: 1.25rem; font-weight: 800; line-height: 1.3; }
.ui-editor :deep(.tiptap h3) { margin: 1em 0 0; font-size: 1.05rem; font-weight: 700; line-height: 1.35; }
.ui-editor :deep(.tiptap ul), .ui-editor :deep(.tiptap ol) { margin: 0; padding-left: 1.4em; }
.ui-editor :deep(.tiptap ul) { list-style: disc; }
.ui-editor :deep(.tiptap ol) { list-style: decimal; }
.ui-editor :deep(.tiptap li p) { display: inline; }
.ui-editor :deep(.tiptap blockquote) { margin-left: 0; padding: 2px 0 2px 14px; border-left: 3px solid #cbd5e1; color: #475569; }
.ui-editor :deep(.tiptap a) { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
.ui-editor :deep(.tiptap p.is-editor-empty:first-child::before) { content: attr(data-placeholder); float: left; height: 0; color: #94a3b8; pointer-events: none; }
</style>
