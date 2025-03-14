import { createRouter, createWebHashHistory } from 'vue-router'
import ChatTabView from '@/views/ChatTabView.vue'
import SettingsTabView from '@/views/SettingsTabView.vue'
import WelcomeView from '@/views/WelcomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatTabView,
      meta: {
        titleKey: 'routes.chat',
        icon: 'lucide:message-square'
      }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
      meta: {
        titleKey: 'routes.welcome',
        icon: 'lucide:message-square'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsTabView,
      meta: {
        titleKey: 'routes.settings',
        icon: 'lucide:settings'
      },
      children: [
        {
          path: 'common',
          name: 'settings-common',
          component: () => import('@/components/settings/CommonSettings.vue'),
          meta: {
            titleKey: 'routes.settings-common',
            icon: 'lucide:bolt'
          }
        },
        {
          path: 'provider/:providerId?',
          name: 'settings-provider',
          component: () => import('@/components/settings/ModelProviderSettings.vue'),
          meta: {
            titleKey: 'routes.settings-provider',
            icon: 'lucide:cloud-cog'
          }
        },
        {
          path: 'about',
          name: 'settings-about',
          component: () => import('@/components/settings/AboutUsSettings.vue'),
          meta: {
            titleKey: 'routes.settings-about',
            icon: 'lucide:info'
          }
        }
      ]
    },
    {
      path: '/zhuye',
      name: 'zhuye',
      component: () => import('@/views/ZhuYeView.vue'),
      meta: {
        titleKey: 'routes.zhuye',
        icon: 'lucide:bug'
      }
    },
    {
      path: '/note',
      name: 'note',
      component: () => import('@/views/NoteView.vue'),
      meta: {
        titleKey: 'routes.note',
        icon: 'lucide:book-type'
      }
    },
    {
      path: '/echart',
      name: 'echart',
      component: () => import('@/views/echart.vue'),
      meta: {
        titleKey: 'routes.echart',
        icon: 'lucide:atom'
      }
    },
    {
      path: '/card',
      name: 'card',
      component: () => import('@/views/card.vue'),
      meta: {
        titleKey: 'routes.card',
        icon: 'lucide:instagram'
      }
    }
  ]
})

export default router
