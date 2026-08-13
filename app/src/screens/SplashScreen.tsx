import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

const splashImage =
  'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=1200&auto=format&fit=crop';

export const SplashScreen = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['18%', '100%'],
  });

  return (
    <ImageBackground source={{ uri: splashImage }} style={styles.container} imageStyle={styles.image}>
      <View style={styles.overlay} />
      <View style={styles.statusSpacer} />

      <View style={styles.heroCopy}>
        <Text style={styles.title}>Shadow</Text>
        <Text style={styles.subtitle}>Speak English{'\n'}Naturally</Text>
      </View>

      <View style={styles.voiceArea}>
        <View style={styles.wave}>
          {Array.from({ length: 28 }).map((_, index) => (
            <View key={index} style={[styles.waveBar, { height: 8 + ((index * 9) % 34) }]} />
          ))}
        </View>
        <Animated.View style={[styles.voiceButton, { transform: [{ scale }] }]}>
          <MessageCircle color={COLORS.white} size={30} fill={COLORS.white} />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.loadingText}>Loading your learning journey...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
    paddingTop: 52,
    paddingBottom: 54,
  },
  image: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 9, 20, 0.32)',
  },
  statusSpacer: {
    height: 1,
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: 72,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 56,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
    marginTop: 8,
  },
  voiceArea: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 150,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveBar: {
    width: 3,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    opacity: 0.82,
  },
  voiceButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.primary,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.58,
    shadowRadius: 24,
    elevation: 12,
  },
  footer: {
    marginTop: 'auto',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
});
