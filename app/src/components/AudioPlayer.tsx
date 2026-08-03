import React, { useEffect, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';

interface AudioPlayerProps {
  uri: string | null;
  shouldPlay: boolean;
  playbackRate?: number;
  textHint?: string;
  onPlaybackStatusUpdate?: (status: 'loading' | 'playing' | 'paused' | 'finished' | 'error') => void;
  onRecordingStatusUpdate?: (status: 'recording' | 'stopped' | 'error', recordedDataUrl?: string) => void;
  actionCommand?: 'none' | 'start_record' | 'stop_record' | 'play_recording' | 'play_original';
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  uri,
  shouldPlay,
  playbackRate = 1.0,
  textHint = '',
  onPlaybackStatusUpdate,
  onRecordingStatusUpdate,
  actionCommand = 'none',
}) => {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (!webViewRef.current) return;

    if (actionCommand === 'start_record') {
      webViewRef.current.postMessage(JSON.stringify({ cmd: 'start_record' }));
    } else if (actionCommand === 'stop_record') {
      webViewRef.current.postMessage(JSON.stringify({ cmd: 'stop_record' }));
    } else if (actionCommand === 'play_recording') {
      webViewRef.current.postMessage(JSON.stringify({ cmd: 'play_recording', rate: playbackRate }));
    } else if (actionCommand === 'play_original') {
      webViewRef.current.postMessage(
        JSON.stringify({ cmd: 'play_original', uri: uri, rate: playbackRate, text: textHint })
      );
    } else {
      webViewRef.current.postMessage(
        JSON.stringify({ cmd: shouldPlay ? 'play_original' : 'pause', uri: uri, rate: playbackRate, text: textHint })
      );
    }
  }, [shouldPlay, actionCommand, uri, playbackRate, textHint]);

  const onMessage = useCallback(
    (event: any) => {
      const raw = event.nativeEvent.data;
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'record_complete') {
            onRecordingStatusUpdate?.('stopped', parsed.dataUrl);
          } else if (parsed.type === 'record_status') {
            onRecordingStatusUpdate?.(parsed.status);
          }
        } catch (e) {}
      } else {
        if (
          raw === 'playing' ||
          raw === 'paused' ||
          raw === 'finished' ||
          raw === 'loading' ||
          raw === 'error'
        ) {
          onPlaybackStatusUpdate?.(raw as any);
        }
      }
    },
    [onPlaybackStatusUpdate, onRecordingStatusUpdate]
  );

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0">
<script>
  function send(data){ 
    try { 
      window.ReactNativeWebView.postMessage(typeof data === 'string' ? data : JSON.stringify(data)); 
    } catch(e){} 
  }

  var currentUri = ${JSON.stringify(uri || '')};
  var currentText = ${JSON.stringify(textHint || '')};
  var originalAudio = new Audio(currentUri);
  var recordedAudio = new Audio();
  var mediaRecorder = null;
  var audioChunks = [];

  function speakFallbackText(txt) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(txt || currentText || 'Hello');
      utter.lang = 'en-US';
      utter.rate = ${playbackRate};
      utter.onstart = function() { send('playing'); };
      utter.onend = function() { send('finished'); };
      utter.onerror = function() { send('finished'); };
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(function() { send('finished'); }, 2000);
    }
  }

  function playWithFallback(audioObj, txt) {
    if (!audioObj || !audioObj.src) {
      speakFallbackText(txt);
      return;
    }
    var promise = audioObj.play();
    if (promise && promise.catch) {
      promise.catch(function(err) {
        speakFallbackText(txt);
      });
    }
  }

  function attachOriginalEvents() {
    originalAudio.onplaying = function(){ send('playing'); };
    originalAudio.onpause = function(){ send('paused'); };
    originalAudio.onended = function(){ send('finished'); };
    originalAudio.onerror = function(){
      speakFallbackText(currentText);
    };
  }
  attachOriginalEvents();

  recordedAudio.onplaying = function(){ send('recorded_playing'); };
  recordedAudio.onended = function(){ send('recorded_finished'); };

  if (${JSON.stringify(shouldPlay)} && currentUri) {
    originalAudio.playbackRate = ${playbackRate};
    playWithFallback(originalAudio, currentText);
  }

  window.addEventListener('message', function(e){
    var raw = String(e.data || '');
    var msg = {};
    try { msg = JSON.parse(raw); } catch(err){ msg = { cmd: raw }; }

    var cmd = msg.cmd || raw;
    var newUri = msg.uri || currentUri;
    var rate = msg.rate || 1.0;
    if (msg.text) currentText = msg.text;

    if (newUri && newUri !== currentUri) {
      currentUri = newUri;
      originalAudio.pause();
      originalAudio = new Audio(currentUri);
      attachOriginalEvents();
    }

    originalAudio.playbackRate = rate;
    recordedAudio.playbackRate = rate;

    if (cmd === 'pause') {
      originalAudio.pause();
      recordedAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else if (cmd === 'play_original') {
      recordedAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (currentUri) {
        originalAudio.currentTime = 0;
        playWithFallback(originalAudio, currentText);
      } else {
        speakFallbackText(currentText);
      }
    } else if (cmd === 'start_record') {
      originalAudio.pause();
      recordedAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream){
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = function(evt) {
            if (evt.data.size > 0) audioChunks.push(evt.data);
          };
          mediaRecorder.onstop = function() {
            var blob = new Blob(audioChunks, { type: 'audio/mp3' });
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
              var base64data = reader.result;
              recordedAudio.src = base64data;
              send({ type: 'record_complete', dataUrl: base64data });
            };
          };
          mediaRecorder.start();
          send({ type: 'record_status', status: 'recording' });
        }).catch(function(err){
          send({ type: 'record_status', status: 'error', error: err.message });
        });
      } else {
        send({ type: 'record_status', status: 'error', error: 'MediaDevices not supported' });
      }
    } else if (cmd === 'stop_record') {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        send({ type: 'record_status', status: 'stopped' });
      }
    } else if (cmd === 'play_recording') {
      originalAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recordedAudio.src) {
        recordedAudio.currentTime = 0;
        playWithFallback(recordedAudio, '');
      }
    }
  });
</script>
</body>
</html>`;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      onMessage={onMessage}
      style={{ position: 'absolute', width: 1, height: 1, top: -100, opacity: 0.01 }}
      javaScriptEnabled
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback={true}
    />
  );
};
