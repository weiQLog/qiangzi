import { getClientIp, ipInfo } from '@/utility/client'
import { NextResponse } from 'next/server'

export type ResponseData = {
  msg: string
  success: boolean
  data: object | string | undefined
}

export async function GET(req: Request, res: NextResponse<ResponseData>) {
  let myIp = getClientIp(req)
  // myIp = ``
  console.log('myIp', myIp);
  // let ipRes = await ipInfo(myIp)
  return NextResponse.json({
    msg: 'success',
    success: true,
    data: myIp,
  })
}
