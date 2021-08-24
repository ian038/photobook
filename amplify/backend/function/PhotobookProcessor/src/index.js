/* eslint-disable @typescript-eslint/no-var-requires */
/* Amplify Params - DO NOT EDIT
API_PHOTOBOOKAPI_GRAPHQLAPIENDPOINTOUTPUT
API_PHOTOBOOKAPI_GRAPHQLAPIIDOUTPUT
ENV
REGION
Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk')
const axios = require('axios')
const aws4 = require('aws4')
const urlParse = require('url').URL
const sharp = require('sharp')
const exifReader = require('exif-reader')

const appSyncUrl = process.env.API_AMPLIFYPHOTOSAPI_GRAPHQLAPIENDPOINTOUTPUT
// eslint-disable-next-line new-cap
const appSyncHost = new urlParse(appSyncUrl).hostname.toString()

const THUMBNAIL_WIDTH = 300
const THUMBNAIL_HEIGHT = 300

let s3Client = null

//
// Load image from S3 by passing bucket and key.
//
async function loadImage (bucket, key) {
  const params = { Bucket: bucket, Key: key }
  return await s3Client.getObject(params).promise()
}

//
// Resize image to thumbnail and convert to JPEG; then put put in S3.
//
async function createThumbnail (bucket, key, image) {
  const thumbKey = key.replace('images', 'thumbs').replace(/\.[^.]+$/, '.jpg')

  try {
    // Use Sharp to resize the image to and convert to JPEG format
    const thumb = await sharp(image)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
      .jpeg()
      .toBuffer()

    await s3Client
      .putObject({ Bucket: bucket, Key: thumbKey, Body: thumb })
      .promise()
    return {
      bucket: bucket,
      key: thumbKey.substring(thumbKey.indexOf('thumbs')),
      region: process.env.REGION
    }
  } catch (error) {
    console.error('[createThumbnail] ', error)
    throw error
  }
}

//
// Retrieve metadata and EXIF data from image.
//
async function getPhotoMetadata (image) {
  try {
    const metadata = await sharp(image).metadata()

    const result = {
      height: metadata.height,
      width: metadata.width
    }

    const gps = getGpsData(metadata)
    if (gps) {
      result.gps = gps
    }
    return result
  } catch (error) {
    console.error('[storeExifData] ', error)
    return null
  }
}

function getGpsData (metadata) {
  let result = null

  try {
    const gps = exifReader(metadata.exif).gps
    result = {
      latitude: `${gps.GPSLatitude[0]}°${gps.GPSLatitude[1]}'${gps.GPSLatitude[2]}"${gps.GPSLatitudeRef}`,
      longitude: `${gps.GPSLongitude[0]}°${gps.GPSLongitude[1]}'${gps.GPSLongitude[2]}"${gps.GPSLongitudeRef}`,
      altitude: gps.GPSAltitude
    }
  } catch (error) {
    console.warn('Failed to get EXIF data, may not exist')
  }

  return result
}

//
// GraphQL mutation to update photo record properties.
//
const updatePhotoMutation = `mutation UpdatePhoto($input: UpdatePhotoInput!) {
  updatePhoto(input: $input) {
    id
    createdAt
    updatedAt
    gps {
      latitude
      longitude
      altitude
    }
    thumbnail {
      key
    }
  }
}`

//
// Store thumbnail and metadata via AppSync.
//
async function updatePhotoRecord (photoId, metadata, thumbnail) {
  console.log('plhoto, id', photoId)
  if (metadata && metadata.gps && !metadata.gps.altitude) {
    metadata.gps.altitude = 0
  }
  const mutation = {
    query: updatePhotoMutation,
    operationName: 'UpdatePhoto',
    variables: {
      input: {
        id: photoId,
        ...metadata,
        thumbnail
      }
    }
  }

  const request = aws4.sign({
    method: 'POST',
    url: appSyncUrl,
    host: appSyncHost,
    path: '/graphql',
    headers: {
      'Content-Type': 'application/json'
    },
    service: 'appsync',
    data: mutation,
    body: JSON.stringify(mutation)
  })

  delete request.headers.Host
  delete request.headers['Content-Length']

  const result = await axios(request)
  console.log(JSON.stringify(result.data))
  if (result.errors && result.errors.length > 0) {
    console.error(`[updatePhotoRecord] ${result.errors[0].message}`)
    throw new Error(
      `AppSync error - ${result.errors[0].errorType}: ${result.errors[0].message}`
    )
  }
}

exports.handler = async event => {
  const bucket = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  )

  if (key.indexOf('thumb') > 0) {
    return { status: 'skipped', key }
  }

  if (!s3Client) {
    s3Client = new AWS.S3()
  }

  try {
    const image = await loadImage(bucket, key)

    const [thumb, metadata] = await Promise.all([
      createThumbnail(bucket, key, image.Body),
      getPhotoMetadata(image.Body)
    ])

    await updatePhotoRecord(image.Metadata.photoid, metadata, thumb)
  } catch (error) {
    console.error(JSON.stringify(error))
    console.error('An error occurred')
    return error
  }

  return { status: 'complete', key }
}
