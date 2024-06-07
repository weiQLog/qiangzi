import ResponsiveDate from '@/components/ResponsiveDate';
import { Photo } from '.';
import { useMemo } from 'react';

export default function PhotoDate({
  photo: { takenAtNaive },
}: {
  photo: Photo
}) {
  // 缓存计算结果
  const date = useMemo(() => {
    const date = new Date(takenAtNaive);
    return isNaN(date.getTime()) ? new Date() : date;
  }, [takenAtNaive]);
  return (
    <ResponsiveDate {...{ date }} />
  );
}
