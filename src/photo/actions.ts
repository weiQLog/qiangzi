'use server'

import {
  sqlDeletePhoto,
  sqlInsertPhoto,
  sqlDeletePhotoTagGlobally,
  sqlUpdatePhoto,
  sqlRenamePhotoTagGlobally,
  getPhoto,
  latlngInfoService,
} from '@/services/vercel-postgres'

import {
  PhotoFormData,
  convertFormDataToPhotoDbInsert,
  convertPhotoToFormData,
} from './form'
import { redirect } from 'next/navigation'
import { convertUploadToPhoto, deleteStorageUrl } from '@/services/storage'
import {
  revalidateAdminPaths,
  revalidateAllKeysAndPaths,
  revalidatePhotosKey,
  revalidateTagsKey,
} from '@/photo/cache'
import {
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_TAGS,
  PATH_ROOT,
  pathForPhoto,
} from '@/site/paths'
import { extractExifDataFromBlobPath } from './server'
import { TAG_FAVS, isTagFavs } from '@/tag'
import { convertPhotoToPhotoDbInsert } from '.'
import { safelyRunAdminServerAction } from '@/auth'
import { AI_IMAGE_QUERIES, AiImageQuery } from './ai'
import { streamOpenAiImageQuery } from '@/services/openai'
import { streamClaudeAiImageQuery } from '@/services/claudeai'
import { NextApiRequest, NextApiResponse } from 'next/types'
import { getIp, sqlInsertPhotosIp } from '@/services/photoIp'
import { sql } from '@vercel/postgres'
import { ipInfo } from '@/utility/client'

/**
 * 上传相片
 * @param formData 相片资料
 * @returns
 */
export async function createPhotoAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    const photo = convertFormDataToPhotoDbInsert(formData, true)
    const updatedUrl = await convertUploadToPhoto(photo.url, photo.id)

    if (updatedUrl) {
      photo.url = updatedUrl
    }
    try {
      sql`BEGIN`
      if (photo.latitude && photo.longitude) {
        let latlng = `${photo.latitude},${photo.longitude}`
        let xmlText = await latlngInfoService(latlng)
        if (xmlText) {
          let parser = new DOMParser()
          let xmlDoc = parser.parseFromString(xmlText, 'text/xml')
          const countryNode = xmlDoc.querySelector('result > type:only-of-type(country) + address_component > short_name');
          const countryShortName = countryNode ? countryNode.textContent : 'Unknown';
          console.log("国家是：", countryShortName);
        }
      } else {
        photo.country_short = 'CN'
      }
      await sqlInsertPhoto(photo)
      // 获取客户端ip
      let ipInfo = await getIp(formData.get('ip') as string)
      if (ipInfo.rowCount === 0)
        await sqlInsertPhotosIp(photo, formData.get('ip') as string)
      await sql`COMMIT`
    } catch (err) {
      await sql`ROLLBACK`
    } finally {
      // redirect 不能在try catch中调用！
      revalidateAllKeysAndPaths()
      console.log(`重定向 ${PATH_ADMIN_PHOTOS}`)
      redirect(PATH_ADMIN_PHOTOS)
    }
  })
}

/**
 * 修改操作
 * @param formData 修改内容
 * @returns
 */
export async function updatePhotoAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    const photo = convertFormDataToPhotoDbInsert(formData)

    await sqlUpdatePhoto(photo)

    revalidateAllKeysAndPaths()

    redirect(PATH_ADMIN_PHOTOS)
  })
}

export async function toggleFavoritePhotoAction(
  photoId: string,
  shouldRedirect?: boolean
) {
  return safelyRunAdminServerAction(async () => {
    const photo = await getPhoto(photoId)
    if (photo) {
      const { tags } = photo
      photo.tags = tags.some((tag) => tag === TAG_FAVS)
        ? tags.filter((tag) => !isTagFavs(tag))
        : [...tags, TAG_FAVS]
      await sqlUpdatePhoto(convertPhotoToPhotoDbInsert(photo))
      revalidateAllKeysAndPaths()
      if (shouldRedirect) {
        redirect(pathForPhoto(photoId))
      }
    }
  })
}

/**
 *
 * @param photoId 删除相片
 * @param photoUrl 删除相片
 * @param shouldRedirect
 * @returns
 */
export async function deletePhotoAction(
  photoId: string,
  photoUrl: string,
  shouldRedirect?: boolean
) {
  return safelyRunAdminServerAction(async () => {
    // 删除相片和对象存储中的图片
    await sqlDeletePhoto(photoId).then(() => deleteStorageUrl(photoUrl))
    revalidateAllKeysAndPaths()
    if (shouldRedirect) {
      redirect(PATH_ROOT)
    }
  })
}

export async function deletePhotoFormAction(formData: FormData) {
  return safelyRunAdminServerAction(async () =>
    deletePhotoAction(
      formData.get('id') as string,
      formData.get('url') as string
    )
  )
}

export async function deletePhotoTagGloballyAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    const tag = formData.get('tag') as string

    await sqlDeletePhotoTagGlobally(tag)

    revalidatePhotosKey()
    revalidateAdminPaths()
  })
}

export async function renamePhotoTagGloballyAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    const tag = formData.get('tag') as string
    const updatedTag = formData.get('updatedTag') as string

    if (tag && updatedTag && tag !== updatedTag) {
      await sqlRenamePhotoTagGlobally(tag, updatedTag)
      revalidatePhotosKey()
      revalidateTagsKey()
      redirect(PATH_ADMIN_TAGS)
    }
  })
}

/**
 * 删除图片
 * @param formData
 * @returns
 */
export async function deleteBlobPhotoAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    await deleteStorageUrl(formData.get('url') as string)
    revalidateAdminPaths()
    if (formData.get('redirectToPhotos') === 'true') {
      redirect(PATH_ADMIN_PHOTOS)
    }
  })
}

export async function getExifDataAction(
  photoFormPrevious: Partial<PhotoFormData>
): Promise<Partial<PhotoFormData>> {
  return safelyRunAdminServerAction(async () => {
    const { url } = photoFormPrevious
    if (url) {
      const { photoFormExif } = await extractExifDataFromBlobPath(url)
      if (photoFormExif) {
        return photoFormExif
      }
    }
    return {}
  })
}

export async function syncPhotoExifDataAction(formData: FormData) {
  return safelyRunAdminServerAction(async () => {
    const photoId = formData.get('id') as string
    if (photoId) {
      const photo = await getPhoto(photoId)
      if (photo) {
        const { photoFormExif } = await extractExifDataFromBlobPath(photo.url)
        if (photoFormExif) {
          const photoFormDbInsert = convertFormDataToPhotoDbInsert({
            ...convertPhotoToFormData(photo),
            ...photoFormExif,
          })
          await sqlUpdatePhoto(photoFormDbInsert)
          revalidatePhotosKey()
        }
      }
    }
  })
}

export async function syncCacheAction() {
  return safelyRunAdminServerAction(revalidateAllKeysAndPaths)
}

export async function streamAiImageQueryAction(
  imageBase64: string,
  query: AiImageQuery
) {
  return safelyRunAdminServerAction(async () =>
    streamClaudeAiImageQuery(imageBase64, AI_IMAGE_QUERIES[query])
  )
}
