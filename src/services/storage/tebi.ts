import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageListResponse, generateStorageId } from '.';
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const TEBI_BUCKET = process.env.NEXT_PUBLIC_TEBI_BUCKET ?? '';
const TEBI_REGION = process.env.NEXT_PUBLIC_TEBI_REGION ?? '';
const TEBI_ACCESS_KEY = process.env.TEBI_ACCESS_KEY ?? '';
const TEBI_SECRET_ACCESS_KEY = process.env.TEBI_SECRET_ACCESS_KEY ?? '';

export const TEBI_BASE_URL = 'https://s3.tebi.io';

export const tebiClient = () => new S3Client({
  endpoint: 'https://s3.tebi.io',
  region: TEBI_REGION,
  credentials: {
    accessKeyId: TEBI_ACCESS_KEY,
    secretAccessKey: TEBI_SECRET_ACCESS_KEY,
  },
});

const urlForKey = (key?: string) => `${TEBI_BASE_URL}/qiangzi/${key}`;

export const isUrlFromTEBI = (url?: string) =>
  TEBI_BASE_URL && url?.startsWith(TEBI_BASE_URL);

export const tebiPutObjectCommandForKey = (Key: string) => {
  console.log("uplaod key ", Key)
  return new PutObjectCommand({ Bucket: TEBI_BUCKET, Key })
}

export const tebiCopy = async (
  fileNameSource: string,
  fileNameDestination: string,
  addRandomSuffix?: boolean,
) => {
  const name = fileNameSource.split('.')[0];
  const extension = fileNameSource.split('.')[1];
  const Key = addRandomSuffix
    ? `${name}-${generateStorageId()}.${extension}`
    : fileNameDestination;
  return tebiClient().send(new CopyObjectCommand({
    Bucket: TEBI_BUCKET,
    CopySource: fileNameSource,
    Key,
    ACL: 'public-read',
  })).then(() => urlForKey(fileNameDestination));
};

export const tebiList = async (
  Prefix: string,
): Promise<StorageListResponse> =>
  tebiClient().send(new ListObjectsCommand({
    Bucket: TEBI_BUCKET,
    Prefix,
  }))
    .then((data) => data.Contents?.map(({ Key, LastModified }) => ({
      url: urlForKey(Key),
      uploadedAt: LastModified,
    })) ?? []);

export const tebiDelete = async (Key: string) => {
  console.log('Key', Key);
  tebiClient().send(new DeleteObjectCommand({
    Bucket: TEBI_BUCKET,
    Key,
  }));
};
