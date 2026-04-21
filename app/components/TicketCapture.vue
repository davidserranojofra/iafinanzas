<script setup lang="ts">
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const preview = ref<string | null>(null)
const result = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  preview.value = URL.createObjectURL(file)
  result.value = null
  error.value = null
}

async function processTicket() {
  const file = fileInput.value?.files?.[0]
  if (!file) return

  loading.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('image', file)

    result.value = await $fetch('/api/process-ticket', {
      method: 'POST',
      body: formData,
    })
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error procesando el ticket'
  }
  finally {
    loading.value = false
  }
}

function reset() {
  preview.value = null
  result.value = null
  error.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div>
    <h2>Nuevo ticket</h2>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onFileChange"
    >

    <div v-if="preview">
      <img :src="preview" alt="Vista previa del ticket">
      <div>
        <button :disabled="loading" @click="processTicket">
          {{ loading ? 'Procesando...' : 'Procesar ticket' }}
        </button>
        <button @click="reset">Cancelar</button>
      </div>
    </div>

    <p v-if="error">{{ error }}</p>

    <dl v-if="result">
      <dt>Comercio</dt>
      <dd>{{ result.comercio ?? '—' }}</dd>

      <dt>Fecha</dt>
      <dd>{{ result.fecha ?? '—' }}</dd>

      <dt>Total</dt>
      <dd>{{ result.total != null ? `${result.total} €` : '—' }}</dd>

      <dt>Categoría</dt>
      <dd>{{ result.categoria ?? '—' }}</dd>

      <dt>Método de pago</dt>
      <dd>{{ result.metodo_pago ?? '—' }}</dd>

      <dt>Notas</dt>
      <dd>{{ result.notas ?? '—' }}</dd>
    </dl>
  </div>
</template>
