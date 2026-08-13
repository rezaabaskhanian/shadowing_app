import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mic,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { resetPassword as resetPasswordApi } from '../api/auth';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthScreensProps {
  onComplete: () => void;
}

export const AuthScreens = ({ onComplete }: AuthScreensProps) => {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'register') {
    return <RegisterScreen onBack={() => setMode('login')} />;
  }

  if (mode === 'reset') {
    return <ResetPasswordScreen onBack={() => setMode('login')} />;
  }

  return (
    <LoginScreen
      onRegister={() => setMode('register')}
      onReset={() => setMode('reset')}
    />
  );
};

// PASSWORD LOGIN SCREEN
const LoginScreen = ({
  onRegister,
  onReset,
}: {
  onRegister: () => void;
  onReset: () => void;
}) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      setError(t('fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (e: any) {
      setError(e?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandBadge}>
          <Mic color={COLORS.white} size={28} />
        </View>
        <Text style={styles.authTitle}>{t('welcomeBack')}</Text>
        <Text style={styles.authSub}>{t('loginSub')}</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputWrap}>
        <Phone color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('phoneNumber')}
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrap}>
        <Lock color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('password')}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff color={COLORS.textSecondary} size={19} />
          ) : (
            <Eye color={COLORS.textSecondary} size={19} />
          )}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.forgotButton} onPress={onReset}>
        <Text style={styles.linkText}>{t('forgotPassword')}</Text>
      </TouchableOpacity>

      {/* Password Login CTA */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.primaryButtonText}>{t('login')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={onRegister}>
        <User color={COLORS.primary} size={18} />
        <Text style={styles.secondaryButtonText}>{t('signUp')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// REGISTRATION SCREEN
const RegisterScreen = ({ onBack }: { onBack: () => void }) => {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!nickname.trim() || phone.trim().length < 10 || !password) {
      setError(t('fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('weakPassword'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(nickname.trim(), phone.trim(), password);
    } catch (e: any) {
      setError(e?.message || t('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <View style={styles.brandHeader}>
        <View style={[styles.brandBadge, { backgroundColor: COLORS.surfaceLight }]}>
          <User color={COLORS.primary} size={28} />
        </View>
        <Text style={styles.authTitle}>{t('signUp')}</Text>
        <Text style={styles.authSub}>{t('registerSub')}</Text>
      </View>

      <View style={styles.inputWrap}>
        <User color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('nicknameLabel')}
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
        />
      </View>

      <View style={styles.inputWrap}>
        <Phone color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('phoneNumber')}
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputWrap}>
        <Lock color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('password')}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff color={COLORS.textSecondary} size={19} />
          ) : (
            <Eye color={COLORS.textSecondary} size={19} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrap}>
        <Lock color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('confirmNewPassword')}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.primaryButtonText}>{t('signUp')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPrompt}>
        <Text style={styles.promptText}>{t('alreadyHaveAccount')} </Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.linkText}>{t('login')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// RESET PASSWORD SCREEN (2-step: enter nickname + new password -> success)
const ResetPasswordScreen = ({ onBack }: { onBack: () => void }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [nickname, setNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    if (!nickname.trim() || !newPassword) {
      setError(t('fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordApi(nickname.trim(), newPassword, confirmPassword);
      setStep('success');
    } catch (e: any) {
      setError(e?.message || t('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      {step !== 'success' && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
      )}

      {step === 'form' && (
        <>
          <View style={styles.brandHeader}>
            <View style={[styles.brandBadge, { backgroundColor: COLORS.surfaceLight }]}>
              <Lock color={COLORS.primary} size={28} />
            </View>
            <Text style={styles.authTitle}>{t('resetPasswordTitle')}</Text>
            <Text style={styles.authSub}>{t('resetPasswordSub')}</Text>
          </View>

          <View style={styles.inputWrap}>
            <User color={COLORS.textSecondary} size={20} />
            <TextInput
              placeholder={t('nicknameLabel')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Lock color={COLORS.textSecondary} size={20} />
            <TextInput
              placeholder={t('newPassword')}
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry={!showNewPass}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
              {showNewPass ? (
                <EyeOff color={COLORS.textSecondary} size={19} />
              ) : (
                <Eye color={COLORS.textSecondary} size={19} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <Lock color={COLORS.textSecondary} size={20} />
            <TextInput
              placeholder={t('confirmNewPassword')}
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry={!showConfirmPass}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
              {showConfirmPass ? (
                <EyeOff color={COLORS.textSecondary} size={19} />
              ) : (
                <Eye color={COLORS.textSecondary} size={19} />
              )}
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleUpdatePassword} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('updatePassword')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotButton} onPress={onBack}>
            <Text style={styles.linkText}>{t('backToLogin')}</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'success' && (
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <View
            style={[
              styles.brandBadge,
              { backgroundColor: COLORS.tertiary, width: 80, height: 80, borderRadius: 40, marginBottom: 24 },
            ]}
          >
            <ShieldCheck color={COLORS.white} size={40} />
          </View>

          <Text style={styles.authTitle}>{t('resetSuccessTitle')}</Text>
          <Text style={[styles.authSub, { marginBottom: 32 }]}>{t('resetSuccessSub')}</Text>

          <TouchableOpacity style={[styles.primaryButton, { width: '100%' }]} onPress={onBack}>
            <Text style={styles.primaryButtonText}>{t('backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  authContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  authTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 6,
  },
  authSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
  },
  bottomPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  promptText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
});
