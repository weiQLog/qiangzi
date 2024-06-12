import { NextApiRequest } from "next";

/**
 * 提取客户端ip
 * @param req NextApiRequest
 * @returns
 */
export function getClientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  console.log(req.headers);
  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    undefined
  );
}
