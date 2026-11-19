import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import PageEditorView from '@/views/PageEditorView.vue'
import PageFormView from '@/views/PageFormView.vue'
import RegisterView from '@/views/RegisterView.vue'
import WebsiteFormView from '@/views/WebsiteFormView.vue'
import WebsiteView from '@/views/WebsiteView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    {
      path: '/websites/new',
      name: 'website-new',
      component: WebsiteFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/websites/:id(\\d+)',
      name: 'website',
      component: WebsiteView,
      meta: { requiresAuth: true },
    },
    {
      path: '/websites/:id(\\d+)/edit',
      name: 'website-edit',
      component: WebsiteFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/websites/:websiteId(\\d+)/pages/new',
      name: 'page-new',
      component: PageFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pages/:id(\\d+)',
      name: 'page-edit',
      component: PageEditorView,
      meta: { requiresAuth: true },
    },
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Első navigáció (pl. oldalfrissítés): a session alapján visszaállítjuk a bejelentkezett állapotot.
  if (!auth.initialized) {
    try {
      await auth.fetchUser()
    } catch {
      // Szerverhiba esetén vendégként folytatjuk; a védett oldalak a bejelentkezésre irányítanak.
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' }
})

export default router
