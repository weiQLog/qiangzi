import { db, sql } from '@vercel/postgres';
import {
  PhotoDb,
  PhotoDbInsert,
  translatePhotoId,
  parsePhotoFromDb,
  Photo,
  PhotoDateRange,

} from '@/photo';
import { Camera, Cameras, createCameraKey } from '@/camera';
import { parameterize } from '@/utility/string';
import { Tags } from '@/tag';
import { FilmSimulation, FilmSimulations } from '@/simulation';
import { PRIORITY_ORDER_ENABLED } from '@/site/config';
import { latlngInfo } from '@/utility/client';

const PHOTO_DEFAULT_LIMIT = 100;

/**
 * 这个函数将一个字符串数组转换为 PostgreSQL 数组字符串格式，例如 ['tag1', 'tag2'] 会被转换为 '{tag1,tag2}'
 * @param array ['tag1', 'tag2']
 * @returns 
 */
export const convertArrayToPostgresString = (array?: string[]) => array
  ? `{${array.join(',')}}`
  : null;

/**
 * 创建 photos 表，如果表不存在
 * @returns 创建表的 SQL 查询
 */
const sqlCreatePhotosTable = () =>
  sql`
    CREATE TABLE IF NOT EXISTS photos (
      id VARCHAR(8) PRIMARY KEY,
      url VARCHAR(255) NOT NULL,
      extension VARCHAR(255) NOT NULL,
      aspect_ratio REAL DEFAULT 1.5,
      blur_data TEXT,
      title VARCHAR(255),
      caption TEXT,
      semantic_description TEXT,
      tags VARCHAR(255)[],
      make VARCHAR(255),
      model VARCHAR(255),
      focal_length SMALLINT,
      focal_length_in_35mm_format SMALLINT,
      f_number REAL,
      iso SMALLINT,
      exposure_time DOUBLE PRECISION,
      exposure_compensation REAL,
      location_name VARCHAR(255),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      film_simulation VARCHAR(255),
      priority_order REAL,
      taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
      taken_at_naive VARCHAR(255) NOT NULL,
      hidden BOOLEAN,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ip character varying COLLATE pg_catalog."default",
      country_short varchar default 'CN'::character varying not null
    )
  `;

// Migration 01
const MIGRATION_FIELDS_01 = ['caption', 'semantic_description'];
/**
 * 运行第一个迁移，添加 caption 和 semantic_description 列
 * @returns 运行迁移的 SQL 查询
 */
const sqlRunMigration01 = () =>
  sql`
    ALTER TABLE photos
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS semantic_description TEXT
  `;

// Must provide id as 8-character nanoid
export const sqlInsertPhoto = (photo: PhotoDbInsert) =>
  safelyQueryPhotos(() => sql`
    INSERT INTO photos (
      id,
      url,
      extension,
      aspect_ratio,
      blur_data,
      title,
      caption,
      semantic_description,
      tags,
      make,
      model,
      focal_length,
      focal_length_in_35mm_format,
      f_number,
      iso,
      exposure_time,
      exposure_compensation,
      location_name,
      latitude,
      longitude,
      film_simulation,
      priority_order,
      hidden,
      taken_at,
      taken_at_naive,
      ip,
      country_short
    )
    VALUES (
      ${photo.id},
      ${photo.url},
      ${photo.extension},
      ${photo.aspectRatio},
      ${photo.blurData},
      ${photo.title},
      ${photo.caption},
      ${photo.semanticDescription},
      ${convertArrayToPostgresString(photo.tags)},
      ${photo.make},
      ${photo.model},
      ${photo.focalLength},
      ${photo.focalLengthIn35MmFormat},
      ${photo.fNumber},
      ${photo.iso},
      ${photo.exposureTime},
      ${photo.exposureCompensation},
      ${photo.locationName},
      ${photo.latitude},
      ${photo.longitude},
      ${photo.filmSimulation},
      ${photo.priorityOrder},
      ${photo.hidden},
      ${photo.takenAt},
      ${photo.takenAtNaive},
      ${photo.ip},
      ${photo.country_short}
    )
  `);
/**
 * 更新照片的数据
 * @param photo - 需要更新的照片数据
 * @returns 更新数据的 SQL 查询
 */
export const sqlUpdatePhoto = (photo: PhotoDbInsert) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos SET
    url=${photo.url},
    extension=${photo.extension},
    aspect_ratio=${photo.aspectRatio},
    blur_data=${photo.blurData},
    title=${photo.title},
    caption=${photo.caption},
    semantic_description=${photo.semanticDescription},
    tags=${convertArrayToPostgresString(photo.tags)},
    make=${photo.make},
    model=${photo.model},
    focal_length=${photo.focalLength},
    focal_length_in_35mm_format=${photo.focalLengthIn35MmFormat},
    f_number=${photo.fNumber},
    iso=${photo.iso},
    exposure_time=${photo.exposureTime},
    exposure_compensation=${photo.exposureCompensation},
    location_name=${photo.locationName},
    latitude=${photo.latitude},
    longitude=${photo.longitude},
    film_simulation=${photo.filmSimulation},
    priority_order=${photo.priorityOrder || null},
    hidden=${photo.hidden},
    taken_at=${photo.takenAt},
    taken_at_naive=${photo.takenAtNaive},
    updated_at=${(new Date()).toISOString()},
    ip=${photo.ip},
    country_short=${photo.country_short}
    WHERE id=${photo.id}
  `);

/**
 * 删除全局照片标签
 * @param tag - 需要删除的标签
 * @returns 删除标签的 SQL 查询
 */
export const sqlDeletePhotoTagGlobally = (tag: string) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET tags=ARRAY_REMOVE(tags, ${tag})
    WHERE ${tag}=ANY(tags)
  `);

/**
 * 全局重命名照片标签
 * @param tag - 旧标签
 * @param updatedTag - 新标签
 * @returns 重命名标签的 SQL 查询
 */
export const sqlRenamePhotoTagGlobally = (tag: string, updatedTag: string) =>
  safelyQueryPhotos(() => sql`
    UPDATE photos
    SET tags=ARRAY_REPLACE(tags, ${tag}, ${updatedTag})
    WHERE ${tag}=ANY(tags)
  `);

/**
 * 删除照片
 * @param id - 需要删除的照片 ID
 * @returns 删除照片的 SQL 查询
 */
export const sqlDeletePhoto = (id: string) =>
  safelyQueryPhotos(() => sql`DELETE FROM photos WHERE id=${id}`);

/**
 * 获取单张照片
 * @param id - 照片 ID
 * @returns 获取照片的 SQL 查询
 */
const sqlGetPhoto = (id: string) =>
  safelyQueryPhotos(() =>
    sql<Photo>`
      SELECT photos_ip.city,
            photos_ip.country_name,
            photos_ip.country_code2,
            photos_ip.country_flag,
            photos.*
      FROM photos
              LEFT JOIN photos_ip ON photos_ip.ip = photos.ip
      WHERE id = ${id}
      LIMIT 1`
  );

/**
 * 获取照片总数（不包括隐藏的照片）
 * @returns 获取照片总数的 SQL 查询
 */
const sqlGetPhotosCount = async () => sql`
  SELECT COUNT(*) FROM photos
  WHERE hidden IS NOT TRUE
`.then(({ rows }) => parseInt(rows[0].count, 10));

/**
 * 获取照片总数（包括隐藏的照片）
 * @returns 获取照片总数的 SQL 查询
 */
const sqlGetPhotosCountIncludingHidden = async () => sql`
  SELECT COUNT(*) FROM photos
`.then(({ rows }) => parseInt(rows[0].count, 10));

/**
 * 获取包含特定标签的照片总数
 * @param tag - 标签
 * @returns 获取包含特定标签的照片总数的 SQL 查询
 */
const sqlGetPhotosTagCount = async (tag: string) => sql`
  SELECT COUNT(*) FROM photos
  WHERE ${tag}=ANY(tags) AND
  hidden IS NOT TRUE
`.then(({ rows }) => parseInt(rows[0].count, 10));

/**
 * 获取特定相机拍摄的照片总数
 * @param camera - 相机信息
 * @returns 获取特定相机拍摄的照片总数的 SQL 查询
 */
const sqlGetPhotosCameraCount = async (camera: Camera) => sql`
  SELECT COUNT(*) FROM photos
  WHERE
  LOWER(REPLACE(make, ' ', '-'))=${parameterize(camera.make, true)} AND
  LOWER(REPLACE(model, ' ', '-'))=${parameterize(camera.model, true)} AND
  hidden IS NOT TRUE
`.then(({ rows }) => parseInt(rows[0].count, 10));

/**
 * 获取特定胶片模拟的照片总数
 * @param simulation - 胶片模拟
 * @returns 获取特定胶片模拟的照片总数的 SQL 查询
 */
const sqlGetPhotosFilmSimulationCount = async (
  simulation: FilmSimulation,
) => sql`
  SELECT COUNT(*) FROM photos
  WHERE film_simulation=${simulation} AND
  hidden IS NOT TRUE
`.then(({ rows }) => parseInt(rows[0].count, 10));

/**
 * 获取照片的日期范围（不包括隐藏的照片）
 * @returns 获取照片日期范围的 SQL 查询
 */
const sqlGetPhotosDateRange = async () => sql`
  SELECT MIN(taken_at_naive) as start, MAX(taken_at_naive) as end
  FROM photos
  WHERE hidden IS NOT TRUE
`.then(({ rows }) => rows[0]?.start && rows[0]?.end
    ? rows[0] as PhotoDateRange
    : undefined);

/**
 * 获取包含特定标签的照片的日期范围
 * @param tag - 标签
 * @returns 获取包含特定标签的照片日期范围的 SQL 查询
 */
const sqlGetPhotosTagDateRange = async (tag: string) => sql`
  SELECT MIN(taken_at_naive) as start, MAX(taken_at_naive) as end
  FROM photos
  WHERE ${tag}=ANY(tags) AND
  hidden IS NOT TRUE
`.then(({ rows }) => rows[0]?.start && rows[0]?.end
    ? rows[0] as PhotoDateRange
    : undefined);

/**
 * 获取特定相机拍摄的照片的日期范围
 * @param camera - 相机信息
 * @returns
 */
const sqlGetPhotosCameraDateRange = async (camera: Camera) => sql`
  SELECT MIN(taken_at_naive) as start, MAX(taken_at_naive) as end
  FROM photos
  WHERE
  LOWER(REPLACE(make, ' ', '-'))=${parameterize(camera.make, true)} AND
  LOWER(REPLACE(model, ' ', '-'))=${parameterize(camera.model, true)} AND
  hidden IS NOT TRUE
`.then(({ rows }) => rows[0]?.start && rows[0]?.end
    ? rows[0] as PhotoDateRange
    : undefined);

const sqlGetPhotosFilmSimulationDateRange = async (
  simulation: FilmSimulation,
) => sql`
  SELECT MIN(taken_at_naive) as start, MAX(taken_at_naive) as end
  FROM photos
  WHERE film_simulation=${simulation} AND
  hidden IS NOT TRUE
`.then(({ rows }) => rows[0]?.start && rows[0]?.end
    ? rows[0] as PhotoDateRange
    : undefined);

const sqlGetUniqueTags = async () => sql`
  SELECT DISTINCT unnest(tags) as tag, COUNT(*)
  FROM photos
  WHERE hidden IS NOT TRUE
  GROUP BY tag
  ORDER BY tag ASC
`.then(({ rows }): Tags => rows.map(({ tag, count }) => ({
    tag: tag as string,
    count: parseInt(count, 10),
  })));

const sqlGetUniqueTagsHidden = async () => sql`
  SELECT DISTINCT unnest(tags) as tag, COUNT(*)
  FROM photos
  GROUP BY tag
  ORDER BY tag ASC
`.then(({ rows }): Tags => rows.map(({ tag, count }) => ({
    tag: tag as string,
    count: parseInt(count, 10),
  })));

const sqlGetUniqueCameras = async () => sql`
  SELECT DISTINCT make||' '||model as camera, make, model, COUNT(*)
  FROM photos
  WHERE hidden IS NOT TRUE
  AND trim(make) <> ''
  AND trim(model) <> ''
  GROUP BY make, model
  ORDER BY camera ASC
`.then(({ rows }): Cameras => rows.map(({ make, model, count }) => ({
    cameraKey: createCameraKey({ make, model }),
    camera: { make, model },
    count: parseInt(count, 10),
  })));

const sqlGetUniqueFilmSimulations = async () => sql`
  SELECT DISTINCT film_simulation, COUNT(*)
  FROM photos
  WHERE hidden IS NOT TRUE AND film_simulation IS NOT NULL
  GROUP BY film_simulation
  ORDER BY film_simulation ASC
`.then(({ rows }): FilmSimulations => rows
    .map(({ film_simulation, count }) => ({
      simulation: film_simulation as FilmSimulation,
      count: parseInt(count, 10),
    })));

export type GetPhotosOptions = {
  sortBy?: 'createdAt' | 'takenAt' | 'priority'
  limit?: number
  offset?: number
  query?: string
  tag?: string
  camera?: Camera
  simulation?: FilmSimulation
  takenBefore?: Date
  takenAfterInclusive?: Date
  includeHidden?: boolean
}

const safelyQueryPhotos = async <T>(callback: () => Promise<T>): Promise<T> => {
  let result: T;

  try {
    result = await callback();
  } catch (e: any) {
    if (MIGRATION_FIELDS_01.some(field => new RegExp(
      `column "${field}" of relation "photos" does not exist`,
      'i',
    ).test(e.message))) {
      console.log('正在运行 migration 01 ...');
      await sqlRunMigration01();
      result = await callback();
    } else if (/relation "photos" does not exist/i.test(e.message)) {
      // If the table does not exist, create it
      console.log('正在创建 photos 表 ...');
      await sqlCreatePhotosTable();
      result = await callback();
    } else if (/endpoint is in transition/i.test(e.message)) {
      // Wait 5 seconds and try again
      await new Promise(resolve => setTimeout(resolve, 5000));
      try {
        result = await callback();
      } catch (e: any) {
        console.log(`sql重试时出错（5000 毫秒后）：${e.message} `);
        throw e;
      }
    } else {
      console.log(`sql出错: ${e.message} `);
      throw e;
    }
  }

  return result;
};

export const getPhotos = async (options: GetPhotosOptions = {}) => {
  const {
    sortBy = PRIORITY_ORDER_ENABLED ? 'priority' : 'takenAt',
    limit = PHOTO_DEFAULT_LIMIT,
    offset = 0,
    query,
    tag,
    camera,
    simulation,
    takenBefore,
    takenAfterInclusive,
    includeHidden,
  } = options;

  let sql = [`
    SELECT photos_ip.city,
            photos_ip.country_name,
            photos_ip.country_code2,
            photos_ip.country_flag,
            photos.*
      FROM photos
              LEFT JOIN photos_ip ON photos_ip.ip = photos.ip
    `];
  let values = [] as (string | number)[];
  let valueIndex = 1;

  // WHERE
  let wheres = [] as string[];
  if (!includeHidden) {
    wheres.push('hidden IS NOT TRUE');
  }
  if (takenBefore) {
    wheres.push(`taken_at > $${valueIndex++}`);
    values.push(takenBefore.toISOString());
  }
  if (takenAfterInclusive) {
    wheres.push(`taken_at <= $${valueIndex++}`);
    values.push(takenAfterInclusive.toISOString());
  }
  if (query) {
    // eslint-disable-next-line max-len
    wheres.push(`CONCAT(title, ' ', caption, ' ', semantic_description) ILIKE $${valueIndex++}`);
    values.push(`%${query.toLocaleLowerCase()}%`);
  }
  if (tag) {
    wheres.push(`$${valueIndex++}=ANY(tags)`);
    values.push(tag);
  }
  if (camera) {
    wheres.push(`LOWER(REPLACE(make, ' ', '-'))=$${valueIndex++}`);
    wheres.push(`LOWER(REPLACE(model, ' ', '-'))=$${valueIndex++}`);
    values.push(parameterize(camera.make, true));
    values.push(parameterize(camera.model, true));
  }
  if (simulation) {
    wheres.push(`film_simulation=$${valueIndex++}`);
    values.push(simulation);
  }
  if (wheres.length > 0) {
    sql.push(`WHERE ${wheres.join(' AND ')}`);
  }

  // ORDER BY
  switch (sortBy) {
  case 'createdAt':
    sql.push('ORDER BY created_at DESC');
    break;
  case 'takenAt':
    sql.push('ORDER BY taken_at DESC');
    break;
  case 'priority':
    sql.push('ORDER BY priority_order ASC, taken_at DESC');
    break;
  }

  // LIMIT + OFFSET
  sql.push(`LIMIT $${valueIndex++} OFFSET $${valueIndex++}`);
  values.push(limit, offset);

  return safelyQueryPhotos(async () => {
    const client = await db.connect();
    return client.query(sql.join(' '), values);
  })
    .then(({ rows }) => rows.map(parsePhotoFromDb));
};

export const getPhotosNearId = async (
  id: string,
  limit: number,
) => {
  const orderBy = PRIORITY_ORDER_ENABLED
    ? 'ORDER BY priority_order ASC, taken_at DESC'
    : 'ORDER BY taken_at DESC';

  return safelyQueryPhotos(async () => {
    const client = await db.connect();
    return client.query(
      `
      WITH twi AS (SELECT photos.*,
                          photos_ip.city,
                          photos_ip.country_name,
                          photos_ip.country_code2,
                          photos_ip.country_flag,
                          row_number()
                          OVER (ORDER BY taken_at DESC) as row_number
                  FROM photos
                            LEFT JOIN photos_ip ON photos_ip.ip = photos.ip
                  WHERE hidden IS NOT TRUE),
          current AS (SELECT row_number FROM twi WHERE id = $1)
        SELECT twi.*
        FROM twi, current
        WHERE twi.row_number >= current.row_number - 1
        LIMIT $2
      `,
      [id, limit]
    );
  })
    .then(({ rows }) => rows.map(parsePhotoFromDb));
};

export const getPhoto = async (id: string): Promise<Photo | undefined> => {
  // Check for photo id forwarding
  // and convert short ids to uuids
  const photoId = translatePhotoId(id);
  return safelyQueryPhotos(() => sqlGetPhoto(photoId))
    .then(({ rows }) => rows.map(parsePhotoFromDb))
    .then(photos => photos.length > 0 ? photos[0] : undefined);
};
export const getPhotosDateRange = () =>
  safelyQueryPhotos(sqlGetPhotosDateRange);
export const getPhotosCount = () =>
  safelyQueryPhotos(sqlGetPhotosCount);
export const getPhotosCountIncludingHidden = () =>
  safelyQueryPhotos(sqlGetPhotosCountIncludingHidden);

// TAGS
export const getUniqueTags = () =>
  safelyQueryPhotos(sqlGetUniqueTags);
export const getUniqueTagsHidden = () =>
  safelyQueryPhotos(sqlGetUniqueTagsHidden);
export const getPhotosTagDateRange = (tag: string) =>
  safelyQueryPhotos(() => sqlGetPhotosTagDateRange(tag));
export const getPhotosTagCount = (tag: string) =>
  safelyQueryPhotos(() => sqlGetPhotosTagCount(tag));

// CAMERAS
export const getUniqueCameras = () =>
  safelyQueryPhotos(sqlGetUniqueCameras);
export const getPhotosCameraDateRange = (camera: Camera) =>
  safelyQueryPhotos(() => sqlGetPhotosCameraDateRange(camera));
export const getPhotosCameraCount = (camera: Camera) =>
  safelyQueryPhotos(() => sqlGetPhotosCameraCount(camera));

// FILM SIMULATIONS
export const getUniqueFilmSimulations = () =>
  safelyQueryPhotos(sqlGetUniqueFilmSimulations);
export const getPhotosFilmSimulationDateRange =
  (simulation: FilmSimulation) => safelyQueryPhotos(() =>
    sqlGetPhotosFilmSimulationDateRange(simulation));
export const getPhotosFilmSimulationCount = (simulation: FilmSimulation) =>
  safelyQueryPhotos(() => sqlGetPhotosFilmSimulationCount(simulation));

export async function latlngInfoService(latlng: string): Promise<string | null>  {
  return latlngInfo(latlng);
}
