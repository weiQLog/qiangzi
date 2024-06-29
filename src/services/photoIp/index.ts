import { PhotoDbInsert } from '@/photo'
import { IpInfoDB, PhotoIpDbInsert } from '@/photoIp'
import { ipInfo } from '@/utility/client'
import { db, sql } from '@vercel/postgres'
import { NextApiRequest, NextApiResponse } from 'next/types'

/**
 * 创建photos_ip表结构
 * @returns
 */
const sqlCreatePhotosIpTable = () =>
  sql`
      CREATE TABLE IF NOT EXISTS photos_ip (
        ip VARCHAR(45) NOT NULL PRIMARY KEY,
        network CIDR NOT NULL,
        version VARCHAR(10) NOT NULL,
        city VARCHAR(100),
        region VARCHAR(100),
        region_code VARCHAR(10),
        country VARCHAR(2),
        country_name VARCHAR(100),
        country_code VARCHAR(2),
        country_code_iso3 VARCHAR(3),
        country_capital VARCHAR(100),
        country_tld VARCHAR(10),
        continent_code VARCHAR(2),
        in_eu BOOLEAN,
        postal VARCHAR(20),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        timezone VARCHAR(50),
        utc_offset VARCHAR(10),
        country_calling_code VARCHAR(10),
        currency VARCHAR(10),
        currency_name VARCHAR(50),
        languages VARCHAR(255),
        country_area DOUBLE PRECISION,
        country_population BIGINT,
        asn VARCHAR(20),
        org VARCHAR(255)
    )`

export const insert = (photo: PhotoIpDbInsert) =>
  safelyQueryPhotosIp(
    () => sql`
      INSERT INTO photos_ip (
        ip, 
        network, 
        version, 
        city, 
        region, 
        region_code, 
        country, 
        country_name, 
        country_code, 
        country_code_iso3, 
        country_capital, 
        country_tld, 
        continent_code, 
        in_eu, 
        postal, 
        latitude, 
        longitude, 
        timezone, 
        utc_offset, 
        country_calling_code, 
        currency, 
        currency_name, 
        languages, 
        country_area, 
        country_population, 
        asn, 
        org
      ) VALUES (
        ${photo.ip},
        ${photo.network},
        ${photo.version},
        ${photo.city},
        ${photo.region},
        ${photo.regionCode},
        ${photo.country},
        ${photo.countryName},
        ${photo.countryCode},
        ${photo.countryCodeIso3},
        ${photo.countryCapital},
        ${photo.countryTld},
        ${photo.continentCode},
        ${photo.inEu},
        ${photo.postal},
        ${photo.latitude},
        ${photo.longitude},
        ${photo.timezone},
        ${photo.utcOffset},
        ${photo.countryCallingCode},
        ${photo.currency},
        ${photo.currencyName},
        ${photo.languages},
        ${photo.countryArea},
        ${photo.countryPopulation},
        ${photo.asn},
        ${photo.org}
        )
        `
  )

/**
 * 查找ip
 * @param ip ip
 * @returns 
 */
export const getIp = (ip: string) => {
  return safelyQueryPhotosIp(
    () => sql<PhotoIpDbInsert>`SELECT * FROM photos_ip WHERE ip=${ip} LIMIT 1`
  )
}

export const sqlInsertPhotosIp = async (
  photo: PhotoDbInsert,
  photoIp: string
) => {
  let ip = (await ipInfo(photoIp)) as IpInfoDB
  let photoIpDb: PhotoIpDbInsert = {
    ...ip,
  }
  console.log(`photoIpDb:`, photoIpDb);
  return insert(photoIpDb)
}

/**
 * 处理可能出现的各种错误情况
 * @param callback
 * @returns
 */
const safelyQueryPhotosIp = async <T>(
  callback: () => Promise<T>
): Promise<T> => {
  let result: T
  try {
    result = await callback()
  } catch (e: any) {
    if (/relation "photos_ip" does not exist/i.test(e.message)) {
      // 如果表不存在创建
      console.log('正在创建 photos_ip 表 ...')
      await sqlCreatePhotosIpTable()
      result = await callback()
    } else if (/endpoint is in transition/i.test(e.message)) {
      // 检查端点过渡错误 Wait 5 seconds and try again
      await new Promise((resolve) => setTimeout(resolve, 5000))
      try {
        result = await callback()
      } catch (e: any) {
        console.log(`sql重试时出错（5000 毫秒后）： ${e.message} `)
        throw e
      }
    } else {
      console.log(`sql出错: ${e.message} `)
      throw e
    }
  }

  return result
}
