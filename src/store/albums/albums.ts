import { API, graphqlOperation } from 'aws-amplify'
import { createAlbum as createAlbumMutation } from '@/graphql/mutations'
import { getAlbum as getAlbumQuery, listAlbums as listAlbumsQuery } from '@/graphql/queries'
import { GraphQLResult } from '@aws-amplify/api-graphql'

export const albumDetails = {
  namespaced: true,
  state: { albums: null },
  mutations: {
    setAlbums (state, payload): void {
      state.albums = payload
    }
  },
  actions: {
    async createAlbum (_, newAlbum): Promise<void> {
      try {
        await API.graphql(graphqlOperation(createAlbumMutation, { input: newAlbum }))
      } catch (error) {
        console.log('Create ALbum error', error)
      }
    },

    async getAlbum (_, albumId): Promise<GraphQLResult<any> | any> {
      return await API.graphql(graphqlOperation(getAlbumQuery, { input: albumId }))
    },

    async listAlbums ({ commit }): Promise<any> {
      const albumsData = await (API.graphql(graphqlOperation(listAlbumsQuery)) as unknown) as {
        data: any
      }
      commit('setAlbums', albumsData.data.listAlbums.items)
    }
  },
  getters: {
    albums: state => state.albums
  }
}
