import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Camera, Plus, Trash2, X } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { ImagePickerService, PickedImage } from '../services/ImagePickerService';
import { createSceneSubmission, uploadSubmissionImage } from '../api/submissions';

interface DialogueRow {
  speaker: string;
  text: string;
}

export const SubmitSceneScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [situation, setSituation] = useState('');
  const [lines, setLines] = useState<DialogueRow[]>([{ speaker: '', text: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateLine = (index: number, patch: Partial<DialogueRow>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { speaker: '', text: '' }]);

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const handlePickPhoto = async () => {
    const result = await ImagePickerService.pickImage();
    if (result) setPhoto(result);
  };

  const handleSubmit = async () => {
    const validLines = lines
      .map((l) => ({ speaker: l.speaker.trim(), text: l.text.trim() }))
      .filter((l) => l.text.length > 0);

    if (!situation.trim() || validLines.length === 0) {
      setError(t('submitSceneFillFields'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (photo) {
        imageUrl = await uploadSubmissionImage(photo.uri, photo.fileName, photo.mimeType);
      }
      await createSceneSubmission(situation.trim(), validLines, imageUrl);
      navigation.navigate('MySubmissions');
    } catch (e: any) {
      setError(e?.message || t('submitSceneFillFields'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('submitSceneTitle')}</Text>
      <Text style={styles.sub}>{t('submitSceneSub')}</Text>

      <Text style={styles.label}>{t('submitScenePhoto')}</Text>
      {photo ? (
        <View style={styles.photoPreviewWrap}>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhoto(null)}>
            <X color={COLORS.white} size={16} />
          </TouchableOpacity>
        </View>
      ) : (
        ImagePickerService.available() && (
          <TouchableOpacity style={styles.photoAddBtn} onPress={handlePickPhoto}>
            <Camera color={COLORS.primary} size={20} />
            <Text style={styles.photoAddText}>{t('submitScenePhotoAdd')}</Text>
          </TouchableOpacity>
        )
      )}

      <Text style={styles.label}>{t('submitSceneSituation')}</Text>
      <TextInput
        style={styles.textArea}
        placeholder={t('submitSceneSituationPlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
        value={situation}
        onChangeText={setSituation}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>{t('submitSceneDialogues')}</Text>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <TextInput
              style={styles.speakerInput}
              placeholder={t('submitSceneSpeaker')}
              placeholderTextColor={COLORS.textSecondary}
              value={line.speaker}
              onChangeText={(v) => updateLine(i, { speaker: v })}
            />
            {lines.length > 1 && (
              <TouchableOpacity onPress={() => removeLine(i)}>
                <Trash2 color={COLORS.error} size={18} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.lineInput}
            placeholder={t('submitSceneLine')}
            placeholderTextColor={COLORS.textSecondary}
            value={line.text}
            onChangeText={(v) => updateLine(i, { text: v })}
            multiline
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
        <Plus color={COLORS.primary} size={16} />
        <Text style={styles.addLineText}>{t('submitSceneAddLine')}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitBtnText}>{t('submitSceneSubmit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  label: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    marginBottom: 10,
  },
  photoAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },
  photoAddText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  photoPreviewWrap: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.l,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: 14,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  lineCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: 12,
    marginBottom: 10,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  speakerInput: {
    flex: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  lineInput: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  addLineText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
