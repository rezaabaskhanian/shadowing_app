import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  Languages,
  LogOut,
  Plus,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react-native';

import { COLORS, BORDER_RADIUS, SPACING, hexToRgba } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePracticeSettings, REPEAT_OPTIONS, HIGHLIGHT_COLOR_OPTIONS } from '../data/PracticeSettingsContext';
import { useNotifications, ReminderTime, ContentSource, MAX_REMINDER_TIMES } from '../data/NotificationContext';
import { useVocab, isDue } from '../data/VocabContext';
import { useScenes } from '../data/ScenesContext';
import { useToast } from '../data/ToastContext';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const TimePickerModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: (time: ReminderTime) => void;
}> = ({ visible, onCancel, onConfirm }) => {
  const { language, t } = useLanguage();
  const rtl = language === 'fa';
  const row = rtl ? styles.rowReverse : null;
  const [hour, setHour] = useState('20');
  const [minute, setMinute] = useState('00');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.timeModalBackdrop}>
        <View style={styles.timeModalCard}>
          <Text style={styles.timeModalTitle}>{t('pickReminderTime')}</Text>
          <Text style={styles.timeModalPreview}>{`${hour}:${minute}`}</Text>

          <View style={[styles.timeColumnRow, row]}>
            <View style={styles.timeColumn}>
              <Text style={styles.subOptionLabel}>{t('hour')}</Text>
              <ScrollView style={styles.timeColumnScroll} showsVerticalScrollIndicator={false}>
                {HOUR_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeCell, hour === h && styles.timeCellActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.pillText, hour === h && styles.pillTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.subOptionLabel}>{t('minute')}</Text>
              <ScrollView style={styles.timeColumnScroll} showsVerticalScrollIndicator={false}>
                {MINUTE_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timeCell, minute === m && styles.timeCellActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.pillText, minute === m && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[styles.timeModalActions, row]}>
            <TouchableOpacity style={styles.pillBtn} onPress={onCancel}>
              <Text style={styles.pillText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillBtn, styles.pillBtnActive]}
              onPress={() => onConfirm(`${hour}:${minute}`)}
            >
              <Text style={[styles.pillText, styles.pillTextActive]}>{t('addReminderTime')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { language, setLanguage, t } = useLanguage();
  const rtl = language === 'fa';
  const row = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const Chevron = rtl ? ChevronLeft : ChevronRight;

  const {
    studyReminderEnabled,
    setStudyReminderEnabled,
    studyReminderTimes,
    addStudyReminderTime,
    removeStudyReminderTime,
    contentNotificationEnabled,
    setContentNotificationEnabled,
    contentSource,
    setContentSource,
    triggerTestNotification,
  } = useNotifications();

  const { repeatsPerStep, setRepeatsPerStep, highlightColor, setHighlightColor } = usePracticeSettings();
  const { logout } = useAuth();
  const toast = useToast();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { box } = useVocab();
  const { scenes } = useScenes();

  const handleAddReminderTime = (time: ReminderTime) => {
    setTimePickerOpen(false);
    if (studyReminderTimes.includes(time)) {
      toast.info(t('reminderTimeDuplicate'));
      return;
    }
    if (!addStudyReminderTime(time)) {
      toast.warning(t('reminderTimeLimitReached'));
    }
  };

  const handleSendTestNotification = () => {
    const source = contentSource;
    let type: 'leitner' | 'sentence' =
      source === 'leitner' ? 'leitner' : source === 'sentences' ? 'sentence' : Math.random() > 0.5 ? 'leitner' : 'sentence';

    const sentencePool = scenes.flatMap((s) =>
      (s.hotspots || [])
        .filter((h) => h.dialogue && h.translation)
        .map((h) => ({ text: h.dialogue, translation: h.translation, scene: s.title }))
    );

    if (type === 'leitner' && box.length === 0) type = 'sentence';
    if (type === 'sentence' && sentencePool.length === 0) type = 'leitner';

    if (type === 'leitner' && box.length === 0) {
      Alert.alert(t('noContentForTestNotification'));
      return;
    }
    if (type === 'sentence' && sentencePool.length === 0) {
      Alert.alert(t('noContentForTestNotification'));
      return;
    }

    if (type === 'leitner') {
      const dueWords = box.filter(isDue);
      const word = (dueWords.length > 0 ? dueWords : box)[Math.floor(Math.random() * (dueWords.length > 0 ? dueWords.length : box.length))];
      triggerTestNotification({
        id: Date.now().toString(),
        type: 'leitner',
        title: `📚 Leitner Word Review (Level ${word.level})`,
        body: word.word,
        translation: word.meaning,
        sourceLabel: 'Leitner Box',
      });
    } else {
      const sentence = sentencePool[Math.floor(Math.random() * sentencePool.length)];
      triggerTestNotification({
        id: Date.now().toString(),
        type: 'sentence',
        title: `🎙 Lesson Shadowing (${sentence.scene})`,
        body: `"${sentence.text}"`,
        translation: sentence.translation,
        sourceLabel: 'Lesson Scenario',
      });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={[styles.pageHeadRow, row]}>
        <View style={rtl ? styles.alignEnd : styles.alignStart}>
          <Text style={[styles.pageTitle, ta]}>{t('settingsTab')}</Text>
          <Text style={[styles.pageSubTight, ta]}>{t('settingsSub')}</Text>
        </View>
      </View>

      {/* Language Setting Card */}
      <View style={styles.settingCard}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#EEF2FF' }]}>
            <Languages size={18} color="#2563EB" />
          </View>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.settingCardTitle, ta]}>{t('appLanguage')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('appLanguageSub')}</Text>
          </View>
        </View>

        <View style={[styles.langSegmented, row]}>
          <TouchableOpacity
            style={[styles.langSegment, language === 'fa' && styles.langSegmentActive]}
            onPress={() => setLanguage('fa')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langSegmentText, language === 'fa' && styles.langSegmentTextActive]}>
              فارسی (Persian)
            </Text>
            {language === 'fa' && <Check size={14} color="#FF6422" strokeWidth={3} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langSegment, language === 'en' && styles.langSegmentActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langSegmentText, language === 'en' && styles.langSegmentTextActive]}>
              English (انگلیسی)
            </Text>
            {language === 'en' && <Check size={14} color="#FF6422" strokeWidth={3} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Practice Settings Card */}
      <View style={styles.settingCard}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#E6F6EE' }]}>
            <Repeat color="#059669" size={18} />
          </View>
          <Text style={styles.settingCardTitle}>{t('practiceSettingsTitle')}</Text>
        </View>

        <Text style={[styles.optionTitle, ta]}>{t('repeatsPerStepLabel')}</Text>
        <Text style={[styles.optionSub, ta]}>{t('repeatsPerStepSub')}</Text>

        <View style={[styles.segmented, row]}>
          {REPEAT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.segment, repeatsPerStep === option && styles.segmentActive]}
              onPress={() => setRepeatsPerStep(option)}
            >
              <Text style={[styles.segmentText, repeatsPerStep === option && styles.segmentTextActive]}>
                {option === 0 ? '∞' : `${option}×`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dividerLine} />

        <Text style={[styles.optionTitle, ta]}>{t('highlightColorLabel')}</Text>
        <Text style={[styles.optionSub, ta]}>{t('highlightColorSub')}</Text>

        <View style={[styles.colorSwatchRow, row, { marginTop: 12 }]}>
          {HIGHLIGHT_COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorSwatchRing, highlightColor === color && { borderColor: color }]}
              onPress={() => setHighlightColor(color)}
              accessibilityRole="radio"
              accessibilityState={{ selected: highlightColor === color }}
            >
              <View style={[styles.colorSwatch, { backgroundColor: color }]}>
                {highlightColor === color && <Check color={COLORS.white} size={16} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Preview */}
        <View style={styles.highlightPreview}>
          <Text style={[styles.highlightPreviewEn, ta]}>
            <Text style={{ backgroundColor: hexToRgba(highlightColor, 0.28), color: highlightColor }}>Nice to meet</Text> you.
          </Text>
          <Text style={[styles.highlightPreviewFa, ta]}>{t('highlightPreviewFa')}</Text>
        </View>
      </View>

      {/* Notifications & Reminders Card */}
      <View style={styles.settingCard}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#FFF6E0' }]}>
            <Bell color="#D97706" size={18} />
          </View>
          <Text style={styles.settingCardTitle}>{t('notificationsTitle')}</Text>
        </View>

        {/* Option 1: Daily Study Reminder */}
        <View style={[styles.toggleRow, row]}>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.optionTitle, ta]}>{t('studyReminder')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('studyReminderSub')}</Text>
          </View>
          <Switch
            value={studyReminderEnabled}
            onValueChange={setStudyReminderEnabled}
            trackColor={{ false: '#E3E5EA', true: '#FF6422' }}
            thumbColor={COLORS.white}
          />
        </View>

        {studyReminderEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={[styles.subOptionHead, row]}>
              <Clock color={COLORS.textSecondary} size={14} />
              <Text style={styles.subOptionLabel}>{t('reminderTime')}</Text>
            </View>

            {studyReminderTimes.length === 0 ? (
              <Text style={[styles.optionSub, ta]}>{t('reminderTimesEmpty')}</Text>
            ) : (
              <View style={[styles.timeChipRow, row]}>
                {studyReminderTimes.map((time) => (
                  <View key={time} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{time}</Text>
                    <TouchableOpacity
                      onPress={() => removeStudyReminderTime(time)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X color={COLORS.white} size={13} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {studyReminderTimes.length < MAX_REMINDER_TIMES && (
              <TouchableOpacity
                style={[styles.addTimeBtn, rtl ? styles.selfEnd : styles.selfStart]}
                onPress={() => setTimePickerOpen(true)}
              >
                <Plus color="#FF6422" size={14} />
                <Text style={styles.addTimeText}>{t('addReminderTime')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.dividerLine} />

        {/* Option 2: Leitner & Lesson Sentences Alerts */}
        <View style={[styles.toggleRow, row]}>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.optionTitle, ta]}>{t('contentNotification')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('contentNotificationSub')}</Text>
          </View>
          <Switch
            value={contentNotificationEnabled}
            onValueChange={setContentNotificationEnabled}
            trackColor={{ false: '#E3E5EA', true: '#FF6422' }}
            thumbColor={COLORS.white}
          />
        </View>

        {contentNotificationEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={[styles.subOptionHead, row]}>
              <BookOpen color={COLORS.tertiary} size={14} />
              <Text style={styles.subOptionLabel}>{t('notificationSource')}</Text>
            </View>
            <View style={styles.pillGroupVertical}>
              {(
                [
                  { id: 'leitner', label: t('sourceLeitner') },
                  { id: 'sentences', label: t('sourceSentences') },
                  { id: 'mixed', label: t('sourceMixed') },
                ] as { id: ContentSource; label: string }[]
              ).map((src) => (
                <TouchableOpacity
                  key={src.id}
                  style={[styles.pillBtnWide, contentSource === src.id && styles.pillBtnWideActive]}
                  onPress={() => setContentSource(src.id)}
                >
                  <Text style={[styles.pillText, contentSource === src.id && styles.pillTextActive]}>
                    {src.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Test Notification Button */}
        <TouchableOpacity style={[styles.testBtn, row]} onPress={handleSendTestNotification}>
          <Sparkles color="#FF6422" size={16} />
          <Text style={styles.testBtnText}>{t('sendTestNotification')}</Text>
        </TouchableOpacity>
      </View>

      {/* Support & FAQ Card */}
      <View style={styles.settingCard}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#FEE2E2' }]}>
            <HelpCircle color="#EF4444" size={18} />
          </View>
          <Text style={styles.settingCardTitle}>{t('helpAndSupport')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.linkRow, row]}
          onPress={() => navigation.navigate('HelpFaq')}
          activeOpacity={0.75}
        >
          <View style={[styles.rowTextGroup, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={styles.linkTitle}>{t('helpFaq')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('helpFaqSub')}</Text>
          </View>
          <Chevron color={COLORS.muted} size={18} />
        </TouchableOpacity>

        <View style={styles.dividerLine} />

        <TouchableOpacity
          style={[styles.linkRow, row]}
          onPress={() => navigation.navigate('ContactUs')}
          activeOpacity={0.75}
        >
          <View style={[styles.rowTextGroup, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={styles.linkTitle}>{t('contactUsTitle')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('contactUsSub')}</Text>
          </View>
          <Chevron color={COLORS.muted} size={18} />
        </TouchableOpacity>
      </View>

      {/* Logout Card */}
      <View style={styles.settingCard}>
        <TouchableOpacity
          style={[styles.linkRow, row]}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.75}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#FEE2E2' }]}>
            <LogOut color="#EF4444" size={18} />
          </View>
          <View style={[styles.rowTextGroup, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.linkTitle, { color: '#EF4444' }]}>{t('logout')}</Text>
            <Text style={[styles.optionSub, ta]}>
              {rtl ? 'خروج از حساب کاربری روی این دستگاه' : 'Sign out of your account on this device'}
            </Text>
          </View>
          <Chevron color={COLORS.muted} size={18} />
        </TouchableOpacity>
      </View>

      {/* App Version Footer */}
      <View style={styles.versionFooter}>
        <Info size={14} color={COLORS.muted} />
        <Text style={styles.versionText}>{t('allRightsReserved')}</Text>
      </View>

      <TimePickerModal
        visible={timePickerOpen}
        onCancel={() => setTimePickerOpen(false)}
        onConfirm={handleAddReminderTime}
      />

      <ConfirmModal
        visible={logoutModalVisible}
        icon={<LogOut color={COLORS.white} size={26} />}
        color="#EF4444"
        title={t('logout')}
        body={rtl ? 'آیا از خروج از حساب کاربری اطمینان دارید؟' : 'Are you sure you want to log out of your account?'}
        confirmLabel={t('logout')}
        cancelLabel={t('cancel')}
        onConfirm={() => {
          setLogoutModalVisible(false);
          logout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 130,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  selfStart: { alignSelf: 'flex-start' },
  selfEnd: { alignSelf: 'flex-end' },
  flex1: { flex: 1 },
  pageHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  pageTitle: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32 },
  pageSubTight: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 12, marginTop: 2 },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingCardTitle: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 16 },

  // Full-width responsive language segmented pill
  langSegmented: {
    flexDirection: 'row',
    marginTop: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#F3EFE6',
    gap: 6,
  },
  langSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  langSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  langSegmentText: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  langSegmentTextActive: {
    color: '#FF6422',
    fontFamily: FONT_FAMILY.bold,
  },

  optionTitle: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  optionSub: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  segmented: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#F3EFE6',
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { color: '#716B62', fontFamily: FONT_FAMILY.semiBold, fontSize: 13 },
  segmentTextActive: { color: '#FF6422', fontFamily: FONT_FAMILY.bold },
  dividerLine: { height: 1, backgroundColor: '#F0EBE3', marginVertical: 14 },
  colorSwatchRow: { flexDirection: 'row', gap: 10 },
  colorSwatchRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightPreview: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  highlightPreviewEn: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: '#1A1D26',
    lineHeight: 24,
  },
  highlightPreviewFa: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#716B62',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  subOptionGroup: { marginTop: 10, marginBottom: 10 },
  subOptionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  subOptionLabel: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  timeChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FF6422',
  },
  timeChipText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FAD8C7',
  },
  addTimeText: { color: '#FF6422', fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  pillGroupVertical: { gap: 8, marginTop: 6 },
  pillBtnWide: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillBtnWideActive: {
    backgroundColor: '#FFF4EE',
    borderColor: '#FAD8C7',
  },
  pillText: { color: '#716B62', fontFamily: FONT_FAMILY.medium, fontSize: 13, textAlign: 'center' },
  pillTextActive: { color: '#FF6422', fontFamily: FONT_FAMILY.bold },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FAD8C7',
  },
  testBtnText: { color: '#FF6422', fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowTextGroup: { flex: 1, gap: 2 },
  linkTitle: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  versionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  versionText: { color: '#9AA0AC', fontFamily: FONT_FAMILY.regular, fontSize: 12 },

  // Time Picker Modal styles
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  timeModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  timeModalTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#1A1D26',
    marginBottom: 6,
  },
  timeModalPreview: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    color: '#FF6422',
    marginVertical: 10,
  },
  timeColumnRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginVertical: 12,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnScroll: {
    maxHeight: 160,
    width: '100%',
    marginTop: 6,
  },
  timeCell: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
    backgroundColor: '#F3EFE6',
  },
  timeCellActive: {
    backgroundColor: '#FF6422',
  },
  timeModalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#FF6422',
  },
});
