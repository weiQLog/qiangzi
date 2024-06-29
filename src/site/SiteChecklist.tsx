import { generateAuthSecret } from '@/auth';
import SiteChecklistClient from './SiteChecklistClient';
import { CONFIG_CHECKLIST_STATUS } from '@/site/config';

export default async function SiteChecklist() {
  // const secret = await generateAuthSecret();
  const secret = `3af5ecb76ab65f0587f3475d38e3e5f7`;
  return (
    <SiteChecklistClient {...{
      ...CONFIG_CHECKLIST_STATUS,
      secret,
    }} />
  );
}
