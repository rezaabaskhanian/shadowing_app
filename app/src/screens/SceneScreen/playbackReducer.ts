import type { DialogueItem } from '../../data/scenarios';
import type { AudioActionCommand } from './types';

/**
 * ماشین حالتِ پخش و مرحله‌ی صفحه‌ی صحنه.
 *
 * این ۱۳ مقدار به هم وابسته‌اند: «رفتن به جمله‌ی بعد» یعنی همزمان اندیس، صدا،
 * دستور پلیر، nonce، حباب و... باید با هم عوض شوند. وقتی هرکدام یک useState
 * جدا بودند، هر گذارْ چند setState پراکنده بود و افکت‌ها باید از روی *نتیجه*
 * حدس می‌زدند چه اتفاقی افتاده — سه باگ واقعی از همین‌جا آمد (مکثی که صدا را
 * به اول برمی‌گرداند، جمله‌ای که با تعویض مرحله گم می‌شد، و پرشی که روی
 * انتخاب هندلر می‌نشست). حالا هر گذار یک action صریح است و نیت در خود action
 * است، نه قابل حدس از داده.
 */
export interface PlaybackState {
  /** اندیس جمله‌ی فعال در dialogueItems. */
  activeIndex: number;
  /** مرحله‌ی تمرین: ۰ گوش دادن، ۱ شدو، ۲ ضبط، ۳ مقایسه. */
  step: number;
  /** آیا وارد حالت تمرین شده‌ایم (در برابر گشت‌وگذار آزاد در صحنه). */
  shadowing: boolean;
  playing: boolean;
  audioUri: string | null;
  command: AudioActionCommand;
  /**
   * با هر «شروع دوباره»ی عمدی بالا می‌رود تا همان دستور دوباره به پلیر برسد.
   * مکث/ادامه عمداً بالایش نمی‌برد.
   */
  nonce: number;
  bubbleVisible: boolean;
  sceneFinished: boolean;
  /** جمله‌ی فعلی فایل صدای مرجع ندارد. */
  lineAudioMissing: boolean;
  /** چندمین دور پخش در مرحله‌ی فعلی (۱ تا targetRepeats). */
  repeatCount: number;
  /** مسیر ضبطی که همین حالا باید پخش شود. */
  playingRecordingUrl: string | null;
  /** صف پخش پشت‌سرهمِ ضبط‌ها؛ خالی یعنی در جریان نیست. */
  playAllQueue: number[];
  /**
   * آخرین جمله‌ای که در هر مرحله روی آن بودیم (کلید = اندیس مرحله). با برگشت
   * به یک مرحله از همان‌جا ادامه می‌دهیم، نه از اول صحنه.
   */
  stepLines: Record<number, number>;
}

export const initialPlaybackState: PlaybackState = {
  activeIndex: 0,
  step: 0,
  shadowing: false,
  playing: true,
  audioUri: null,
  command: 'none',
  nonce: 0,
  bubbleVisible: true,
  sceneFinished: false,
  lineAudioMissing: false,
  repeatCount: 1,
  playingRecordingUrl: null,
  playAllQueue: [],
  stepLines: {},
};

/** مرحله‌هایی که دور خودکار دارند (گوش دادن و شدو). */
export const AUTO_REPEAT_STEPS = [0, 1];

export const isAutoStep = (step: number) => AUTO_REPEAT_STEPS.includes(step);

export type PlaybackAction =
  /** پخش یک جمله از اول — تنها راهِ عوض کردن جمله‌ی فعال همراه با پخش. */
  | { type: 'PLAY_LINE'; index: number; items: DialogueItem[] }
  /** انتخاب جمله بدون شروع پخش (مرحله‌های ضبط/مقایسه). */
  | { type: 'SELECT_LINE'; index: number; items: DialogueItem[] }
  /** پخش دوباره‌ی صدای مرجعِ همین جمله از اول. */
  | { type: 'PLAY_ORIGINAL' }
  | { type: 'PAUSE' }
  /** ادامه از همان‌جایی که مکث شده — عمداً nonce را بالا نمی‌برد. */
  | { type: 'RESUME' }
  /** ورود به حالت تمرین: همیشه از جمله‌ی اول و با حافظه‌ی خالی. */
  | { type: 'START_SHADOWING'; items: DialogueItem[] }
  /**
   * تعویض مرحله در یک گذارِ اتمیک: جمله‌ی مرحله‌ی فعلی ذخیره و جمله‌ی مرحله‌ی
   * مقصد بازیابی می‌شود. چون همه‌چیز اینجا اتفاق می‌افتد، دیگر افکتی لازم
   * نیست که بعداً از روی state حدس بزند مرحله عوض شده.
   */
  | {
      type: 'CHANGE_STEP';
      step: number;
      items: DialogueItem[];
      /** برای مرحله‌ی مقایسه: جمله‌ی مقصد باید ضبط داشته باشد. */
      hasRecording?: (index: number) => boolean;
      /** جمله‌ی مشخص (مثلاً پرش به اولین جمله‌ی ناتمام)؛ حافظه را دور می‌زند. */
      forceIndex?: number;
    }
  /** شروع دوباره‌ی درس از مرحله‌ی اول و جمله‌ی اول، با حافظه‌ی پاک. */
  | { type: 'RESTART_LESSON'; items: DialogueItem[] }
  /** یک دور کامل تمام شد و دور بعدی از جمله‌ی اول شروع می‌شود. */
  | { type: 'NEXT_REPEAT'; items: DialogueItem[] }
  /** دیگر جمله‌ای نمانده و دور خودکاری هم در کار نیست. */
  | { type: 'SCENE_FINISHED' }
  /** صدای جمله تمام شد (حباب بسته می‌شود). */
  | { type: 'AUDIO_FINISHED' }
  /** این جمله فایل صدای مرجع ندارد. */
  | { type: 'AUDIO_MISSING' }
  | { type: 'PLAY_RECORDING'; index: number; items: DialogueItem[]; filePath: string }
  | { type: 'PLAY_ALL'; queue: number[] }
  | { type: 'STOP_PLAY_ALL' }
  /** یک ضبط از صف تمام شد؛ صف جلو می‌رود. */
  | { type: 'SHIFT_PLAY_ALL' }
  /**
   * شروع ضبط. `withReference` یعنی صدای مرجع هم هم‌زمان پخش شود (مرحله‌ی شدو)؛
   * در مرحله‌ی ضبط فقط صدای خود کاربر ضبط می‌شود.
   */
  | { type: 'START_RECORD'; withReference: boolean }
  | { type: 'STOP_RECORD' }
  /** صحنه عوض شد: همه‌چیزِ وابسته به جمله باید پاک شود. */
  | { type: 'RESET_SCENE' };

const uriOf = (items: DialogueItem[], index: number) => items[index]?.audioUrl || null;

/**
 * گذارِ مشترکِ «این جمله را از اول پخش کن». هر جا که جمله عوض می‌شود و صدا
 * باید از اول برود از همین رد می‌شود تا رفتار همه‌جا یکسان بماند.
 */
function playLine(state: PlaybackState, index: number, items: DialogueItem[]): PlaybackState {
  if (!items[index]) return state;
  return {
    ...state,
    activeIndex: index,
    audioUri: uriOf(items, index),
    command: 'play_original',
    playing: true,
    nonce: state.nonce + 1,
    bubbleVisible: true,
    sceneFinished: false,
    lineAudioMissing: false,
    playingRecordingUrl: null,
  };
}

/** جمله‌ی فعلی را برای مرحله‌ی فعلی به خاطر می‌سپارد. */
function remember(state: PlaybackState): Record<number, number> {
  return { ...state.stepLines, [state.step]: state.activeIndex };
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY_LINE':
      return playLine(state, action.index, action.items);

    case 'SELECT_LINE': {
      if (!action.items[action.index]) return state;
      return {
        ...state,
        activeIndex: action.index,
        audioUri: uriOf(action.items, action.index),
        playing: false,
        bubbleVisible: true,
        lineAudioMissing: false,
        playAllQueue: [],
      };
    }

    case 'PLAY_ORIGINAL':
      return {
        ...state,
        command: 'play_original',
        playing: true,
        nonce: state.nonce + 1,
        playingRecordingUrl: null,
      };

    case 'PAUSE':
      // بدون بالا بردن nonce: پلیر باید سرِ جایش بایستد، نه اینکه به ثانیه‌ی
      // صفر برگردد.
      return { ...state, playing: false, command: 'none' };

    case 'RESUME':
      return { ...state, playing: true, command: 'resume', nonce: state.nonce + 1 };

    case 'START_SHADOWING':
      return {
        ...playLine({ ...state, stepLines: {} }, 0, action.items),
        shadowing: true,
        step: state.step,
        repeatCount: 1,
      };

    case 'CHANGE_STEP': {
      if (action.step === state.step) return state;

      const stepLines = remember(state);
      let target = action.forceIndex;
      if (target === undefined) {
        const rememberedLine = stepLines[action.step];
        target =
          rememberedLine !== undefined && rememberedLine < action.items.length
            ? rememberedLine
            : state.activeIndex;
      }
      // مقایسه فقط روی جمله‌ای معنی دارد که ضبط داشته باشد؛ اگر جمله‌ی
      // به‌خاطرمانده دیگر ضبط ندارد، روی جمله‌ی فعلی می‌مانیم.
      if (action.hasRecording && !action.hasRecording(target)) target = state.activeIndex;

      const base = { ...state, stepLines, step: action.step, repeatCount: 1 };
      return isAutoStep(action.step)
        ? playLine(base, target, action.items)
        : {
            ...base,
            activeIndex: target,
            audioUri: uriOf(action.items, target),
            playing: false,
            bubbleVisible: true,
            lineAudioMissing: false,
            playAllQueue: [],
          };
    }

    case 'RESTART_LESSON':
      return {
        ...playLine({ ...state, stepLines: {} }, 0, action.items),
        step: 0,
        repeatCount: 1,
      };

    case 'NEXT_REPEAT':
      return { ...playLine(state, 0, action.items), repeatCount: state.repeatCount + 1 };

    case 'SCENE_FINISHED':
      return { ...state, sceneFinished: true };

    case 'AUDIO_FINISHED':
      return { ...state, bubbleVisible: false };

    case 'AUDIO_MISSING':
      return { ...state, lineAudioMissing: true };

    case 'PLAY_RECORDING':
      return {
        ...state,
        activeIndex: action.index,
        audioUri: uriOf(action.items, action.index),
        playing: false,
        bubbleVisible: true,
        playingRecordingUrl: action.filePath,
        command: 'play_recording',
        nonce: state.nonce + 1,
      };

    case 'PLAY_ALL':
      return { ...state, playing: false, playAllQueue: action.queue };

    case 'STOP_PLAY_ALL':
      return {
        ...state,
        playAllQueue: [],
        playing: false,
        command: 'none',
        nonce: state.nonce + 1,
        playingRecordingUrl: null,
      };

    case 'SHIFT_PLAY_ALL':
      return { ...state, playAllQueue: state.playAllQueue.slice(1) };

    case 'START_RECORD':
      return { ...state, command: 'start_record', playing: action.withReference };

    case 'STOP_RECORD':
      return { ...state, command: 'stop_record' };

    case 'RESET_SCENE':
      return { ...initialPlaybackState, shadowing: state.shadowing, step: state.step };

    default:
      return state;
  }
}
