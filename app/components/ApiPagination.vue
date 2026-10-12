<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({})
  },
  busy: {
    type: Boolean,
    default: false
  }
})

defineEmits(['page'])

const currentPage = computed(() => Number(props.meta?.current_page || 1))
const lastPage = computed(() => Number(props.meta?.last_page || 1))
const total = computed(() => props.meta?.total != null ? Number(props.meta.total) : null)
</script>

<template>
  <nav 
    v-if="meta && lastPage > 1" 
    class="api-pagination-container" 
    aria-label="Navigasi Halaman Data"
  >
    <button 
      type="button"
      class="pagination-btn prev-btn"
      :disabled="busy || currentPage <= 1" 
      @click="$emit('page', currentPage - 1)"
      aria-label="Halaman Sebelumnya"
    >
      <i class="fa-solid fa-chevron-left"></i>
      <span>Sebelumnya</span>
    </button>

    <div class="pagination-info">
      <span class="page-numbers">
        <strong class="current-page">{{ currentPage }}</strong>
        <span class="page-divider">/</span>
        <span class="total-pages">{{ lastPage }}</span>
      </span>
      <span v-if="total !== null" class="data-count">
        · {{ total.toLocaleString('id-ID') }} data
      </span>
    </div>

    <button 
      type="button"
      class="pagination-btn next-btn"
      :disabled="busy || currentPage >= lastPage" 
      @click="$emit('page', currentPage + 1)"
      aria-label="Halaman Berikutnya"
    >
      <span>Berikutnya</span>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </nav>
</template>

<style scoped>
.api-pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 32px 0 20px;
  flex-wrap: wrap;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.pagination-btn i {
  font-size: 0.75rem;
  color: var(--accent-2);
  transition: transform 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--accent-2);
  color: var(--accent-2);
  background: rgba(99, 102, 241, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.16);
}

.pagination-btn.prev-btn:hover:not(:disabled) i {
  transform: translateX(-2px);
}

.pagination-btn.next-btn:hover:not(:disabled) i {
  transform: translateX(2px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border);
  background: var(--surface);
  color: var(--muted);
  box-shadow: none;
  transform: none;
}
.pagination-btn:disabled i {
  color: var(--muted);
}

.pagination-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.85rem;
  color: var(--muted);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.page-numbers {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}

.current-page {
  color: var(--accent-2);
  font-weight: 800;
}

.page-divider {
  color: var(--muted);
  opacity: 0.6;
}

.total-pages {
  color: var(--text);
  font-weight: 700;
}

.data-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  color: var(--muted);
}

@media (max-width: 480px) {
  .api-pagination-container {
    gap: 8px;
  }
  .pagination-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  .pagination-info {
    padding: 7px 12px;
    font-size: 0.8rem;
  }
}
</style>
