import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/tailwind.css'
import Amplify from 'aws-amplify'
import awsconfig from './aws-exports'
import { applyPolyfills, defineCustomElements } from '@aws-amplify/ui-components/loader'

Amplify.configure(awsconfig)

applyPolyfills().then(() => {
  defineCustomElements(window)
})

createApp(App).use(store).use(router).mount('#app')
