import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/main.css'
import App from './App.vue'
import { setUnauthenticatedHandler } from './api/client'
import { initTheme } from './composables/useTheme'
import router from './router'
import { useAuthStore } from './stores/auth'

initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Lejárt session: kijelentkeztetés, és védett oldalról átirányítás a bejelentkezésre.
setUnauthenticatedHandler(() => {
  useAuthStore().clear()
  const current = router.currentRoute.value
  if (current.meta.requiresAuth) {
    void router.push({ name: 'login', query: { redirect: current.fullPath } })
  }
})

app.mount('#app')
