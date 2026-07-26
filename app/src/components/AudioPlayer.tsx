import React, { useEffect, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import { View } from 'react-native';

interface AudioPlayerProps {
  uri: string | null;
  shouldPlay: boolean;
  onPlaybackStatusUpdate?: (status: 'loading' | 'playing' | 'paused' | 'finished' | 'error') => void;
}

// HTML سبک که به‌محض لود، همان uri را می‌سازد و (در صورت نیاز) خودکار پخش می‌کند.
// چون uri داخل خود HTML است، هر دیالوگ جدید WebView را ری‌لود و خودکار پخش می‌کند
// و دیگر به ریسِ postMessage وابسته نیستیم.
const HTML_PLAYER = (uri: string, autoplay: boolean) => `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0">
<script>
  function send(s){ try { window.ReactNativeWebView.postMessage(s); } catch(e){} }
  var audio = new Audio(${JSON.stringify(uri)});
  audio.onplaying = function(){ send('playing'); };
  audio.onpause = function(){ send('paused'); };
  audio.onended = function(){ send('finished'); };
  audio.onerror = function(){ send('error'); };
  ${autoplay ? "audio.play().catch(function(){ send('error'); });" : ''}
  // فرمان‌های بعدی از سمت RN (pause/play/stop) بدون ری‌لود
  window.addEventListener('message', function(e){
    var a = String(e.data || '');
    if (a === 'pause') { audio.pause(); }
    else if (a === 'play') { audio.play().catch(function(){ send('error'); }); }
    else if (a === 'stop') { audio.pause(); audio.currentTime = 0; }
  });
</script>
</body>
</html>`;

export const AudioPlayer = ({ uri, shouldPlay, onPlaybackStatusUpdate }: AudioPlayerProps) => {
  const webViewRef = useRef<any>(null);

  // pause/resume بدون تغییر uri: با postMessage به WebViewِ بارگذاری‌شده
  useEffect(() => {
    if (!uri || !webViewRef.current) return;
    webViewRef.current.postMessage(shouldPlay ? 'play' : 'pause');
  }, [shouldPlay, uri]);

  const onMessage = useCallback(
    (event: any) => {
      const status = event.nativeEvent.data;
      onPlaybackStatusUpdate?.(status as any);
    },
    [onPlaybackStatusUpdate]
  );

  return (
    <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}>
      <WebView
        ref={webViewRef}
        // با تغییر uri، HTML جدید لود و خودکار پخش می‌شود
        source={{ html: uri ? HTML_PLAYER(uri, shouldPlay) : '<html><body></body></html>' }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // اجازه‌ی پخش خودکار صدا بدون نیاز به لمس کاربر (کلید حل مشکل صدا در اندروید)
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        // اجازه‌ی بارگذاری صدای http (cleartext) داخل WebView
        mixedContentMode="always"
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
};
