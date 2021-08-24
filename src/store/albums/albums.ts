import { API, graphqlOperation, Storage } from 'aws-amplify'
import { createAlbum as createAlbumMutation, createPhoto as createPhotoMutation, deleteAlbum as deleteAlbumMutation, deletePhoto as deletePhotoMutation } from '@/graphql/mutations'
import { getAlbum as getAlbumQuery, listAlbums as listAlbumsQuery } from '@/graphql/queries'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { v4 as uuidv4 } from 'uuid'
import awsconfig from '@/aws-exports'

export const albumDetails = {
  namespaced: true,
  state: { albums: null },
  mutations: {
    setAlbums (state, payload): void {
      state.albums = payload
    }
  },
  actions: {
    async createAlbum ({ dispatch }, newAlbum: Record<string, string>): Promise<void> {
      try {
        await API.graphql(graphqlOperation(createAlbumMutation, { input: newAlbum }))
        dispatch('listAlbums')
      } catch (error) {
        console.log('Create ALbum error', error)
      }
    },

    async deleteAlbum ({ dispatch }, albumToDelete: Record<string, string>): Promise<void> {
      try {
        await API.graphql(graphqlOperation(deleteAlbumMutation, { input: { id: albumToDelete } }))
        dispatch('listAlbums')
      } catch (error) {
        console.log('Delete album error', error)
      }
    },

    async getAlbum (_, albumId: number): Promise<GraphQLResult<any> | any> {
      return await API.graphql(graphqlOperation(getAlbumQuery, { id: albumId }))
    },

    async listAlbums ({ commit }): Promise<any> {
      const albumsData = await (API.graphql(graphqlOperation(listAlbumsQuery)) as unknown) as {
        data: any
      }
      commit('setAlbums', albumsData.data.listAlbums.items)
    },

    async createPhoto (_, data): Promise<string> {
      const {
        aws_user_files_s3_bucket: bucket,
        aws_user_files_s3_bucket_region: region
      } = awsconfig
      const { file, type: mimeType, id } = data
      const extension = file.name.substr(file.name.lastIndexOf('.') + 1)
      const photoId = uuidv4()
      const key = `images/${photoId}.${extension}`
      const inputData = {
        id: photoId,
        photoAlbumId: id,
        contentType: mimeType,
        fullsize: {
          key,
          region,
          bucket
        }
      }

      try {
        await Storage.put(key, file, {
          level: 'protected',
          contentType: mimeType,
          metadata: { albumId: id, photoId }
        })
        await API.graphql(graphqlOperation(createPhotoMutation, { input: inputData }))
        return Promise.resolve('Upload Success!')
      } catch (error) {
        console.log('create photo error', error)
        return Promise.reject(error)
      }
    },

    async deletePhoto (_, data): Promise<string> {
      const { photo } = data
      const key = photo.fullsize.key
      const inputData = {
        id: photo.id
      }

      try {
        await Storage.remove(key, {
          level: 'protected'
        })
        await API.graphql(graphqlOperation(deletePhotoMutation, { input: inputData }))
        return Promise.resolve('Delete Success!')
      } catch (error) {
        console.log('delete photo error', error)
        return Promise.reject(error)
      }
    }
  },
  getters: {
    albums: state => state.albums
  }
}
