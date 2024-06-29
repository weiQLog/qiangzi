import { ResponseData } from '@/app/api/ip/route'
import { IpInfoDB } from '@/photoIp'
import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { convertKeysToCamelCase } from './obj'

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
  const response = await fetch('/api/ip');
  let data = await response.json() as ResponseData;
  if(data?.success) {
    return data?.data as string;
  }
  return undefined;
}

export async function ipInfo(ip: string): Promise<IpInfoDB | null> {
  // const ip = getClientIp(req);
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()
    return convertKeysToCamelCase(data) as IpInfoDB
  } catch (error) {
    console.error('Failed to fetch IP info:', error)
    return null
  }
}
