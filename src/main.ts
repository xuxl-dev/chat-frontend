import './assets/main.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import VueVirtualScroller from 'vue-virtual-scroller'
import App from './App.vue'
import Axios from './apis/ajax'
// import mountElementUI from './utils/elementUI'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import Sticky from 'vue-sticky-directive'

document.title = import.meta.env.VITE_APP_TITLE

const app = createApp(App)
app.use(createPinia())
app.provide('$http', Axios)
app.use(router)
app.use(VueVirtualScroller)
app.use(Sticky)
app.directive('sticky', {
  beforeMount(el, binding) {
    const offset = binding.value || 0;
    el.style.position = 'sticky';
    el.style.top = offset + 'px';
  },
  updated(el, binding) {
    const offset = binding.value || 0;
    el.style.top = offset + 'px';
  },
});

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 全量引入Element UI
// mountElementUI(app)
app.mount('#app')
