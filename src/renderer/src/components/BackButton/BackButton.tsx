import { Link } from 'react-router';
import { BASE_URL } from '@renderer/common/constants';
import LeftArrow from '@renderer/components/svgs/LeftArrow';

export default function BackButton() {
  return (
    <Link
      to={`${BASE_URL}/home`}
      className='inline-flex items-center gap-1.5 self-start text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
    >
      <LeftArrow className='size-4' />
      Back
    </Link>
  );
}
