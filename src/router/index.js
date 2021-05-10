import { createRouter, createWebHistory } from 'vue-router'
import Wildfly from '../views/Wildfly.vue'
import Eclipse from '../views/Eclipse.vue'
import Tomcat from '../views/Tomcat.vue'
import Workspace from '../views/Workspace.vue'

const routes = [
  {
    path: '/',
    name: 'Wildfy',
    component: Wildfly,
  },
  {
    path: '/eclipse',
    name: 'Eclipse',
    component: Eclipse,
  },
  {
    path: '/tomcat',
    name: 'Tomcat',
    component: Tomcat,
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: Workspace,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
