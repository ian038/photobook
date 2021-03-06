<template lang="">
  <div>
    <h3 class="text-4xl font-semibold">Album {{ albumName }}</h3>
    <div class="flex w-full mt-10 items-center justify-center bg-grey-lighter">
      <form enctype="multipart/form-data" novalidate>
        <label
          class="w-64 flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue hover:text-green-600"
        >
          <svg
            class="w-8 h-8"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z"
            />
          </svg>
          <span class="mt-2 text-base leading-normal">Select a file</span>
          <input @change="onFileChange" accept="image/*" type="file" class="hidden" />
        </label>
      </form>
    </div>
    <div class="text-2xl mt-4">List Of Photos</div>
    <div class="flex flex-wrap p-10 justify-center m-auto w-full" v-if="photos">
      <div class="shadow-xl ml-4 mt-4 w-4/12" v-for="(photo, idx) in photos" :key="idx">
        <amplify-s3-image
          level="protected"
          :img-key="photo.thumbnail ? photo.thumbnail.key : photo.fullsize.key"
          :key="componentKey"
          class="w-4/12"
        ></amplify-s3-image>
        <div v-if="photo.createdAt && photo.gps">
          <ul>
            <li>Created At {{ photo.createdAt }}</li>
            <li>
              latitude
              {{ photo.gps.latitude }}
            </li>
            <li>longitude At {{ photo.gps.longitude }}</li>
          </ul>
        </div>
        <button class="btn-red mb-4" @click="deletePhoto(photo)">Delete Photo</button>
      </div>
    </div>
    <button class="btn-red mb-4" @click="deleteAlbum">Delete Album</button>
  </div>
</template>

<script lang='ts'>

type dataProps = {
  photos: Array<Record<string, string>>
  albumName: string
  componentKey: number
}

export default {
  async mounted (): Promise<void> {
    await this.getPhotos()
  },
  data: (): dataProps => ({
    photos: [],
    albumName: '',
    componentKey: 0
  }),
  methods: {
    async deleteAlbum (): Promise<void> {
      await this.$store.dispatch('albumDetails/deleteAlbum', this.id)
      this.$router.push('/albums')
    },

    async onFileChange (file): Promise<void> {
      if (!file.target || !file.target.files[0]) return
      try {
        await this.$store.dispatch('albumDetails/createPhoto', {
          file: file.target.files[0],
          id: this.id
        })
        await this.getPhotos()
      } catch (error) {
        console.log('Create photo error', error)
      }
    },

    async getPhotos (): Promise<void> {
      const album = await this.$store.dispatch('albumDetails/getAlbum', this.id)
      this.photos = album.data.getAlbum.photos.items
      this.albumName = album.data.getAlbum.name
    },

    async deletePhoto (photoId): Promise<void> {
      await this.$store.dispatch('albumDetails/deletePhoto', { photo: photoId })
      await this.getPhotos()
      this.componentKey += 1
    }
  },
  computed: {
    id (): void {
      return this.$route.params.id
    }
  }
}
</script>

<style lang="scss" scoped>
amplify-s3-image {
  --width: 75%;
}
</style>
