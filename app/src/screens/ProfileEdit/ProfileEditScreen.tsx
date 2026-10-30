import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, KeyRound, Lock, Phone, User as UserIcon } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useAuth } from '../../data/AuthContext';
import { changePassword } from '../../api/auth';

const MIN_NICKNAME = 2;
const MAX_NICKNAME = 30;
const MIN_PASSWORD = 8;

type Status = { kind: 'ok' | 'error'; text: string } | null;

/**
 * ویرایش پروفایل: نام نمایشی و رمز عبور. شماره تلفن فقط نمایش داده می‌شود چون
 * شناسه‌ی ورود است و عوض‌کردنش تایید پیامکیِ شماره‌ی جدید لازم دارد.
 */
export const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const { user, updateNickname } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<Status>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passStatus, setPassStatus] = useState<Status>(null);

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;

  const trimmed = nickname.trim().replace(/\s+/g, ' ');
  const nameChanged = trimmed !== (user?.nickname ?? '');

  const saveName = async () => {
    if (trimmed.length < MIN_NICKNAME || trimmed.length > MAX_NICKNAME) {
      setNameStatus({ kind: 'error', text: t('profileEditNameInvalid') });
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      await updateNickname(trimmed);
      setNickname(trimmed);
      setNameStatus({ kind: 'ok', text: t('profileEditNameSaved') });
    } catch (err) {
      setNameStatus({ kind: 'error', text: err instanceof Error ? err.message : t('profileEditFailed') });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPass) {
      setPassStatus({ kind: 'error', text: t('profileEditCurrentRequired') });
      return;
    }
    if (newPass.length < MIN_PASSWORD) {
      setPassStatus({ kind: 'error', text: t('profileEditPassShort') });
      return;
    }
    if (newPass !== confirmPass) {
      setPassStatus({ kind: 'error', text: t('profileEditPassMismatch') });
      return;
    }
    setSavingPass(true);
    setPassStatus(null);
    try {
      await changePassword(currentPass, newPass);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setPassStatus({ kind: 'ok', text: t('profileEditPassSaved') });
    } catch (err) {
      setPassStatus({ kind: 'error', text: err instanceof Error ? err.message : t('profileEditFailed') });
    } finally {
      setSavingPass(false);
    }
  };

  const statusLine = (status: Status) =>
    status ? (
      <View style={[styles.statusRow, row]}>
        {status.kind === 'ok' && <CheckCircle2 size={15} color={COLORS.success} />}
        <Text style={[styles.statusText, align, status.kind === 'ok' ? styles.statusOk : styles.statusError]}>
          {status.text}
        </Text>
      </View>
    ) : null;

  const passInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <View style={[styles.inputBox, row]}>
      <Lock size={17} color={COLORS.muted} />
      <TextInput
        style={[styles.input, align]}
        value={value}
        onChangeText={(v) => {
          onChange(v);
          setPassStatus(null);
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        secureTextEntry={!showPass}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, align]}>{t('profileEditTitle')}</Text>
        <Text style={[styles.sub, align]}>{t('profileEditSub')}</Text>

        {/* نام نمایشی */}
        <View style={styles.card}>
          <View style={[styles.cardHead, row]}>
            <View style={styles.cardIcon}>
              <UserIcon size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.cardTitle, align]}>{t('profileEditNameLabel')}</Text>
          </View>
          <View style={[styles.inputBox, row]}>
            <TextInput
              style={[styles.input, align]}
              value={nickname}
              onChangeText={(v) => {
                setNickname(v);
                setNameStatus(null);
              }}
              placeholder={t('profileEditNamePlaceholder')}
              placeholderTextColor={COLORS.muted}
              maxLength={MAX_NICKNAME}
              returnKeyType="done"
              onSubmitEditing={nameChanged ? saveName : undefined}
            />
          </View>
          {statusLine(nameStatus)}
          <TouchableOpacity
            style={[styles.primaryBtn, (!nameChanged || savingName) && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={!nameChanged || savingName}
            onPress={saveName}
          >
            {savingName ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>{t('profileEditSaveName')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* شماره تلفن — فقط نمایش */}
        <View style={styles.card}>
          <View style={[styles.cardHead, row]}>
            <View style={[styles.cardIcon, styles.cardIconInfo]}>
              <Phone size={18} color={COLORS.info} />
            </View>
            <Text style={[styles.cardTitle, align]}>{t('profileEditPhoneLabel')}</Text>
          </View>
          <View style={[styles.inputBox, styles.inputReadonly, row]}>
            <Text style={styles.phoneText}>{user?.phone ?? ''}</Text>
          </View>
          <Text style={[styles.hint, align]}>{t('profileEditPhoneHint')}</Text>
        </View>

        {/* تغییر رمز */}
        <View style={styles.card}>
          <View style={[styles.cardHead, row]}>
            <View style={[styles.cardIcon, styles.cardIconGold]}>
              <KeyRound size={18} color={COLORS.warningDeep} />
            </View>
            <Text style={[styles.cardTitle, styles.flex1, align]}>{t('profileEditPassTitle')}</Text>
            <TouchableOpacity hitSlop={10} onPress={() => setShowPass((v) => !v)}>
              {showPass ? <EyeOff size={18} color={COLORS.muted} /> : <Eye size={18} color={COLORS.muted} />}
            </TouchableOpacity>
          </View>
          {passInput(currentPass, setCurrentPass, t('profileEditCurrentPass'))}
          {passInput(newPass, setNewPass, t('profileEditNewPass'))}
          {passInput(confirmPass, setConfirmPass, t('profileEditConfirmPass'))}
          {statusLine(passStatus)}
          <TouchableOpacity
            style={[styles.darkBtn, savingPass && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={savingPass}
            onPress={savePassword}
          >
            {savingPass ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>{t('profileEditSavePass')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  flex1: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  topBar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
  title: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 24 },
  sub: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 20, marginBottom: 6 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconInfo: { backgroundColor: COLORS.infoLight },
  cardIconGold: { backgroundColor: COLORS.secondaryLight },
  cardTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: 14,
    height: 50,
  },
  inputReadonly: { backgroundColor: COLORS.surfaceLight },
  input: { flex: 1, color: COLORS.text, fontFamily: FONT_FAMILY.medium, fontSize: 15, paddingVertical: 0 },
  phoneText: { flex: 1, color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 15, textAlign: 'left' },
  hint: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { flex: 1, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  statusOk: { color: COLORS.success },
  statusError: { color: COLORS.error },
  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  darkBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
