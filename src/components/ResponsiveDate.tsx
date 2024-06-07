import { formatDate } from '@/utility/date';
import moment from 'moment';

export default function ResponsiveDate({
  date,
}: {
  date: Date
}) {
  return (
    <>
      {/* Mobile */}
      <span className="inline-block sm:hidden">
        {moment(date).format('YYYY-MM-DD HH:mm:ss')}
      </span>
      {/* Desktop */}
      <span className="hidden sm:inline-block">
        {moment(date).format('YYYY-MM-DD HH:mm:ss')}
      </span>
    </>
  );
}
