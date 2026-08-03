import React, { useState } from 'react';
import {
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
  Mail,
  Mic,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../data/i18n';

type AuthMode = 'login' | 'otp' | 'reset';

interface AuthScreensProps {
  onComplete: () => void;
}

export const AuthScreens = ({ onComplete }: AuthScreensProps) => {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'otp') {
    return <OtpAuthScreen onBack={() => setMode('login')} onComplete={onComplete} />;
  }

  if (mode === 'reset') {
    return <ResetPasswordScreen onBack={() => setMode('login')} />;
  }

  return (
    <LoginScreen
      onComplete={onComplete}
      onOtp={() => setMode('otp')}
      onReset={() => setMode('reset')}
    />
  );
};

// PASSWORD LOGIN SCREEN
const LoginScreen = ({
  onComplete,
  onOtp,
  onReset,
}: {
  onComplete: () => void;
  onOtp: () => void;
  onReset: () => void;
}) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandBadge}>
          <Mic color={COLORS.black} size={28} />
        </View>
        <Text style={styles.authTitle}>{t('welcomeBack')}</Text>
        <Text style={styles.authSub}>{t('loginSub')}</Text>
      </View>

      {/* Input Fields */}
      <AuthInput
        icon={<Mail color={COLORS.textSecondary} size={20} />}
        placeholder={t('emailOrPhone')}
      />

      <View style={styles.inputWrap}>
        <Lock color={COLORS.textSecondary} size={20} />
        <TextInput
          placeholder={t('password')}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff color={COLORS.textSecondary} size={19} />
          ) : (
            <Eye color={COLORS.textSecondary} size={19} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotButton} onPress={onReset}>
        <Text style={styles.linkText}>{t('forgotPassword')}</Text>
      </TouchableOpacity>

      {/* Password Login CTA */}
      <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
        <Text style={styles.primaryButtonText}>{t('login')}</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* SMS OTP Access Button */}
      <TouchableOpacity style={styles.secondaryButton} onPress={onOtp}>
        <Phone color={COLORS.amber} size={18} />
        <Text style={styles.secondaryButtonText}>{t('signUpOtp')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// SMS OTP AUTHENTICATION / REGISTRATION SCREEN
const OtpAuthScreen = ({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      setStep('verify');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={step === 'verify' ? () => setStep('phone') : onBack}>
        <ArrowLeft color={COLORS.white} size={22} />
      </TouchableOpacity>

      <View style={styles.brandHeader}>
        <View style={[styles.brandBadge, { backgroundColor: COLORS.surfaceLight }]}>
          {step === 'phone' ? (
            <Phone color={COLORS.amber} size={28} />
          ) : (
            <ShieldCheck color={COLORS.amber} size={28} />
          )}
        </View>
        <Text style={styles.authTitle}>
          {step === 'phone' ? t('signUpOtp') : t('enterOtp')}
        </Text>
        <Text style={styles.authSub}>
          {step === 'phone'
            ? 'We will send a 4-digit verification code to your mobile phone number.'
            : `Enter the 4-digit code sent to ${phone || 'your phone'}.`}
        </Text>
      </View>

      {step === 'phone' ? (
        <>
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp}>
            <Text style={styles.primaryButtonText}>{t('sendOtp')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.otpBoxesRow}>
            {[0, 1, 2, 3].map((idx) => (
              <TextInput
                key={idx}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={otpCode[idx]}
                onChangeText={(val) => {
                  const newCode = [...otpCode];
                  newCode[idx] = val;
                  setOtpCode(newCode);
                }}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
            <Text style={styles.primaryButtonText}>{t('verifyAndLogin')}</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.bottomPrompt}>
        <Text style={styles.promptText}>{t('alreadyHaveAccount')} </Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.linkText}>{t('login')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// RESET PASSWORD SCREEN
const ResetPasswordScreen = ({ onBack }: { onBack: () => void }) => {
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft color={COLORS.white} size={22} />
      </TouchableOpacity>

      <Text style={styles.authTitle}>Reset Password 🔒</Text>
      <Text style={styles.authSub}>Enter your email to receive a password reset link.</Text>

      <AuthInput
        icon={<Mail color={COLORS.textSecondary} size={20} />}
        placeholder="Email Address"
      />

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Send Link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.forgotButton} onPress={onBack}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const AuthInput = ({
  icon,
  placeholder,
  secure = false,
}: {
  icon: React.ReactNode;
  placeholder: string;
  secure?: boolean;
}) => (
  <View style={styles.inputWrap}>
    {icon}
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      secureTextEntry={secure}
      style={styles.input}
      autoCapitalize="none"
    />
  </View>
);

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
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  authTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  authSub: {
    color: COLORS.textSecondary,
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
    fontSize: 15,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    color: COLORS.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: COLORS.amber,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '800',
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
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 12,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  bottomPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  promptText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
