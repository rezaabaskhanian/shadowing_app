import React, { useEffect, useRef, useCallback } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View } from 'react-native';

interface AudioPlayerProps {
  uri: string | null;
  shouldPlay: boolean;
  onPlaybackStatusUpdate?: (status: 'loading' | 'playing' | 'paused' | 'finished' | 'error') => void;
}

const HTML_PLAYER = (uri: string) => `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0">
<script>
  var audio = null;
  var currentUri = '';
  window.addEventListener('message', function(e) {
    var data = JSON.parse(e.data);
    if (data.action === 'play' && data.uri) {
      if (audio && currentUri === data.uri) {
        audio.play();
        sendStatus('playing');
        return;
      }
      currentUri = data.uri;
      audio = new Audio(data.uri);
      audio.onplaying = function() { sendStatus('playing'); };
      audio.onpause = function() { sendStatus('paused'); };
      audio.onended = function() { sendStatus('finished'); };
      audio.onerror = function() { sendStatus('error'); };
      audio.load();
      audio.play().catch(function() { sendStatus('error'); });
    } else if (data.action === 'pause') {
      if (audio) audio.pause();
    } else if (data.action === 'stop') {
      if (audio) { audio.pause(); audio.currentTime = 0; }
    }
  });
  function sendStatus(s) {
    window.ReactNativeWebView.postMessage(s);
  }
</script>
</body>
</html>`;

export const AudioPlayer = ({ uri, shouldPlay, onPlaybackStatusUpdate }: AudioPlayerProps) => {
  const webViewRef = useRef<any>(null);
  const lastUri = useRef<string | null>(null);

  const sendCommand = useCallback((action: string) => {
    if (webViewRef.current && uri) {
      webViewRef.current.postMessage(JSON.stringify({ action, uri }));
    }
  }, [uri]);

  useEffect(() => {
    if (!uri) return;

    if (shouldPlay) {
      lastUri.current = uri;
      sendCommand('play');
    } else {
      sendCommand('pause');
    }
  }, [uri, shouldPlay, sendCommand]);

  useEffect(() => {
    return () => {
      sendCommand('stop');
    };
  }, []);

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
        source={{ html: uri ? HTML_PLAYER(uri) : '<html><body></body></html>' }}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
};
