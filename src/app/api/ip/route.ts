import { getClientIp } from '@/utility/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'

type ResponseData = {
  msg: string,
  success: boolean,
  data: object | string | undefined
}

export function GET(
  req: NextApiRequest,
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
