import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookText,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  ChevronUp,
  Film,
  Brain,
  Flag,
  Headphones,
  Layers,
  Lock,
  MessageCircle,
  Mic,
  NotebookPen,
  PenLine,
  Repeat,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { GradientFill } from '../../components/GradientFill';
import { useLanguage } from '../../data/i18n';
import { completePathItem, getPath, type LearningPath, type PathItem, type PathWeek } from '../../api/path';
import { track } from '../../services/analytics';
import { getSpeakingTopics } from '../../api/topicSpeaking';
import { getWritingPrompts } from '../../api/writing';

const KIND_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  scene: BookOpen,
  podcast: Headphones,
  video_clip: Film,
  speaking_topic: Mic,
  leitner_review: Layers,
  weak_lines: Repeat,
  checkpoint: Flag,
  habit_mission: Brain,
  dictation: PenLine,
  self_intro: Sparkles,
  writing: NotebookPen,
  verb: Zap,
  idioms: MessageCircle,
  story: BookText,
};

/** هفته‌ای که الان باید رویش کار کرد: اولین هفته‌ی بازِ تمام‌نشده (یا آخرین هفته). */
const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function currentWeekIndex(weeks: PathWeek[]): number {
  const i = weeks.findIndex((w) => w.unlocked && !w.done);
  return i >= 0 ? i : Math.max(0, weeks.length - 1);
}

/** قدم‌هایی که اپ می‌شناسد و نشانشان می‌دهد. */
const visibleItems = (items: PathItem[]) => items.filter((it) => it.kind in KIND_ICON);

interface NextStep {
  weekIndex: number;
  week: PathWeek;
  item: PathItem;
}

/**
 * فعالیت بعدیِ کاربر، فقط از روی پیشرفت واقعی: اولین جلسه‌ی بازِ تمام‌نشده،
 * و داخلش اولین قدم اجباریِ انجام‌نشده (اگر اجباری‌ها تمام شده‌اند، اولین
 * اختیاریِ انجام‌نشده). با برگشت به صفحه دوباره حساب می‌شود، پس بعد از تمام
 * کردن هر فعالیت، بعدی خودکار فعال می‌شود.
 */
function findNextStep(weeks: PathWeek[]): NextStep | null {
  for (let wi = 0; wi < weeks.length; wi++) {
    const week = weeks[wi];
    if (!week.unlocked || week.done) continue;
    for (const session of week.sessions) {
      if (!session.unlocked || session.done) continue;
      const items = visibleItems(session.items);
      const item = items.find((i) => i.required && !i.done) ?? items.find((i) => !i.done);
      if (item) return { weekIndex: wi, week, item };
    }
  }
  return null;
}

/** «PRE-A1» برچسب فارسی دارد؛ بقیه‌ی سطح‌ها (A1، B2، …) همان‌طور نمایش داده می‌شوند. */
function cefrLabel(cefr: string, t: (k: string) => string): string {
  return cefr === 'PRE-A1' ? t('pathCefr_PRE_A1') : cefr;
}

/**
 * «مسیر آموزشی» یک سطح: هفته‌ها، جلسه‌های هر هفته و قدم‌های هر جلسه. جلسه‌ها
 * با انجام دادن باز می‌شوند (نه با گذشت روز). صحنه‌ها خودکار تیک می‌خورند؛
 * قدم‌های اختیاری (پادکست، لایتنر) با باز کردنشان تمام‌شده حساب می‌شوند.
 */
export const PathHomeScreen: React.FC = () => {
  const { t, language } = useLanguage();
  // در فارسی صفحه راست‌به‌چپ چیده می‌شود.
  const rtl = language === 'fa';
  const num = (v: number | string) => (rtl ? toFa(v) : String(v));
  const textAlign = rtl ? styles.textRight : styles.textLeft;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const level: string = route.params?.level || 'starter';

  const [path, setPath] = useState<LearningPath | null>(null);
  const [error, setError] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  // جلسه یا هفته‌ی قفلی که کاربر لمسش کرده تا توضیحِ «کی باز می‌شود» را ببیند.
  const [lockHintKey, setLockHintKey] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    getPath(level)
      .then((p) => {
        setPath(p);
        // با هر بار برگشت به صفحه، هفته‌ی فعالیتِ بعدی باز می‌شود تا کاربر
        // بلافاصله قدم بعدی را ببیند.
        const ws = p.weeks || [];
        const next = findNextStep(ws);
        setOpenWeek(next ? next.weekIndex : currentWeekIndex(ws));
      })
      .catch(() => setError(true));
  }, [level]);

  useFocusEffect(load);

  const weeks = path?.weeks || [];
  const weeksDone = weeks.filter((w) => w.done).length;
  // بازه‌ی سطح مسیر از اولین و آخرین هفته‌ای که برچسب CEFR دارد.
  const cefrWeeks = weeks.filter((w) => !!w.cefr);
  const cefrFrom = cefrWeeks[0]?.cefr;
  const cefrTo = cefrWeeks[cefrWeeks.length - 1]?.cefr;
  const nextStep = findNextStep(weeks);
  // «ادامه» وقتی کاربر دست‌کم یک فعالیت را انجام داده؛ وگرنه «شروع».
  const hasProgress = weeks.some((w) => w.sessions.some((s) => s.items.some((i) => i.done)));
  const ctaLabel = t(hasProgress ? 'pathContinueLesson' : 'pathStartLesson');

  const openItem = (week: PathWeek, item: PathItem) => {
    track('path_item_opened', item.kind);
    // قدم‌های اختیاری با باز کردن تمام‌شده حساب می‌شوند؛ صحنه از پیشرفت خودِ صحنه،
    // جمله‌های سخت و Checkpoint از پایان صفحه‌ی خودشان ثبت می‌شوند.
    const markOnOpen = !['scene', 'weak_lines', 'checkpoint', 'dictation', 'self_intro'].includes(item.kind);
    if (markOnOpen && !item.done) completePathItem(week.id, item.key).catch(() => {});

    switch (item.kind) {
      case 'scene':
        navigation.navigate('Shadowing', { scenarioId: item.ref_id, returnTo: 'PathHome', returnParams: route.params });
        break;
      case 'podcast':
        navigation.navigate('Podcast', { podcastId: item.ref_id, openedAt: Date.now() });
        break;
      case 'story':
        navigation.navigate('Story', { storyId: item.ref_id, openedAt: Date.now() });
        break;
      case 'video_clip':
        navigation.navigate('VideoClip', { clipId: item.ref_id, openedAt: Date.now() });
        break;
      case 'speaking_topic':
        // موضوع مشخصِ این قدم مستقیم باز می‌شود؛ اگر پیدا نشد (مثلاً غیرفعال است) فهرست موضوع‌ها.
        getSpeakingTopics()
          .then((topics) => {
            const topic = topics.find((tp) => tp.id === item.ref_id);
            if (topic) navigation.navigate('TopicSpeaking', { topic, openedAt: Date.now() });
            else navigation.navigate('TopicList');
          })
          .catch(() => navigation.navigate('TopicList'));
        break;
      case 'writing':
        // مثل موضوع صحبت: همان موضوع نوشتن مستقیم باز می‌شود، وگرنه فهرست موضوع‌ها.
        getWritingPrompts()
          .then((prompts) => {
            const prompt = prompts.find((p) => p.id === item.ref_id);
            if (prompt) navigation.navigate('Writing', { prompt, openedAt: Date.now() });
            else navigation.navigate('WritingList');
          })
          .catch(() => navigation.navigate('WritingList'));
        break;
      case 'habit_mission':
        navigation.navigate('LanguageHabit');
        break;
      case 'self_intro':
        // کلیدی که با after تمام شود ضبط «بعد» و مقایسه است؛ بقیه ضبط «قبل».
        navigation.navigate('PathSelfIntro', {
          weekId: week.id,
          itemKey: item.key,
          level,
          stage: item.key.endsWith('after') ? 'after' : 'before',
          weekPosition: week.position,
          weekCount: weeks.length,
          openedAt: Date.now(),
        });
        break;
      case 'leitner_review':
        navigation.navigate('Leitner');
        break;
      case 'verb':
        navigation.navigate('VerbQuiz', { verbId: item.ref_id });
        break;
      case 'idioms':
        navigation.navigate('Leitner', {
          initialTab: 'idioms',
          idiomPhrases: (item.ref_id || '').split('|').filter(Boolean),
        });
        break;
      case 'dictation':
      case 'weak_lines': {
        const sceneIds = week.sessions.flatMap((s) =>
          s.items.filter((i) => i.kind === 'scene' && i.ref_id).map((i) => i.ref_id as string)
        );
        navigation.navigate(item.kind === 'dictation' ? 'PathDictation' : 'PathWeakLines', {
          weekId: week.id,
          itemKey: item.key,
          sceneIds,
          openedAt: Date.now(),
        });
        break;
      }
      case 'checkpoint':
        navigation.navigate('PathCheckpoint', {
          weekId: week.id,
          weekTitle: week.title_fa,
          weekPosition: week.position,
          openedAt: Date.now(),
        });
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('pathMapTitle')}</Text>
        <View style={styles.closeBtnSpacer} />
      </View>

      {error && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('pathLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.link}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!path && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {path && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl + (nextStep ? 80 : 0) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <GradientFill from="#FFF4D6" to="#FFE7B0" />
              <Compass size={30} color="#E8902F" />
            </View>
            <Text style={styles.headerTitle}>{path.title_fa}</Text>
            {!!cefrFrom && !!cefrTo && (
              <View style={[styles.cefrRange, rtl && styles.rowReverse]}>
                <View style={styles.cefrDot} />
                <Text style={styles.cefrRangeText}>
                  {cefrFrom === cefrTo
                    ? cefrFrom
                    : t('pathCefrRange').replace('{from}', cefrFrom).replace('{to}', cefrTo)}
                </Text>
              </View>
            )}
            {!!path.goal_fa && <Text style={styles.headerGoal}>{path.goal_fa}</Text>}
          </View>

          {/* وضعیت دوره: کارت سفید با نوار پیشرفت (از راست پر می‌شود در فارسی). */}
          <View style={styles.statusCard}>
            <View style={[styles.statusRow, rtl && styles.rowReverse]}>
              <Text style={styles.statusLabel}>{t('pathCourseStatus')}</Text>
              <Text style={styles.statusValue}>
                {t('pathWeeksProgress').replace('{done}', String(weeksDone)).replace('{total}', String(weeks.length))}
              </Text>
            </View>
            <View style={[styles.progressTrack, rtl && styles.rowReverse]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(weeks.length ? (weeksDone / weeks.length) * 100 : 0, 4)}%` },
                ]}
              >
                <GradientFill from="#F59E42" to="#E8572F" horizontal />
              </View>
            </View>
          </View>

          {weeks.map((week, wi) => {
            const open = openWeek === wi && week.unlocked;
            // پایان یک سطح: این هفته تمام شده و هفته‌ی بعد سطح دیگری دارد (یا آخرین هفته است).
            const levelDone = !!week.cefr && week.done && weeks[wi + 1]?.cefr !== week.cefr;
            const weekItems = week.sessions.flatMap((s) => visibleItems(s.items));
            const weekItemsDone = weekItems.filter((i) => i.done).length;
            const weekSub = [
              t('pathWeekN').replace('{n}', num(week.position)),
              week.cefr ? cefrLabel(week.cefr, t) : '',
            ]
              .filter(Boolean)
              .join('  •  ');
            const weekHintKey = `w-${week.id}`;
            return (
              <View key={week.id} style={[styles.weekCard, open && styles.weekCardOpen]}>
                {open && (
                  <View style={styles.weekTopStrip}>
                    <GradientFill from="#F59E42" to="#E8572F" horizontal />
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.weekHeader, rtl && styles.rowReverse]}
                  onPress={() => {
                    if (!week.unlocked) setLockHintKey(lockHintKey === weekHintKey ? null : weekHintKey);
                    else setOpenWeek(openWeek === wi ? null : wi);
                  }}
                  activeOpacity={0.85}
                >
                  {week.unlocked ? (
                    <View style={[styles.weekBadge, week.done && styles.weekBadgeDone]}>
                      {week.done ? (
                        <Check size={16} color={COLORS.white} />
                      ) : (
                        <Text style={styles.weekBadgeText}>{num(week.position)}</Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.lockSquare}>
                      <Lock size={15} color={COLORS.muted} />
                    </View>
                  )}
                  <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
                    <Text style={[styles.weekTitle, textAlign]}>{week.title_fa}</Text>
                    <Text style={[styles.weekLabel, textAlign]}>
                      {weekSub}
                      {week.is_free ? (
                        <Text style={styles.freeText}>{`  •  ${t('pathFree')}`}</Text>
                      ) : null}
                    </Text>
                    {open && weekItems.length > 0 && !week.done && (
                      <View style={styles.activityChip}>
                        <Text style={styles.activityChipText}>
                          {t('pathWeekActivities')
                            .replace('{done}', num(weekItemsDone))
                            .replace('{total}', num(weekItems.length))}
                        </Text>
                      </View>
                    )}
                    {week.best_score !== undefined && (
                      <Text style={styles.weekScore}>
                        {t('pathCheckpointScore').replace('{n}', String(week.best_score))}
                      </Text>
                    )}
                  </View>
                  {week.unlocked ? (
                    <View style={styles.chevronCircle}>
                      {open ? <ChevronUp size={16} color={COLORS.textSecondary} /> : <ChevronDown size={16} color={COLORS.textSecondary} />}
                    </View>
                  ) : rtl ? (
                    <ChevronLeft size={18} color={COLORS.muted} />
                  ) : (
                    <ChevronRight size={18} color={COLORS.muted} />
                  )}
                </TouchableOpacity>

                {!week.unlocked && lockHintKey === weekHintKey && (
                  <Text style={[styles.lockHint, textAlign]}>{t('pathWeekLockedHint')}</Text>
                )}

                {levelDone && (
                  <View style={styles.milestone}>
                    <Text style={styles.milestoneText}>
                      {t('pathCefrMilestone').replace('{cefr}', cefrLabel(week.cefr as string, t))}
                    </Text>
                  </View>
                )}

                {open && (
                  <View style={styles.weekBody}>
                    {/* هدف هفته همان فهرست can_do است؛ متن goal_fa فقط وقتی فهرستی نیست. */}
                    {week.can_do.length === 0 && !!week.goal_fa && (
                      <Text style={[styles.weekGoal, textAlign]}>{week.goal_fa}</Text>
                    )}
                    {week.can_do.length > 0 && (
                      <View style={styles.canDo}>
                        <View style={[styles.canDoHead, rtl && styles.rowReverse]}>
                          <Star size={15} color={COLORS.secondary} fill={COLORS.secondary} />
                          <Text style={styles.canDoTitle}>{t('pathCanDoTitle')}</Text>
                        </View>
                        {week.can_do.map((c) => (
                          <View key={c} style={[styles.canDoRow, rtl && styles.rowReverse]}>
                            {week.done ? (
                              <Check size={12} color={COLORS.success} />
                            ) : (
                              <View style={styles.canDoDot} />
                            )}
                            <Text style={[styles.canDoItem, textAlign]}>{c}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {week.sessions.map((session) => {
                      const sessionTitle = `${t('pathSessionN').replace('{n}', num(session.no))}${
                        session.title_fa ? `  •  ${session.title_fa}` : ''
                      }`;

                      const isCheckpoint = session.items.some((i) => i.kind === 'checkpoint');
                      // جلسه‌ی قفل: کارت جمع‌وجور با شماره، عنوان و قفل؛ با لمس، توضیحِ زمان باز شدن.
                      if (!session.unlocked) {
                        const hintKey = `s-${week.id}-${session.no}`;
                        return (
                          <TouchableOpacity
                            key={session.no}
                            style={[styles.sessionCard, isCheckpoint && styles.sessionCardCheckpoint]}
                            onPress={() => setLockHintKey(lockHintKey === hintKey ? null : hintKey)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.sessionCardRow, rtl && styles.rowReverse]}>
                              <View style={[styles.sessionStatus, isCheckpoint && styles.sessionStatusStar]}>
                                {isCheckpoint ? (
                                  <Star size={13} color={COLORS.textSecondary} fill={COLORS.textSecondary} />
                                ) : (
                                  <Lock size={13} color={COLORS.muted} />
                                )}
                              </View>
                              <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
                                <Text style={styles.sessionNo}>{t('pathSessionNo').replace('{n}', num(session.no))}</Text>
                                <Text style={[styles.sessionCardTitle, styles.mutedTitle, textAlign]} numberOfLines={1}>
                                  {session.title_fa}
                                </Text>
                              </View>
                              {isCheckpoint ? (
                                <Lock size={14} color={COLORS.muted} />
                              ) : (
                                <Text style={styles.sessionTag}>{t('pathSessionLockedTag')}</Text>
                              )}
                            </View>
                            {lockHintKey === hintKey && (
                              <Text style={[styles.lockHintInline, textAlign]}>{t('pathSessionLockedHint')}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      }

                      // جلسه‌ی تمام‌شده جمع می‌شود (مثل طرح) و با لمس دوباره باز می‌شود.
                      const doneKey = `d-${week.id}-${session.no}`;
                      if (session.done && lockHintKey !== doneKey) {
                        return (
                          <TouchableOpacity
                            key={session.no}
                            style={[styles.sessionCard, styles.sessionCardDone]}
                            onPress={() => setLockHintKey(doneKey)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.sessionCardRow, rtl && styles.rowReverse]}>
                              <View style={[styles.sessionStatus, styles.sessionStatusDone]}>
                                <Check size={13} color={COLORS.white} strokeWidth={3} />
                              </View>
                              <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
                                <Text style={[styles.sessionNo, styles.sessionNoDone]}>
                                  {t('pathSessionNo').replace('{n}', num(session.no))}
                                </Text>
                                <Text style={[styles.sessionCardTitle, textAlign]} numberOfLines={1}>
                                  {session.title_fa}
                                </Text>
                              </View>
                              <View style={styles.doneTag}>
                                <Text style={styles.doneTagText}>{t('pathSessionDoneTag')}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      const items = visibleItems(session.items);
                      // قدم‌های اختیاریِ انجام‌نشده (غیر از قدم بعدی) کپسول کوچک کنار عنوان جلسه‌اند،
                      // بقیه ردیف کامل.
                      const isNextItem = (it: PathItem) => nextStep?.item.key === it.key && nextStep.week.id === week.id;
                      const pills = items.filter((it) => !it.required && !it.done && !isNextItem(it));
                      const rows = items.filter((it) => !pills.includes(it));
                      return (
                        <View key={session.no} style={styles.session}>
                          <View style={styles.sessionDivider} />
                          <View style={[styles.sessionHeader, rtl && styles.rowReverse]}>
                            <Text style={[styles.sessionTitle, textAlign]} numberOfLines={1}>
                              {sessionTitle}
                            </Text>
                            {session.done && <Check size={16} color={COLORS.success} />}
                            {pills.map((it) => (
                              <TouchableOpacity
                                key={it.key}
                                style={styles.optionalPill}
                                onPress={() => openItem(week, it)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.optionalPillText}>
                                  {t(`pathKind_${it.kind}`)} • {t('pathOptional')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {rows.map((item) => {
                            const Icon = KIND_ICON[item.kind] || BookOpen;
                            const isNext = isNextItem(item);
                            const kindLine = [
                              isNext ? t('pathNextActivity') : '',
                              t(`pathKind_${item.kind}`),
                              !item.required ? t('pathOptional') : '',
                              item.minutes ? t('pathMinutes').replace('{n}', String(item.minutes)) : '',
                            ]
                              .filter(Boolean)
                              .join(' • ');
                            return (
                              <TouchableOpacity
                                key={item.key}
                                style={[
                                  styles.item,
                                  rtl && styles.rowReverse,
                                  item.done && styles.itemDone,
                                  isNext && styles.itemNext,
                                ]}
                                onPress={() => openItem(week, item)}
                                activeOpacity={0.85}
                              >
                                <View
                                  style={[
                                    styles.itemIcon,
                                    item.done && styles.itemIconDone,
                                    isNext && styles.itemIconNext,
                                  ]}
                                >
                                  <Icon
                                    size={18}
                                    color={isNext ? COLORS.white : item.done ? COLORS.success : COLORS.textSecondary}
                                  />
                                </View>
                                <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
                                  <Text
                                    style={[
                                      styles.itemKind,
                                      item.done && styles.itemKindDone,
                                      isNext && styles.itemKindNext,
                                    ]}
                                  >
                                    {kindLine}
                                  </Text>
                                  {!!item.title && item.kind !== 'checkpoint' && (
                                    <Text style={[styles.itemTitle, textAlign]} numberOfLines={1}>
                                      {item.title}
                                    </Text>
                                  )}
                                </View>
                                {item.done && (
                                  <View style={styles.doneCircle}>
                                    <Check size={14} color={COLORS.white} strokeWidth={3} />
                                  </View>
                                )}
                                {isNext && (
                                  <View style={styles.itemCta}>
                                    <Text style={styles.itemCtaText}>{ctaLabel}</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* دکمه‌ی ثابت پایین: همیشه به همان فعالیت بعدیِ واقعی اشاره می‌کند. */}
      {path && nextStep && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.s }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.bottomCta, rtl && styles.rowReverse]}
            onPress={() => openItem(nextStep.week, nextStep.item)}
            activeOpacity={0.9}
          >
            <Text style={styles.bottomCtaText} numberOfLines={1}>
              {ctaLabel}
              {nextStep.item.title && nextStep.item.kind !== 'checkpoint'
                ? `: ${nextStep.item.title}`
                : `: ${t(`pathKind_${nextStep.item.kind}`)}`}
            </Text>
            {rtl ? <ArrowLeft size={18} color={COLORS.white} /> : <ArrowRight size={18} color={COLORS.white} />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// رنگ‌های طرح: پس‌زمینه‌ی خاکستریِ خیلی روشن و کارت‌های سفید با کادر و سایه‌ی نرم.
const PAGE_BG = '#F7F7F9';
const CARD_BORDER = '#EEEEF2';
const CARD_SHADOW = {
  shadowColor: '#1A1D26',
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG, paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.muted },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#ECECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnSpacer: { width: 40 },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, textAlign: 'center' },
  link: { ...TEXT_STYLES.bodyMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  header: { alignItems: 'center', paddingTop: SPACING.m, paddingBottom: SPACING.m, gap: 10 },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FBE6B8',
  },
  headerTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32, color: COLORS.text, textAlign: 'center' },
  headerGoal: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  cefrRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFF0EA',
    borderWidth: 1,
    borderColor: '#FAD3C4',
  },
  cefrDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  cefrRangeText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: COLORS.primary },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.muted },
  statusValue: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.primary },
  progressTrack: { flexDirection: 'row', height: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: '#ECEEF2', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  milestone: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.successLight,
  },
  milestoneText: { ...TEXT_STYLES.bodyMd, color: COLORS.success, fontFamily: FONT_FAMILY.semiBold, textAlign: 'center' },
  weekCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 12,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  weekCardOpen: { borderColor: '#F6E1D6' },
  weekTopStrip: { height: 4 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  weekBadge: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FDEBE4',
    borderWidth: 1,
    borderColor: '#F9D2C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  weekBadgeText: { fontFamily: FONT_FAMILY.bold, color: COLORS.primary, fontSize: 15 },
  lockSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F2F5',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  weekTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 24, color: COLORS.text },
  weekLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.muted },
  freeText: { color: COLORS.success, fontFamily: FONT_FAMILY.semiBold },
  activityChip: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FDEBE4',
  },
  activityChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.primary },
  weekScore: { ...TEXT_STYLES.labelMd, color: COLORS.success },
  weekGoal: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, lineHeight: 22 },
  weekBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  lockHint: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, paddingHorizontal: 16, paddingBottom: 14 },
  canDo: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAFB',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  canDoHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  canDoTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  canDoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  canDoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B8BCC6' },
  canDoItem: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 22, color: COLORS.textSecondary },
  session: { gap: 10 },
  // خط‌چین بین بخش «می‌توانم» و جلسه‌ها (و بین جلسه‌ها).
  sessionDivider: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#E3E4EA', marginBottom: 2 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionTitle: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  mutedText: { color: COLORS.muted, fontFamily: FONT_FAMILY.medium },
  optionalPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#F0F0F3' },
  optionalPillText: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.muted },
  sessionCard: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sessionCardDone: { backgroundColor: '#FFF6F1', borderWidth: 1, borderColor: '#F6DDD0' },
  sessionCardCheckpoint: { backgroundColor: '#F7F5F1', borderWidth: 1, borderColor: '#EEEAE3' },
  sessionCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionStatus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1EEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionStatusDone: { backgroundColor: COLORS.primary },
  sessionStatusStar: { backgroundColor: '#ECE8E0' },
  sessionNo: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.muted },
  sessionNoDone: { color: COLORS.primary },
  sessionCardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  mutedTitle: { color: COLORS.textSecondary },
  sessionTag: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.muted },
  doneTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#FBE3D9' },
  doneTagText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.primary },
  lockHintInline: { ...TEXT_STYLES.labelMd, color: COLORS.muted, paddingTop: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  itemDone: { backgroundColor: '#EEFAF3', borderColor: '#CDEEDC' },
  itemNext: { backgroundColor: '#FFF4EE', borderColor: '#F8CDB8' },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F2F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconDone: { backgroundColor: '#D9F2E4' },
  itemIconNext: { backgroundColor: COLORS.primary },
  itemKind: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.muted },
  itemKindDone: { color: COLORS.success },
  itemKindNext: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  itemTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text },
  doneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3DAE74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCta: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemCtaText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.white },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
  },
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E2643A',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  bottomCtaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
});
