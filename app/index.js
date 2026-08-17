/**
 * @format
 */

import { AppRegistry, I18nManager } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './src/services/audio/PlaybackService';

// اپ فقط متن رو ترجمه می‌کنه (فارسی/انگلیسی)، ولی چیدمان همیشه چپ‌به‌راست
// طراحی شده. وقتی زبان دستگاه فارسی/عربی باشه، ری‌اکت‌نیتیو خودش به‌صورت
// خودکار کل چیدمان (flexDirection، موقعیت دکمه‌ها و لمس‌پذیری‌شون) رو
// آینه‌ای (RTL) می‌کنه چون این تنظیم رو صریحاً خاموش نکرده بودیم — همین باعث
// رفتارهای عجیب مثل فعال‌شدن ناخواسته‌ی دکمه‌ها می‌شه. اینجا صریحاً خاموشش
// می‌کنیم تا چیدمان همیشه چپ‌به‌راست بمونه، صرف‌نظر از زبان دستگاه.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

AppRegistry.registerComponent(appName, () => App);

// باید در سطح ماژول (نه داخل یک کامپوننت) ثبت شود؛ TrackPlayer این سرویس را
// روی اندروید به‌عنوان یک سرویس پس‌زمینه بالا می‌آورد.
TrackPlayer.registerPlaybackService(() => PlaybackService);
