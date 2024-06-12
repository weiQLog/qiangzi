import { getClientIp } from '@/utility/client'
import { IncomingMessage } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'

type ResponseData = {
  msg: string,
  success: boolean,
  data: object | string | undefined
}

export function GET(
  req: Request,
  res: NextResponse<ResponseData>
) {
  let myIp = getClientIp(req)
  return NextResponse.json({
    msg: "",
    success: true,
    data: myIp
  });
  // res.status(200).json({
  //   msg: "",
  //   success: true,
  //   data: myIp
  // });
}
