import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Screen, Txt } from '@/components/ui';
import { formatDuration, totals } from '@/lib/practice';
import { useStore } from '@/store';

export default function Progress() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const sum = totals(sessions);
  const rows = [
    [t('progress.sessions'), String(sum.count)],
    [t('progress.total'), formatDuration(sum.totalSec)],
    [t('progress.average'), formatDuration(sum.avgSec)],
    [t('progress.longest'), formatDuration(sum.longestSec)],
  ];

  return (
    <Screen>
      <Txt variant="display">{t('progress.title')}</Txt>
      <Card>
        {rows.map(([label, value]) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="caption">{label}</Txt>
            <Txt>{value}</Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
