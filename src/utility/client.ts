import { ResponseData } from '@/app/api/ip/route'
import { IpInfoDB } from '@/photoIp'
import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { convertKeysToCamelCase } from './obj'
import { Client } from '@googlemaps/google-maps-services-js'

/**
 * 提取客户端ip
 * @param req NextApiRequest
 * @returns
 */
export function getClientIp(req: Request): string | undefined {
  let ip = req.headers.get('x-forwarded-for') as string | undefined
  // 如果头部存在且有多个 IP 地址，选择第一个作为客户端 IP 地址
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  // 处理可能的 IPv6 转换为 IPv4 的情况
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '')
  }
  return ip
}

/**
 * 请求api 路由获取ip
 */
export async function requestClientIp(): Promise<string | undefined> {
  const response = await fetch('/api/ip')
  let data = (await response.json()) as ResponseData
  if (data?.success) {
    return data?.data as string
  }
  return undefined
}

/**
 * 查询ip的详细信息
 * @param ip ip地址
 * @returns
 */
export async function ipInfo(ip: string): Promise<IpInfoDB | null> {
  // const ip = getClientIp(req);
  try {
    const response = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_KEY}&ip=${ip}`
    )
    const data = await response.json()
    return convertKeysToCamelCase(data) as IpInfoDB
  } catch (error) {
    console.error('Failed to fetch IP info:', error)
    return null
  }
}

export async function latlngInfo(latlng: string): Promise<string | null> {
  // try {
  //   console.log('fetch_url', `https://maps.google.com/maps/api/geocode/xml?latlng=${latlng}&sensor=false&key=${process.env.NEXT_PUBLIC_GMAP_API_KEY}`);
  //   const response = await fetch(
  //     `https://maps.google.com/maps/api/geocode/xml?latlng=${latlng}&sensor=false&key=${process.env.NEXT_PUBLIC_GMAP_API_KEY}`
  //   )
  //   const xmlText = await response.text()
  //   return xmlText;
  // } catch (error) {
  //   console.error('Failed to gmap geocode ', error)
  //   return null
  // }
  const client = new Client({})
  const apiKey = process.env.NEXT_PUBLIC_GMAP_API_KEY || '';
  client
    .elevation({
      params: {
        locations: [{ lat: 45, lng: -110 }],
        key: apiKey,
      },
      timeout: 1000, // milliseconds
    })
    .then((r) => {
      console.log('data:::::', r.data)
      return 'CN';
    })
    .catch((e) => {
      console.error("出错", e)
      return null;
    })
    return null;
}
