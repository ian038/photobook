<template>
  <div>
    <h1 class="mb-4 text-2xl">Sign Up</h1>
    <form v-if="!confirmPassword" class="flex flex-col items-center" @submit.prevent="signUp">
      <div class="flex flex-col user">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="userName">User Name</label>
        <input
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          v-model="username"
          id="username"
        />
      </div>
      <div class="flex flex-col mt-2">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
        <input
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          type="password"
          id="password"
          v-model="password"
        />
      </div>
      <div class="flex flex-col mt-2">
        <label class="block text-gray-700 text-sm font-bold" for="email">Email</label>
        <input
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          type="email"
          id="email"
          v-model="email"
        />
      </div>
      <button class="btn-green">Sign Up</button>
    </form>
    <div v-if="error" class="text-red-600">{{ error.message }}</div>
    <div v-if="confirmPassword" class="w-4/12 m-auto">
      <h3>Enter your passcode. Please check your email</h3>
      <div class="flex flex-col mt-2">
        <label class="block text-gray-700 text-sm font-bold" for="password">Passcode</label>
        <input
          class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          v-model="passcode"
        />
        <button class="btn-green" @click="confirmSignup">Confirm Passcode</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
type SignupProps = {
  username: string
  password: string
  email: string
  error: string
  confirmPassword: boolean
  passcode: string
}

export default {
  data: (): SignupProps => ({
    username: '',
    password: '',
    email: '',
    error: '',
    confirmPassword: false,
    passcode: ''
  }),
  methods: {
    async signUp (): Promise<void> {
      const { username, email, password } = this
      if (!email || !password) return
      try {
        await this.$store.dispatch('auth/signup', {
          username,
          email,
          password
        })
        this.confirmPassword = true
      } catch (error) {
        this.error = error
      }
    },

    async confirmSignup (): Promise<void> {
      const { username, password, passcode } = this
      if (!username || !passcode) return
      try {
        await this.$store.dispatch('auth/confirmSignup', {
          username,
          passcode
        })
        await this.$store.dispatch('auth/login', {
          username,
          password
        })
        this.$router.push('/albums')
      } catch (error) {
        console.log(error)
        this.error = error
      }
    }
  }
}
</script>

<style lang=""></style>
