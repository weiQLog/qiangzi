import { getClientIp, ipInfo } from '@/utility/client'
import { IncomingMessage } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'

export type ResponseData = {
  msg: string
  success: boolean
  data: object | string | undefined
}

export async function GET(req: Request, res: NextResponse<ResponseData>) {
  // let myIp = getClientIp(req)
  let myIp = `103.156.243.57`
  // let ipRes = await ipInfo(myIp)
  return NextResponse.json({
    msg: 'success',
    success: true,
    data: myIp,
  })
}
