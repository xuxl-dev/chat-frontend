import './assets/main.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import VueVirtualScroller from 'vue-virtual-scroller'
import App from './App.vue'
import Axios from './apis/ajax'
// import mountElementUI from './utils/elementUI'

document.title = import.meta.env.VITE_APP_TITLE

const app = createApp(App)
app.use(createPinia())
app.provide('$http', Axios)
app.use(router)
app.use(VueVirtualScroller)

// 全量引入Element UI
// mountElementUI(app)
app.mount('#app')
