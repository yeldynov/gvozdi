import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge } from '@/components/progress-visuals';
import { BackHeader, Card, Screen, Txt } from '@/components/ui';
import { ACHIEVEMENTS, achievementEarnedAt, achievementProgress, achievementStage } from '@/lib/practice';
import { Tree } from '@/skins/herbarium/progress-visuals';
import { useStore } from '@/store';
import { radius, space, useColors, useSkin } from '@/theme';

export default function AchievementDetail() {
  const { t, i18n } = useTranslation();
  const c = useColors();
  const herb = useSkin() === 'herbarium';
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessions = useStore((s) => s.sessions);
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  const earnedAt = a && achievementEarnedAt(a.id, sessions);
  const value = a ? achievementProgress(a, sessions) : 0;

  return (
    <Screen>
      <BackHeader title={t('progress.title')} fallback="/progress" />
      {!a ? (
        <Txt>{t('achievements.notFound')}</Txt>
      ) : (
        <View style={{ alignItems: 'center', gap: space[3], paddingTop: herb ? 0 : space[7] }}>
          {herb ? (
            // The stage at the shared scale on its soil line, as on the life-cycle plate; faded until grown.
            <Card style={{ alignSelf: 'stretch', alignItems: 'center', paddingVertical: space[2] }}>
              <View aria-hidden style={{ opacity: earnedAt ? 1 : 0.55 }}>
                <Tree stage={achievementStage(a)} size={240} muted={!earnedAt} />
              </View>
            </Card>
          ) : (
            <Badge a={a} earned={!!earnedAt} size={104} />
          )}
          <Txt variant="display" style={{ textAlign: 'center', marginTop: space[3] }}>
            {t(`achievements.${a.id}.title`)}
          </Txt>
          <Txt style={{ color: c.text2, textAlign: 'center' }}>{t(`achievements.${a.id}.desc`)}</Txt>
          {earnedAt ? (
            <Txt variant="caption">
              {t('achievements.earnedOn', {
                date: new Date(earnedAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }),
              })}
            </Txt>
          ) : (
            <View style={{ alignSelf: 'stretch', gap: space[2], marginTop: space[4] }}>
              <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.divider }}>
                <View
                  style={{ width: `${(value / a.target) * 100}%`, height: 6, borderRadius: radius.pill, backgroundColor: herb ? c.primary : c.accent }}
                />
              </View>
              <Txt variant="caption" style={{ textAlign: 'center' }}>
                {t('achievements.progress', { value, target: a.target })}
              </Txt>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
