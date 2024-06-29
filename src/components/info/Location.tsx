import { GiPositionMarker } from "react-icons/gi";

export default function LocationTag({
  locationName
}: {locationName: string}) {
  return (
  <div className='text-slate-400 text-sm flex flex-row'>
    <GiPositionMarker size={17} />
    {locationName || ''}
  </div>
  );
}

