import Link from 'next/link';
import { FaRegEdit } from 'react-icons/fa';

export default function EditButton ({
  href
}: {
  href: string,
  label?: string,
}) {
  return (
    <Link
      href={href}
      className="button"
    >
      <FaRegEdit className="translate-y-[-0.5px]" />
    </Link>
  );
}
