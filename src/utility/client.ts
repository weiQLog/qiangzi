import { IncomingMessage } from "http";
import { NextApiRequest } from "next";

/**
 * 提取客户端ip
 * @param req NextApiRequest
 * @returns
 */
export function getClientIp(req: Request): string | undefined {
  let ip = req.headers.get('x-forwarded-for') as string | undefined;
  // 如果头部存在且有多个 IP 地址，选择第一个作为客户端 IP 地址
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // 处理可能的 IPv6 转换为 IPv4 的情况
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip;
}
