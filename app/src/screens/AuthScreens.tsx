import React, { useState } from 'react';
import {
  ImageBackground,
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
  Lock,
  Mail,
  Mic,
  User,
} from 'lucide-react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../theme/colors';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthScreensProps {
  onComplete: () => void;
}

const loginImage =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop';

export const AuthScreens = ({ onComplete }: AuthScreensProps) => {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'register') {
    return <RegisterScreen onBack={() => setMode('login')} onComplete={onComplete} />;
  }

  if (mode === 'reset') {
    return <ResetPasswordScreen onBack={() => setMode('login')} />;
  }

  return (
    <LoginScreen
      onComplete={onComplete}
      onRegister={() => setMode('register')}
      onReset={() => setMode('reset')}
    />
  );
};

const LoginScreen = ({
  onComplete,
  onRegister,
  onReset,
}: {
  onComplete: () => void;
  onRegister: () => void;
  onReset: () => void;
}) => (
  <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
    <Text style={styles.authTitle}>Welcome Back! 👋</Text>
    <Text style={styles.authSub}>Login to continue your{'\n'}learning journey</Text>

    <ImageBackground source={{ uri: loginImage }} style={styles.loginArtwork} imageStyle={styles.loginArtworkImage}>
      <View style={styles.artworkScrim} />
      <View style={styles.micOrb}>
        <Mic color={COLORS.white} size={28} />
      </View>
    </ImageBackground>

    <AuthInput icon={<Mail color={COLORS.textSecondary} size={20} />} placeholder="Email or Username" />
    <AuthInput icon={<Lock color={COLORS.textSecondary} size={20} />} placeholder="Password" secure />

    <TouchableOpacity style={styles.forgotButton} onPress={onReset}>
      <Text style={styles.linkText}>Forgot Password?</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
      <Text style={styles.primaryButtonText}>Login</Text>
    </TouchableOpacity>

    <DividerText text="or continue with" />

    <View style={styles.socialRow}>
      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.googleText}>G</Text>
        <Text style={styles.socialText}>Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.appleText}>●</Text>
        <Text style={styles.socialText}>Apple</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.bottomPrompt}>
      <Text style={styles.promptText}>Don’t have an account? </Text>
      <TouchableOpacity onPress={onRegister}>
        <Text style={styles.linkText}>Register</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const RegisterScreen = ({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) => (
  <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
    <BackButton onPress={onBack} />
    <Text style={styles.authTitle}>Create Account ✨</Text>
    <Text style={styles.authSub}>Join millions of learners{'\n'}on their journey</Text>

    <View style={styles.registerHero}>
      <View style={styles.heroPlanet} />
      <View style={styles.characterCircle}>
        <User color={COLORS.white} size={60} />
      </View>
    </View>

    <AuthInput icon={<User color={COLORS.textSecondary} size={20} />} placeholder="Full Name" />
    <AuthInput icon={<Mail color={COLORS.textSecondary} size={20} />} placeholder="Email" />
    <AuthInput icon={<User color={COLORS.textSecondary} size={20} />} placeholder="Username" />
    <AuthInput icon={<Lock color={COLORS.textSecondary} size={20} />} placeholder="Password" secure />
    <AuthInput icon={<Lock color={COLORS.textSecondary} size={20} />} placeholder="Confirm Password" secure />

    <View style={styles.termsRow}>
      <View style={styles.checkbox} />
      <Text style={styles.termsText}>
        I agree to the <Text style={styles.inlineLink}>Terms of Use</Text> and <Text style={styles.inlineLink}>Privacy Policy</Text>
      </Text>
    </View>

    <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
      <Text style={styles.primaryButtonText}>Create Account</Text>
    </TouchableOpacity>

    <View style={styles.bottomPrompt}>
      <Text style={styles.promptText}>Already have an account? </Text>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.linkText}>Login</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const ResetPasswordScreen = ({ onBack }: { onBack: () => void }) => (
  <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
    <BackButton onPress={onBack} />
    <Text style={styles.authTitle}>Reset Password 🔒</Text>
    <Text style={styles.authSub}>No worries! We’ll help you{'\n'}get back in.</Text>

    <View style={styles.mailArtwork}>
      <View style={styles.envelopeBack} />
      <View style={styles.envelopeFront}>
        <Lock color={COLORS.primary} size={42} />
      </View>
    </View>

    <Text style={styles.resetCopy}>Enter your email address and we’ll send you a link to reset your password.</Text>

    <AuthInput icon={<Mail color={COLORS.textSecondary} size={20} />} placeholder="Email Address" />

    <TouchableOpacity style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>Send Reset Link</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.backToLogin} onPress={onBack}>
      <Text style={styles.linkText}>Back to Login</Text>
    </TouchableOpacity>
  </ScrollView>
);

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress}>
    <ArrowLeft color={COLORS.white} size={25} />
  </TouchableOpacity>
);

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
    {secure ? <Eye color={COLORS.textSecondary} size={19} /> : null}
  </View>
);

const DividerText = ({ text }: { text: string }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>{text}</Text>
    <View style={styles.dividerLine} />
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  authContent: {
    minHeight: '100%',
    paddingHorizontal: SPACING.l,
    paddingTop: 58,
    paddingBottom: 38,
  },
  authTitle: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 20,
  },
  authSub: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
  },
  loginArtwork: {
    height: 224,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    marginTop: 28,
    marginBottom: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginArtworkImage: {
    borderRadius: BORDER_RADIUS.l,
  },
  artworkScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 11, 24, 0.34)',
  },
  micOrb: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(124, 61, 255, 0.82)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    marginLeft: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 16,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginHorizontal: 18,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: COLORS.orange,
    fontSize: 19,
    fontWeight: '900',
    marginRight: 10,
  },
  appleText: {
    color: COLORS.white,
    fontSize: 16,
    marginRight: 10,
  },
  socialText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  bottomPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 34,
  },
  promptText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  registerHero: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  heroPlanet: {
    position: 'absolute',
    width: 158,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124, 61, 255, 0.26)',
    transform: [{ rotate: '-18deg' }],
  },
  characterCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.textSecondary,
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  inlineLink: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  mailArtwork: {
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  envelopeBack: {
    position: 'absolute',
    width: 174,
    height: 128,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '-9deg' }],
    opacity: 0.78,
  },
  envelopeFront: {
    width: 190,
    height: 130,
    borderRadius: 24,
    backgroundColor: '#E7E1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetCopy: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: 28,
  },
});
