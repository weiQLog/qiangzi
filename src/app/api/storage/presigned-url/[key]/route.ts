import { auth } from '@/auth';
import {
  awsS3Client,
  awsS3PutObjectCommandForKey,
} from '@/services/storage/aws-s3';
import {
  cloudflareR2Client,
  cloudflareR2PutObjectCommandForKey,
} from '@/services/storage/cloudflare-r2';
import { CURRENT_STORAGE } from '@/site/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {tebiClient, tebiPutObjectCommandForKey} from '@/services/storage/tebi';

export const runtime = 'edge';

export async function GET(
  _: Request,
  { params: { key } }: { params: { key: string } },
) {
  const session = await auth();
  if (session?.user && key) {
    const url = await getSignedUrl(tebiClient(), tebiPutObjectCommandForKey(key),
      { expiresIn: 3600 }
    );
    return new Response(
      url,
      { headers: { 'content-type': 'text/plain' } },
    );
  } else {
    return new Response('Unauthorized request', { status: 401 });
  }
}
