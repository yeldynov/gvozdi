import { useTranslation } from 'react-i18next';

import { Screen, Txt } from '@/components/ui';

// ponytail: placeholder until the session timer (step 2)
export default function Practice() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Txt variant="display">{t('practice.title')}</Txt>
      <Txt variant="caption">{t('practice.soon')}</Txt>
    </Screen>
  );
}
