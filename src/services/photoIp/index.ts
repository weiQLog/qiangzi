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
      ip VARCHAR(15) PRIMARY KEY, -- IP地址，主键
      continent_code VARCHAR(2), -- 大陆代码
      continent_name VARCHAR(50), -- 大陆名称
      country_code2 VARCHAR(2), -- 国家代码（2位）
      country_code3 VARCHAR(3), -- 国家代码（3位）
      country_name VARCHAR(100), -- 国家名称
      country_name_official VARCHAR(100), -- 国家官方名称
      country_capital VARCHAR(50), -- 国家首都
      state_prov VARCHAR(50), -- 省或州
      state_code VARCHAR(50), -- 省或州代码
      district VARCHAR(50), -- 区
      city VARCHAR(50), -- 城市
      zipcode VARCHAR(10), -- 邮政编码
      latitude DECIMAL(9,6), -- 纬度
      longitude DECIMAL(9,6), -- 经度
      is_eu BOOLEAN, -- 是否属于欧盟
      calling_code VARCHAR(10), -- 国际电话区号
      country_tld VARCHAR(5), -- 国家顶级域名
      languages VARCHAR(100), -- 使用语言
      country_flag VARCHAR(100), -- 国家国旗URL
      geoname_id BIGINT, -- GeoName ID
      isp VARCHAR(100), -- 互联网服务提供商
      connection_type VARCHAR(50), -- 连接类型
      organization VARCHAR(100), -- 组织名称
      country_emoji VARCHAR(10), -- 国家表情符号
      currency_code VARCHAR(3), -- 货币代码
      currency_name VARCHAR(50), -- 货币名称
      currency_symbol VARCHAR(3), -- 货币符号
      time_zone_name VARCHAR(50), -- 时区名称
      time_zone_offset INTEGER, -- 时区偏移量
      time_zone_offset_with_dst INTEGER, -- 含夏令时的时区偏移量
      time_zone_current_time TIMESTAMPTZ, -- 当前时间
      time_zone_current_time_unix DOUBLE PRECISION, -- 当前时间的Unix时间戳
      time_zone_is_dst BOOLEAN, -- 是否为夏令时
      time_zone_dst_savings INTEGER, -- 夏令时的节约时间
      time_zone_dst_exists BOOLEAN, -- 是否存在夏令时
      time_zone_dst_start VARCHAR(1000), -- 夏令时开始时间
      time_zone_dst_end VARCHAR(1000) -- 夏令时结束时间)    
    `

export const insert = (photo: PhotoIpDbInsert) =>
  safelyQueryPhotosIp(
    () => sql`
      INSERT INTO photos_ip (
        ip,
        continent_code,
        continent_name,
        country_code2,
        country_code3,
        country_name,
        country_name_official,
        country_capital,
        state_prov,
        state_code,
        district,
        city,
        zipcode,
        latitude,
        longitude,
        is_eu,
        calling_code,
        country_tld,
        languages,
        country_flag,
        geoname_id,
        isp,
        connection_type,
        organization,
        country_emoji,
        currency_code,
        currency_name,
        currency_symbol,
        time_zone_name,
        time_zone_offset,
        time_zone_offset_with_dst,
        time_zone_current_time,
        time_zone_current_time_unix,
        time_zone_is_dst,
        time_zone_dst_savings,
        time_zone_dst_exists,
        time_zone_dst_start,
        time_zone_dst_end
    ) VALUES (
        ${photo.ip},
        ${photo.continentCode},
        ${photo.continentName},
        ${photo.countryCode2},
        ${photo.countryCode3},
        ${photo.countryName},
        ${photo.countryNameOfficial},
        ${photo.countryCapital},
        ${photo.stateProv},
        ${photo.stateCode},
        ${photo.district},
        ${photo.city},
        ${photo.zipcode},
        ${photo.latitude},
        ${photo.longitude},
        ${photo.isEu},
        ${photo.callingCode},
        ${photo.countryTld},
        ${photo.languages},
        ${photo.countryFlag},
        ${photo.geonameId},
        ${photo.isp},
        ${photo.connectionType},
        ${photo.organization},
        ${photo.countryEmoji},
        ${photo.currencyCode},
        ${photo.currencyName},
        ${photo.currencySymbol},
        ${photo.timeZoneName},
        ${photo.timeZoneOffset},
        ${photo.timeZoneOffsetWithDst},
        ${photo.timeZoneCurrentTime},
        ${photo.timeZoneCurrentTimeUnix},
        ${photo.timeZoneIsDst},
        ${photo.timeZoneDstSavings},
        ${photo.timeZoneDstExists},
        ${photo.timeZoneDstStart},
        ${photo.timeZoneDstEnd}
    )`
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
  if(ip) {
    let photoIpDb: PhotoIpDbInsert = {
      ...ip,
    }
    console.log(`photoIpDb:`, photoIpDb);
    return insert(photoIpDb)
  }
  return ip;
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
