import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react-native';

import { FONT_FAMILY } from '../../../theme/typography';
import { getSceneVerbTags, markVerbMeaningSeen } from '../../../api/verbs';

// هر معنا در هر اجرای اپ فقط یک‌بار «دیده‌شده» به سرور گزارش می‌شود.
const reportedSeen = new Set<string>();

/**
 * اگر در جمله‌ی فعلی یک فعل چندمعنایی (تأییدشده‌ی ادمین) باشد، یک چیپ نشان
 * می‌دهد: «get این‌جا یعنی رسیدن · ۷ معنای دیگر ←» که به صفحه‌ی فعل می‌رود.
 * دیده‌شدن همین جمله در درس، آن معنا را «دیده‌شده» ثبت می‌کند.
 */
export const DialogueVerbTags: React.FC<{
  dialogueId?: string;
  accentColor: string;
  accentLightColor: string;
  t: (key: string) => string;
}> = ({ dialogueId, accentColor, accentLightColor, t }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const sceneId: string | undefined = route.params?.scenarioId;

  const { data } = useQuery({
    queryKey: ['verbs', 'scene', sceneId],
    queryFn: () => getSceneVerbTags(sceneId!),
    enabled: !!sceneId,
    staleTime: 10 * 60 * 1000,
  });
  const tags = (data || []).filter((tag) => tag.dialogue_id === dialogueId);

  useEffect(() => {
    for (const tag of tags) {
      if (reportedSeen.has(tag.meaning_id)) continue;
      reportedSeen.add(tag.meaning_id);
      markVerbMeaningSeen(tag.meaning_id).catch(() => reportedSeen.delete(tag.meaning_id));
    }
  }, [tags]);

  if (tags.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <TouchableOpacity
          key={`${tag.verb_id}-${tag.meaning_id}`}
          style={[styles.chip, { backgroundColor: accentLightColor }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VerbDetail', { verbId: tag.verb_id })}
        >
          <Layers size={13} color={accentColor} />
          <Text style={[styles.text, { color: accentColor }]} numberOfLines={2}>
            {t('verbTagHere').replace('{form}', tag.form).replace('{meaning}', tag.meaning_fa)}
            {tag.other_meaning_count > 0
              ? ` · ${t('verbTagMore').replace('{n}', String(tag.other_meaning_count))}`
              : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  text: {
    flex: 1,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
});
