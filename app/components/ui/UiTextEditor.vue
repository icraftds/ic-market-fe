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
  { key: 'ul', label: 'Daftar poin', icon: 'material-symbols:format-list-bulleted', on: () => active('bulletList'), do: () => run(c => c.toggleBulletList()) },
  { key: 'ol', label: 'Daftar angka', icon: 'material-symbols:format-list-numbered', on: () => active('orderedList'), do: () => run(c => c.toggleOrderedList()) },
  { key: 'quote', label: 'Kutipan', icon: 'material-symbols:format-quote', on: () => active('blockquote'), do: () => run(c => c.toggleBlockquote()) },
  { key: 'link', label: 'Tautan', icon: 'material-symbols:link', on: () => active('link'), do: openLink },
  { sep: true, key: 's3' },
  { key: 'undo', label: 'Urungkan', icon: 'material-symbols:undo', can: () => editor.value?.can().undo(), do: () => run(c => c.undo()) },
  { key: 'redo', label: 'Ulangi', icon: 'material-symbols:redo', can: () => editor.value?.can().redo(), do: () => run(c => c.redo()) }
])
const editorAttrs = computed(() => ({ style: { '--ui-editor-min': props.minHeight } }))
const fallbackAttrs = computed(() => ({ style: { minHeight: props.minHeight } }))
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
            <Icon v-else :name="tool.icon" class="tw:size-[18px]" aria-hidden="true" />
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
        <EditorContent :editor="editor" class="ui-editor" v-bind="editorAttrs" />
        <template #fallback><div class="tw:p-3 tw:text-sm tw:text-slate-400" v-bind="fallbackAttrs">Memuat editor…</div></template>
      </ClientOnly>
    </div>

    <p v-if="error || hint" class="tw:m-0 tw:text-[11.5px] tw:font-medium" :class="error ? 'tw:text-red-600' : 'tw:text-muted'">{{ error || hint }}</p>
  </div>
</template>

