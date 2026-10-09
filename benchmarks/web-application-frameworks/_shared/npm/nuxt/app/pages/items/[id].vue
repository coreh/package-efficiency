<script setup lang="ts">
const route = useRoute()
const item = getItem(Number(route.params.id))
useHead({ title: item.name })
</script>

<template>
  <main id="bench" :data-item="item.id">
    <h1>{{ item.name }}</h1>
    <p class="price">{{ price(item.priceCents) }}</p>
    <p v-if="item.inStock" class="stock">In stock</p>
    <p v-else class="stock out">Sold out</p>
    <p v-if="item.discountPercent" class="discount">Save {{ item.discountPercent }}%</p>
    <p class="note">{{ item.note }}</p>
    <ul class="tags"><li v-for="tag in item.tags" :key="tag">{{ tag }}</li></ul>
    <table class="related">
      <thead><tr><th>Item</th><th>Price</th></tr></thead>
      <tbody><tr v-for="related in item.related" :key="related.id"><td><a :href="`/items/${related.id}`">{{ related.name }}</a></td><td>{{ price(related.priceCents) }}</td></tr></tbody>
    </table>
    <footer hidden>rendered</footer>
  </main>
</template>
