import React from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BookOpen, Flame, HelpCircle, Layers, MessageCircle, Music, Sparkles, X } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import type { PracticeFlowMode, TextDisplayMode } from '../../../data/PracticeSettingsContext';

interface PracticeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  rtl: boolean;
  flowMode: PracticeFlowMode;
  onChangeFlowMode: (mode: PracticeFlowMode) => void;
  textDisplayMode: TextDisplayMode;
  onChangeTextDisplayMode: (mode: TextDisplayMode) => void;
  showProsodyGuide: boolean;
  onToggleProsodyGuide: (val: boolean) => void;
  onOpenGuide?: () => void;
  onOpenWarmUp?: () => void;
}

/**
 * مودال «تنظیمات تمرین»:
 * تمام گزینه‌های پیشرفته (روش ۴ مرحله‌ای / هوشمند، حباب / کارت، راهنمای ریتم و لحن،
 * راهنما و گرم‌کردن صدا) اینجا جمع شده‌اند تا صفحه‌ی اصلی تمرین کاملاً خلوت بماند.
 */
export const PracticeSettingsModal: React.FC<PracticeSettingsModalProps> = ({
  visible,
  onClose,
  rtl,
  flowMode,
  onChangeFlowMode,
  textDisplayMode,
  onChangeTextDisplayMode,
  showProsodyGuide,
  onToggleProsodyGuide,
  onOpenGuide,
  onOpenWarmUp,
}) => {
  const row = rtl ? styles.rowReverse : undefined;
  const tr = rtl ? styles.textRight : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, row]}>
            <Text style={styles.title}>{rtl ? 'تنظیمات تمرین' : 'Practice Settings'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* سبک تمرین */}
          <Text style={[styles.sectionLabel, tr]}>
            {rtl ? 'روش تمرین' : 'Practice Mode'}
          </Text>
          <View style={[styles.segmentRow, row]}>
            <TouchableOpacity
              style={[styles.segmentBtn, flowMode === 'smart_flow' && styles.segmentBtnActive]}
              onPress={() => onChangeFlowMode('smart_flow')}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color={flowMode === 'smart_flow' ? COLORS.primary : COLORS.muted} />
              <Text style={[styles.segmentText, flowMode === 'smart_flow' && styles.segmentTextActive]}>
                {rtl ? 'تکرار هوشمند (ساده)' : 'Smart Flow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, flowMode === 'classic_steps' && styles.segmentBtnActive]}
              onPress={() => onChangeFlowMode('classic_steps')}
              activeOpacity={0.8}
            >
              <Layers size={14} color={flowMode === 'classic_steps' ? COLORS.primary : COLORS.muted} />
              <Text style={[styles.segmentText, flowMode === 'classic_steps' && styles.segmentTextActive]}>
                {rtl ? '۴ مرحله‌ای کلاسیک' : '4-Step Classic'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* محل نمایش متن */}
          <Text style={[styles.sectionLabel, tr]}>
            {rtl ? 'نمایش متن دیالوگ' : 'Text Display'}
          </Text>
          <View style={[styles.segmentRow, row]}>
            <TouchableOpacity
              style={[styles.segmentBtn, textDisplayMode === 'card' && styles.segmentBtnActive]}
              onPress={() => onChangeTextDisplayMode('card')}
              activeOpacity={0.8}
            >
              <BookOpen size={14} color={textDisplayMode === 'card' ? COLORS.primary : COLORS.muted} />
              <Text style={[styles.segmentText, textDisplayMode === 'card' && styles.segmentTextActive]}>
                {rtl ? 'کارت پایین' : 'Bottom Card'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, textDisplayMode === 'bubble' && styles.segmentBtnActive]}
              onPress={() => onChangeTextDisplayMode('bubble')}
              activeOpacity={0.8}
            >
              <MessageCircle size={14} color={textDisplayMode === 'bubble' ? COLORS.primary : COLORS.muted} />
              <Text style={[styles.segmentText, textDisplayMode === 'bubble' && styles.segmentTextActive]}>
                {rtl ? 'حباب روی تصویر' : 'Scene Bubble'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* راهنمای ریتم و لحن */}
          <View style={[styles.switchRow, row]}>
            <View style={[styles.switchLabelWrap, row]}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Music size={16} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTitle, tr]}>
                  {rtl ? 'نمایش ریتم و لحن (اتصال کلمات)' : 'Prosody & Linking Guide'}
                </Text>
                <Text style={[styles.switchSub, tr]}>
                  {rtl ? 'نشان‌دادن تکیه کلمات و اتصال صوتی روی جمله' : 'Show stress and linking markers on text'}
                </Text>
              </View>
            </View>
            <Switch
              value={showProsodyGuide}
              onValueChange={onToggleProsodyGuide}
              trackColor={{ false: '#E5E7EB', true: COLORS.primaryLight }}
              thumbColor={showProsodyGuide ? COLORS.primary : '#F9FAFB'}
            />
          </View>

          {/* دکمه‌های کمکی */}
          <View style={styles.actionsList}>
            {onOpenWarmUp && (
              <TouchableOpacity
                style={[styles.actionRow, row]}
                onPress={() => {
                  onClose();
                  onOpenWarmUp();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Flame size={16} color="#EA580C" />
                </View>
                <Text style={[styles.actionText, tr]}>
                  {rtl ? 'گرم کردن فک و صدا (۳۰ ثانیه)' : 'Vocal & Jaw Warm-up'}
                </Text>
              </TouchableOpacity>
            )}
            {onOpenGuide && (
              <TouchableOpacity
                style={[styles.actionRow, row]}
                onPress={() => {
                  onClose();
                  onOpenGuide();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <HelpCircle size={16} color="#2563EB" />
                </View>
                <Text style={[styles.actionText, tr]}>
                  {rtl ? 'راهنمای روش تمرین مکالمه' : 'Practice Method Guide'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    ...SHADOWS.level2,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  segmentBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F0',
  },
  segmentText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 4,
    gap: 12,
  },
  switchLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.text,
  },
  switchSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionsList: {
    marginTop: 10,
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  actionText: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.text,
  },
});
