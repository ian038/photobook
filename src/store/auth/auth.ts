import { Auth } from 'aws-amplify'

export const auth = {
  namespaced: true,
  state: { user: null },
  mutations: {
    setUser (state, payload): void {
      state.user = payload
    }
  },
  actions: {
    async logout ({ commit }): Promise<void> {
      commit('setUser', null)
      return await Auth.signOut()
    },

    async login ({ commit }, { username, password }): Promise<string> {
      try {
        await Auth.signIn(username, password)
        const userInfo = await Auth.currentUserInfo()
        commit('setUser', userInfo)
        return Promise.resolve('Login Success!')
      } catch (error) {
        console.log('Login Error', error)
        return Promise.reject(error)
      }
    },

    async confirmSignup (_, { username, passcode }): Promise<void> {
      try {
        await Auth.confirmSignUp(username, passcode)
        return Promise.resolve()
      } catch (error) {
        console.log('Sign Up Confirm Error', error)
        return Promise.reject(error)
      }
    },

    async signup (_, { username, password, email }): Promise<void> {
      try {
        await Auth.signUp({
          username,
          password,
          attributes: {
            email
          }
        })
        return Promise.resolve()
      } catch (error) {
        console.log('Signup Error', error)
        return Promise.reject(error)
      }
    },

    async authAction ({ commit }): Promise<void> {
      const userInfo = await Auth.currentUserInfo()
      commit('setUser', userInfo)
    }
  },
  getters: {
    user: (state) => state.user
  }
}
