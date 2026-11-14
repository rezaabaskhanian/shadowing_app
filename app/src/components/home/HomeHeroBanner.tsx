import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ChevronRight, Play } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

const appLogoMark = require('../../assets/brand/app-logo-mark.png');
const slide1 = require('../../assets/hero/slide_1.jpg');
const slide2 = require('../../assets/hero/slide_2.jpg');
const slide3 = require('../../assets/hero/slide_3.jpg');

interface SlideText {
  headlineTop: string;
  headlineAccent: string;
  subtitle: string;
}

interface SlideItem {
  id: number;
  en: SlideText;
  fa: SlideText;
  image: any;
}

const HERO_SLIDES: SlideItem[] = [
  {
    id: 0,
    en: {
      headlineTop: 'Learn English',
      headlineAccent: 'by Living It.',
      subtitle: 'Real conversations.\nReal situations.',
    },
    fa: {
      headlineTop: 'انگلیسی را',
      headlineAccent: 'با زندگی یاد بگیر.',
      subtitle: 'مکالمات واقعی، در دل روزمرگی.',
    },
    image: slide1,
  },
  {
    id: 1,
    en: {
      headlineTop: 'Speak Naturally',
      headlineAccent: 'Every Day.',
      subtitle: 'Interactive shadowing.\nInstant pronunciation AI.',
    },
    fa: {
      headlineTop: 'روان و طبیعی',
      headlineAccent: 'صحبت کن.',
      subtitle: 'شادویینگ تعاملی با بازخورد هوشمند.',
    },
    image: slide2,
  },
  {
    id: 2,
    en: {
      headlineTop: 'Master Real',
      headlineAccent: 'Dialogues.',
      subtitle: 'From airports to cafes,\npractice what matters.',
    },
    fa: {
      headlineTop: 'بر مکالمات روزمره',
      headlineAccent: 'مسلط شو.',
      subtitle: 'از کافه تا فرودگاه و محیط کار.',
    },
    image: slide3,
  },
];

interface HomeHeroBannerProps {
  onContinue: () => void;
  ctaText?: string;
  heroImageUri?: any;
  rtl?: boolean;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  onContinue,
  ctaText,
  heroImageUri,
  rtl = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance slides every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = HERO_SLIDES[activeIndex] || HERO_SLIDES[0];
  const slideText = rtl ? currentSlide.fa : currentSlide.en;
  const buttonText = ctaText || (rtl ? 'ادامه‌ی جلسه' : 'Continue Session');

  let heroSource = currentSlide.image;
  if (activeIndex === 0 && heroImageUri) {
    if (typeof heroImageUri === 'number') {
      heroSource = heroImageUri;
    } else if (typeof heroImageUri === 'string' && heroImageUri.startsWith('http')) {
      heroSource = { uri: heroImageUri };
    } else if (typeof heroImageUri === 'object' && heroImageUri?.uri) {
      heroSource = heroImageUri;
    }
  }

  return (
    <View style={styles.container}>
      {/* Background visual image strictly on right */}
      <View style={styles.visualWrapper} pointerEvents="none">
        <Image
          source={heroSource}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Soft edge blend from ivory background to transparent */}
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="heroEdgeFade" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FDFBF7" stopOpacity="1" />
              <Stop offset="0.28" stopColor="#FDFBF7" stopOpacity="0.7" />
              <Stop offset="0.65" stopColor="#FDFBF7" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#FDFBF7" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroEdgeFade)" />
        </Svg>
      </View>

      {/* Editorial Content: strictly aligned to left */}
      <View style={styles.content}>
        {/* LingoFlow Brand Signature */}
        <View style={styles.brandRow}>
          <Image source={appLogoMark} style={styles.logoMark} resizeMode="contain" />
          <Text style={styles.brandName}>LingoFlow</Text>
        </View>

        {/* Editorial Headline */}
        <View style={styles.headlineWrap}>
          <Text style={[styles.headline, { textAlign: rtl ? 'right' : 'left' }]}>
            {slideText.headlineTop}
          </Text>
          <View style={styles.headlineAccentWrap}>
            <Text style={[styles.headline, { textAlign: rtl ? 'right' : 'left' }]}>
              {slideText.headlineAccent}
            </Text>
            {/* Hand-drawn style orange curve stroke */}
            <Svg width={rtl ? 125 : 110} height={12} viewBox={rtl ? '0 0 125 12' : '0 0 110 12'} style={styles.accentSvg}>
              <Path
                d={rtl ? 'M5 8 C 35 2, 95 2, 120 7' : 'M3 8 C 30 2, 80 2, 107 7'}
                stroke="#FF6422"
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </View>
        </View>

        {/* Editorial Subtitle */}
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {slideText.subtitle}
        </Text>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={onContinue}
          activeOpacity={0.88}
        >
          <View style={styles.playIconCircle}>
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
          </View>
          <Text style={styles.primaryCtaText}>{buttonText}</Text>
          <ChevronRight size={15} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>

        {/* Interactive Indicator Dots for 3 slides */}
        <View style={styles.dotsRow}>
          {HERO_SLIDES.map((slide, idx) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => setActiveIndex(idx)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              style={[styles.dot, activeIndex === idx && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 280,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
    overflow: 'hidden',
  },
  visualWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '47%',
    zIndex: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    zIndex: 2,
    maxWidth: '60%',
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: SPACING.s,
  },
  logoMark: {
    width: 22,
    height: 22,
  },
  brandName: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#191C21',
    letterSpacing: -0.3,
  },
  headlineWrap: {
    marginBottom: SPACING.xs,
  },
  headline: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 33,
    color: '#191C21',
    letterSpacing: 0,
  },
  headlineAccentWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  accentSvg: {
    position: 'absolute',
    bottom: -5,
    left: 2,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#697082',
    marginTop: 4,
    marginBottom: SPACING.m,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6422',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 28,
    gap: 7,
    ...SHADOWS.level2,
    shadowColor: '#FF6422',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  playIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.m,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4DDD3',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FF6422',
  },
});
