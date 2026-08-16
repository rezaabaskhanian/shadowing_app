/**
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './src/services/audio/PlaybackService';

AppRegistry.registerComponent(appName, () => App);

// باید در سطح ماژول (نه داخل یک کامپوننت) ثبت شود؛ TrackPlayer این سرویس را
// روی اندروید به‌عنوان یک سرویس پس‌زمینه بالا می‌آورد.
TrackPlayer.registerPlaybackService(() => PlaybackService);
