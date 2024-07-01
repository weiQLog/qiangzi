'use client';
import React from 'react';
import './imagePin.css'

export default function ImagePin({src}: {src:string}) {
  
  return (
    <div className='wrapper'>
      {<div className='img'><img  src={src}/></div>}
    </div>
  )
}