import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/tailwind.css'
import Amplify from 'aws-amplify'
import '@aws-amplify/ui-vue'
import awsexports from './aws-exports'

Amplify.configure(awsexports)

createApp(App).use(store).use(router).mount('#app')
