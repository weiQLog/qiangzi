'use client';
import React from 'react';
import './widget.css'

type widgetSpc = {
  WIDGET_ROWS: number, // 小部件行数
  WIDGET_BOX_WITH: number // 部件盒子宽度
}
/**
 * 部件盒子-大号，
 * 大号的盒子占满屏幕宽度，高度为3个部件单位高度
 * @param param0 
 */
export function LargeBox({ children }: { children?: React.ReactNode }) {
  let widget:widgetSpc =  {
    WIDGET_ROWS: 7,
    WIDGET_BOX_WITH: 100
  }
  let style = {
    width: `100%`,
    height: `${widget.WIDGET_ROWS * 10}vh`
  }

  return (
    <div className='widget_basic' style={style}>
      <div className='chidren'>{children}</div>
    </div>
  )
}