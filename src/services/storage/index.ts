import {
  VERCEL_BLOB_BASE_URL,
  vercelBlobCopy,
  vercelBlobDelete,
  vercelBlobList,
  vercelBlobUploadFromClient,
} from './vercel-blob';
import {
  AWS_S3_BASE_URL,
  awsS3Copy,
  awsS3Delete,
  awsS3List,
  isUrlFromAwsS3,
} from './aws-s3';
import {
  CURRENT_STORAGE,
  HAS_AWS_S3_STORAGE,
  HAS_VERCEL_BLOB_STORAGE,
  HAS_CLOUDFLARE_R2_STORAGE, HAS_TEBI_STORAGE,
} from '@/site/config';
import { generateNanoid } from '@/utility/nanoid';
import {
  CLOUDFLARE_R2_BASE_URL_PUBLIC,
  cloudflareR2Copy,
  cloudflareR2Delete,
  cloudflareR2List,
  isUrlFromCloudflareR2,
} from './cloudflare-r2';
import { PATH_API_PRESIGNED_URL } from '@/site/paths';
import {isUrlFromTEBI, TEBI_BASE_URL, tebiCopy, tebiDelete, tebiList} from '@/services/storage/tebi';

export const generateStorageId = () => generateNanoid(16);

export type StorageListResponse = {
  url: string
  uploadedAt?: Date
}[];

export type StorageType =
  'vercel-blob' |
  'aws-s3' |
  'cloudflare-r2' | 'tebi';


export const labelForStorage = (type: StorageType): string => {
  switch (type) {
  case 'vercel-blob': return 'Vercel Blob';
  case 'cloudflare-r2': return 'Cloudflare R2';
  case 'aws-s3': return 'AWS S3';
  case 'tebi': return 'TEBI';
  }
};

export const baseUrlForStorage = (type: StorageType) => {
  switch (type) {
  case 'vercel-blob': return VERCEL_BLOB_BASE_URL;
  case 'cloudflare-r2': return CLOUDFLARE_R2_BASE_URL_PUBLIC;
  case 'aws-s3': return AWS_S3_BASE_URL;
  case 'tebi': return TEBI_BASE_URL;
  }
};

export const storageTypeFromUrl = (url: string): StorageType => {
  if (isUrlFromCloudflareR2(url)) {
    return 'cloudflare-r2';
  } else if (isUrlFromAwsS3(url)) {
    return 'aws-s3';
  } else if (isUrlFromTEBI(url)) {
    return 'tebi';
  }else {
    return 'vercel-blob';
  }
};

const PREFIX_UPLOAD = 'upload';
const PREFIX_PHOTO = 'photo';

const REGEX_UPLOAD_PATH = new RegExp(
  `(?:${PREFIX_UPLOAD})\.[a-z]{1,4}`,
  'i',
);

const REGEX_UPLOAD_ID = new RegExp(
  `.${PREFIX_UPLOAD}-([a-z0-9]+)\.[a-z]{1,4}$`,
  'i',
);

export const fileNameForStorageUrl = (url: string) => {
  switch (storageTypeFromUrl(url)) {
  case 'vercel-blob':
    return url.replace(`${VERCEL_BLOB_BASE_URL}/`, '');
  case 'cloudflare-r2':
    return url.replace(`${CLOUDFLARE_R2_BASE_URL_PUBLIC}/`, '');
  case 'aws-s3':
    return url.replace(`${AWS_S3_BASE_URL}/`, '');
  case 'tebi':
    return url.replace(`${TEBI_BASE_URL}/`, '');
  }
};

export const getExtensionFromStorageUrl = (url: string) =>
  url.match(/.([a-z]{1,4})$/i)?.[1];

export const getIdFromStorageUrl = (url: string) =>
  url.match(REGEX_UPLOAD_ID)?.[1];

export const isUploadPathnameValid = (pathname?: string) =>
  pathname?.match(REGEX_UPLOAD_PATH);

const getFileNameFromStorageUrl = (url: string) =>
  (new URL(url).pathname.match(/\/(.+)$/)?.[1]) ?? '';

const getFileNameFromTebiUrl = (url: string) =>
  {
    return (new URL(url).pathname.match(/[^/]+$/)?.[0]) ?? '';
  }

const TEBI_BUCKET = process.env.NEXT_PUBLIC_TEBI_BUCKET ?? '';

/**
 * 上传file到oss
 * @param file 文件
 * @param fileName 文件名
 * @param extension 扩展名
 * @param addRandomSuffix 是否添加随机前缀
 * @returns 
 */
export const uploadFromClientViaPresignedUrl = async (
  file: File | Blob,
  fileName: string,
  extension: string,
  addRandomSuffix?: boolean,
) => {
  const key = addRandomSuffix
    ? `${fileName}-${generateStorageId()}.${extension}`
    : `${fileName}.${extension}`;

  const url = await fetch(`${PATH_API_PRESIGNED_URL}/${key}`)
    .then((response) => response.text());
  return fetch(url, { method: 'PUT', body: file })
    .then(() => {
      if(CURRENT_STORAGE === 'tebi' && TEBI_BUCKET) {
        return `${baseUrlForStorage(CURRENT_STORAGE)}/${TEBI_BUCKET}/${key}`;
      }
      return `${baseUrlForStorage(CURRENT_STORAGE)}/${key}`;
    });
};

/**
 * 从客户端post图片到服务器
 * @param file 图片
 * @param extension 扩展名 
 * @returns 
 */
export const uploadPhotoFromClient = async (
  file: File | Blob,
  extension = 'jpg',
) => (
  CURRENT_STORAGE === 'cloudflare-r2' ||
  CURRENT_STORAGE === 'aws-s3' ||
  CURRENT_STORAGE === 'tebi'
)
  ? uploadFromClientViaPresignedUrl(file, PREFIX_UPLOAD, extension, true)
  : vercelBlobUploadFromClient(file, `${PREFIX_UPLOAD}.${extension}`);

export const convertUploadToPhoto = async (
  uploadUrl: string,
  photoId?: string,
): Promise<string> => {
  const fileName = photoId ? `${PREFIX_PHOTO}-${photoId}` : `${PREFIX_PHOTO}`;
  const fileExtension = getExtensionFromStorageUrl(uploadUrl);
  const photoPath = `${fileName}.${fileExtension ?? 'jpg'}`;

  const storageType = storageTypeFromUrl(uploadUrl);

  let url: string | undefined;

  // Copy file
  switch (storageType) {
  case 'vercel-blob':
    url = await vercelBlobCopy(uploadUrl, photoPath, photoId === undefined);
    break;
  case 'cloudflare-r2':
    url = await cloudflareR2Copy(
      getFileNameFromStorageUrl(uploadUrl),
      photoPath,
      photoId === undefined,
    );
    break;
  case 'aws-s3':
    url = await awsS3Copy(uploadUrl, photoPath, photoId === undefined);
    break;
  case 'tebi':
    url = uploadUrl;
    break;
  }

  // If successful, delete original file
  if (url) {
    switch (storageType) {
    case 'vercel-blob':
      await vercelBlobDelete(uploadUrl);
      break;
    case 'cloudflare-r2':
      await cloudflareR2Delete(getFileNameFromStorageUrl(uploadUrl));
      break;
    case 'aws-s3':
      await awsS3Delete(getFileNameFromStorageUrl(uploadUrl));
      break;
    case 'tebi':
      await tebiDelete(getFileNameFromStorageUrl(uploadUrl));
      break;
    }
  }

  return url;
};

export const deleteStorageUrl = (url: string) => {
  switch (storageTypeFromUrl(url)) {
  case 'vercel-blob':
    return vercelBlobDelete(url);
  case 'cloudflare-r2':
    return cloudflareR2Delete(getFileNameFromStorageUrl(url));
  case 'aws-s3':
    return awsS3Delete(getFileNameFromStorageUrl(url));
  case 'tebi':
    return tebiDelete(getFileNameFromTebiUrl(url));
  }
};

const getStorageUrlsForPrefix = async (prefix = '') => {
  const urls: StorageListResponse = [];

  if (HAS_VERCEL_BLOB_STORAGE) {
    urls.push(...await vercelBlobList(prefix)
      .catch(() => []));
  }
  if (HAS_AWS_S3_STORAGE) {
    urls.push(...await awsS3List(prefix)
      .catch(() => []));
  }
  if (HAS_CLOUDFLARE_R2_STORAGE) {
    urls.push(...await cloudflareR2List(prefix)
      .catch(() => []));
  }
  if(HAS_TEBI_STORAGE) {
    urls.push(...await tebiList(prefix)
      .catch(() => []));
  }

  return urls
    .sort((a, b) => {
      if (!a.uploadedAt) { return 1; }
      if (!b.uploadedAt) { return -1; }
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    });
};

export const getStorageUploadUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_UPLOAD}-`);

export const getStoragePhotoUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_PHOTO}-`);
