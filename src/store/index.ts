import { createStore } from 'vuex'
import { auth } from './auth/auth'
import { albumDetails } from './albums/albums'

export default createStore({
  modules: {
    auth,
    albumDetails
  }
})
