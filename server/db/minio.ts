import { BucketItem, Client, CopyConditions } from 'minio';
import { Observable, from, lastValueFrom } from 'rxjs';
import { mergeMap, reduce } from 'rxjs/operators';

export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minio',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minio123',
  region: process.env.MINIO_REGION,
  useSSL: !(process.env.MINIO_DISABLE_SSL === 'true'),
});

export function listObjectsV2$(
  bucketName: string,
  prefix?: string,
  recursive?: boolean,
  startAfter?: string,
): Observable<BucketItem> {
  return new Observable<BucketItem>((subscriber) => {
    const stream = minio.listObjectsV2(
      bucketName,
      prefix,
      recursive,
      startAfter,
    );

    stream.on('data', (item) => {
      subscriber.next(item);
    });

    stream.on('error', (err) => {
      subscriber.error(err);
    });

    stream.on('end', () => {
      subscriber.complete();
    });

    return () => {
      stream.removeAllListeners();
    };
  });
}

export async function getObjectAsBuffer(
  bucketName: string,
  objectName: string,
): Promise<Buffer> {
  const buffer$ = from(minio.getObject(bucketName, objectName)).pipe(
    mergeMap((stream) => from(stream)),
    // reduce into a single buffer
    reduce((acc, chunk) => Buffer.concat([acc, chunk]), Buffer.alloc(0)),
  );
  return lastValueFrom(buffer$);
}

export async function moveObject(
  bucketName: string,
  objectName: string,
  newObjectName: string,
) {
  if (objectName === newObjectName) {
    return;
  }

  const conditions = new CopyConditions();
  await minio.copyObject(
    bucketName,
    newObjectName,
    `/${bucketName}/${objectName}`,
    conditions,
  );
  await minio.removeObject(bucketName, objectName);
}

export async function objectExists(
  bucketName: string,
  objectName: string,
): Promise<boolean> {
  try {
    await minio.statObject(bucketName, objectName);
    return true;
  } catch (err) {
    if ((err as any).code === 'NotFound') {
      return false;
    }
    throw err;
  }
}
