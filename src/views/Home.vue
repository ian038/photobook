<template>
  <div class="home">
    <Login />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Login from '@/components/Login.vue'

export default defineComponent({
  name: 'Home',
  components: {
    Login
  }
})
</script>
