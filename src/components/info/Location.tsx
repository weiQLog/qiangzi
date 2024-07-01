export default function LocationTag({
  locationName,
  imgSrc
}: {locationName: string, imgSrc?: string}) {
  let imgStyle = {
    verticalAlign: 'middle',
    maxHeight: '1.25em',
    width: 'auto'
  }
  return (
  <div className='text-slate-400 text-sm flex flex-row'>
    {/* <GiPositionMarker size={17} /> */}
    <img src={imgSrc} style={imgStyle}/>
    {locationName || ''}
  </div>
  );
}

