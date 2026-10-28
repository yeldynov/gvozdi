import Feather from '@expo/vector-icons/Feather';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { GuidePic } from '@/components/guide-pics';
import { PAGES, SUPPORT_URL, type Page, type Section } from '@/components/menu';
import { Art, BackHeader, Button, Screen, Txt } from '@/components/ui';
import { space, useColors } from '@/theme';

/** Guide, FAQ, About and journal articles; the text lives in i18n under `read.<id>`. */
export default function Read() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meta = PAGES[id];
  if (!meta) return <Redirect href="/" />;
  const page = t(`read.${id}`, { returnObjects: true }) as Page;

  return (
    <Screen>
      <BackHeader title={meta.article ? t('menu.journal') : t('common.back')} fallback={meta.article ? '/journal' : '/'} />
      <Art name={meta.art} size={180} />
      <Txt variant="display">{page.title}</Txt>
      <Txt variant="caption" style={{ fontSize: 16, lineHeight: 22 }}>
        {page.lead}
      </Txt>
      {meta.accordion ? (
        <View>
          {page.sections.map((s, i) => (
            <Fold key={i} section={s} />
          ))}
        </View>
      ) : (
        page.sections.map((s, i) => (
          <View key={i} style={{ gap: space[3] }}>
            {s.h && <Txt variant="title">{s.h}</Txt>}
            {s.p.map((p, j) => {
              const pic = meta.pics?.[i]?.[j];
              return pic ? (
                <View key={j} style={styles.pic}>
                  <GuidePic name={pic} />
                  <Txt style={{ flex: 1 }}>{p}</Txt>
                </View>
              ) : (
                <Txt key={j}>{p}</Txt>
              );
            })}
          </View>
        ))
      )}
      {!meta.article && <Button ghost label={t('settings.write')} onPress={() => Linking.openURL(SUPPORT_URL)} />}
    </Screen>
  );
}

/** Question that opens its answer on tap. */
function Fold({ section }: { section: Section }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.fold, { borderColor: c.divider }]}>
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen(!open)} style={styles.foldHead}>
        <Txt style={{ flex: 1, fontSize: 17 }}>{section.h}</Txt>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={c.text2} />
      </Pressable>
      {open && (
        <View style={{ gap: space[2], paddingBottom: space[4] }}>
          {section.p.map((p, j) => (
            <Txt key={j} style={{ color: c.text2 }}>
              {p}
            </Txt>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pic: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  fold: { borderBottomWidth: StyleSheet.hairlineWidth },
  foldHead: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
});
