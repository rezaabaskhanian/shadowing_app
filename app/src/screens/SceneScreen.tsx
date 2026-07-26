// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   Animated,
//   Easing,
//   ImageBackground,
//   LayoutChangeEvent,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
// import { useNavigation } from '@react-navigation/native';
// import { ChevronLeft, Mic, Pause, Play, RotateCcw, Volume2 } from 'lucide-react-native';
// import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
// import { AudioPlayer } from '../components/AudioPlayer';

// const FOCUS_SCALE = 2.0;
// const ZOOM_DURATION = 700;

// interface Hotspot {
//   id: string;
//   x: number;
//   y: number;
//   speaker: string;
//   dialogue: string;
//   translation: string;
//   audioUrl: string;
// }

// interface SceneScreenProps {
//   scene: {
//     id: string;
//     title: string;
//     imageUri: string;
//     hotspots: Hotspot[];
//   };
// }

// export const SceneScreen = ({ scene }: SceneScreenProps) => {
//   const navigation = useNavigation<any>();
//   const [activeIndex, setActiveIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [audioUri, setAudioUri] = useState<string | null>(null);
//   const [isAudioReady, setIsAudioReady] = useState(false);
//   const [isAutoZoom, setIsAutoZoom] = useState(true);
//   const [viewport, setViewport] = useState({ width: 0, height: 0 });

//   const scale = useRef(new Animated.Value(1)).current;
//   const translateX = useRef(new Animated.Value(0)).current;
//   const translateY = useRef(new Animated.Value(0)).current;

//   const lastScale = useRef(1);
//   const lastTranslateX = useRef(0);
//   const lastTranslateY = useRef(0);

//   const pinchScale = useRef(new Animated.Value(1)).current;
//   const panX = useRef(new Animated.Value(0)).current;
//   const panY = useRef(new Animated.Value(0)).current;

//   const canvasWidth = viewport.width * 1.8;
//   const canvasHeight = viewport.height * 1.8;

//   const hotspots = scene.hotspots;
//   const currentHotspot = hotspots[activeIndex];

//   const handleAudioStatus = useCallback((status: string) => {
//     if (status === 'playing') {
//       setIsAudioReady(true);
//     } else if (status === 'finished') {
//       // Audio finished - advance to next hotspot
//       setIsPlaying((prev) => {
//         if (!prev) return prev;
//         if (activeIndex >= hotspots.length - 1) {
//           return false;
//         }
//         return true;
//       });
//     } else if (status === 'error') {
//       console.error('Audio playback error');
//     }
//   }, [activeIndex, hotspots.length]);

//   const playAudio = useCallback((url: string) => {
//     setAudioUri(url);
//     setIsAudioReady(false);
//   }, []);

//   const stopAudio = useCallback(() => {
//     setAudioUri(null);
//     setIsAudioReady(false);
//   }, []);

//   // Auto-zoom to hotspot
//   const zoomToHotspot = useCallback(
//     (index: number, animated = true) => {
//       if (!viewport.width || !viewport.height) return;

//       const spot = hotspots[index];
//       const targetX = viewport.width * 0.5 - spot.x * canvasWidth * FOCUS_SCALE;
//       const targetY = viewport.height * 0.4 - spot.y * canvasHeight * FOCUS_SCALE;

//       const duration = animated ? ZOOM_DURATION : 0;

//       Animated.parallel([
//         Animated.timing(scale, {
//           toValue: FOCUS_SCALE,
//           duration,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateX, {
//           toValue: targetX,
//           duration,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateY, {
//           toValue: targetY,
//           duration,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         lastScale.current = FOCUS_SCALE;
//         lastTranslateX.current = targetX;
//         lastTranslateY.current = targetY;
//       });

//       // Play audio after zoom completes
//       if (hotspots[index].audioUrl) {
//         setTimeout(() => {
//           playAudio(hotspots[index].audioUrl);
//         }, animated ? duration + 200 : 0);
//       }
//     },
//     [viewport, hotspots, canvasWidth, canvasHeight, scale, translateX, translateY, playAudio]
//   );

//   // Reset zoom to overview
//   const resetZoom = useCallback(() => {
//     Animated.parallel([
//       Animated.timing(scale, {
//         toValue: 1,
//         duration: 500,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(translateX, {
//         toValue: 0,
//         duration: 500,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(translateY, {
//         toValue: 0,
//         duration: 500,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       lastScale.current = 1;
//       lastTranslateX.current = 0;
//       lastTranslateY.current = 0;
//     });
//   }, [scale, translateX, translateY]);

//   // Handle layout
//   const handleLayout = useCallback((event: LayoutChangeEvent) => {
//     const { width, height } = event.nativeEvent.layout;
//     setViewport({ width, height });
//   }, []);

//   // When activeIndex changes, zoom to hotspot and play audio
//   useEffect(() => {
//     if (!isAutoZoom || !viewport.width) return;

//     zoomToHotspot(activeIndex);
//   }, [activeIndex, isAutoZoom, viewport.width, zoomToHotspot]);

//   // Pinch gesture
//   const pinchRef = useRef(null);
//   const panRef = useRef(null);

//   const onPinchGestureEvent = Animated.event(
//     [{ nativeEvent: { scale: pinchScale } }],
//     { useNativeDriver: true }
//   );

//   const onPinchHandlerStateChange = (event: any) => {
//     if (event.nativeEvent.oldState === State.ACTIVE) {
//       const newScale = lastScale.current * event.nativeEvent.scale;
//       lastScale.current = Math.max(1, Math.min(newScale, 5));
//       pinchScale.setValue(1);

//       // Apply pinch result
//       Animated.parallel([
//         Animated.timing(scale, {
//           toValue: lastScale.current,
//           duration: 100,
//           useNativeDriver: true,
//         }),
//       ]).start();

//       // Reset auto-zoom if user is pinching
//       if (Math.abs(lastScale.current - 1) > 0.1) {
//         setIsAutoZoom(false);
//       }
//     }
//   };

//   // Pan gesture
//   const onPanGestureEvent = Animated.event(
//     [{ nativeEvent: { translationX: panX, translationY: panY } }],
//     { useNativeDriver: true }
//   );

//   const onPanHandlerStateChange = (event: any) => {
//     if (event.nativeEvent.oldState === State.ACTIVE) {
//       lastTranslateX.current += event.nativeEvent.translationX;
//       lastTranslateY.current += event.nativeEvent.translationY;
//       panX.setValue(0);
//       panY.setValue(0);

//       Animated.parallel([
//         Animated.timing(translateX, {
//           toValue: lastTranslateX.current,
//           duration: 100,
//           useNativeDriver: true,
//         }),
//         Animated.timing(translateY, {
//           toValue: lastTranslateY.current,
//           duration: 100,
//           useNativeDriver: true,
//         }),
//       ]).start();

//       // Reset auto-zoom if user is panning
//       setIsAutoZoom(false);
//     }
//   };

//   // Tap hotspot to zoom manually
//   const handleHotspotPress = (index: number) => {
//     setIsAutoZoom(true);
//     setActiveIndex(index);
//   };

//   // Toggle play/pause
//   const togglePlay = () => {
//     if (isPlaying) {
//       setIsPlaying(false);
//       stopAudio();
//     } else {
//       setIsPlaying(true);
//       if (activeIndex < hotspots.length - 1) {
//         zoomToHotspot(activeIndex);
//       }
//     }
//   };

//   // Go to next
//   const goNext = () => {
//     stopAudio();
//     if (activeIndex >= hotspots.length - 1) {
//       setIsPlaying(false);
//       resetZoom();
//       return;
//     }
//     setIsAutoZoom(true);
//     setActiveIndex((prev) => prev + 1);
//   };

//   // Go to previous
//   const goPrevious = () => {
//     stopAudio();
//     setIsAutoZoom(true);
//     setActiveIndex((prev) => Math.max(0, prev - 1));
//     setIsPlaying(true);
//   };

//   // Go back
//   const onBack = () => {
//     stopAudio();
//     navigation.goBack();
//   };

//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <AudioPlayer uri={audioUri} shouldPlay={isPlaying} onPlaybackStatusUpdate={handleAudioStatus} />
//       <View style={styles.screen}>
//         {/* Top Bar */}
//         <View style={styles.topBar}>
//           <TouchableOpacity style={styles.roundBack} onPress={onBack}>
//             <ChevronLeft color={COLORS.text} size={24} />
//           </TouchableOpacity>
//           <View style={styles.scenePill}>
//             <Text style={styles.scenePillText}>{scene.title}</Text>
//           </View>
//           <View style={styles.stepPill}>
//             <Text style={styles.stepText}>
//               {activeIndex + 1} / {hotspots.length}
//             </Text>
//           </View>
//         </View>

//         {/* Image Viewport with Gestures */}
//         <PanGestureHandler
//           ref={panRef}
//           onGestureEvent={onPanGestureEvent}
//           onHandlerStateChange={onPanHandlerStateChange}
//           simultaneousHandlers={[pinchRef]}
//         >
//           <Animated.View style={styles.sceneViewport}>
//             <PinchGestureHandler
//               ref={pinchRef}
//               onGestureEvent={onPinchGestureEvent}
//               onHandlerStateChange={onPinchHandlerStateChange}
//               simultaneousHandlers={[panRef]}
//             >
//               <Animated.View
//                 onLayout={handleLayout}
//                 style={[
//                   styles.sceneCanvas,
//                   {
//                     width: canvasWidth || '100%',
//                     height: canvasHeight || 420,
//                     transform: [
//                       { scale: Animated.add(scale, Animated.subtract(pinchScale, 1)) },
//                       { translateX: Animated.add(translateX, panX) },
//                       { translateY: Animated.add(translateY, panY) },
//                     ],
//                   },
//                 ]}
//               >
//                 <ImageBackground
//                   source={{ uri: scene.imageUri }}
//                   style={styles.sceneImage}
//                   imageStyle={styles.sceneImageStyle}
//                 >
//                   <View style={styles.sceneScrim} />

//                   {/* Hotspot Markers */}
//                   {hotspots.map((spot, index) => {
//                     const isActive = index === activeIndex;
//                     return (
//                       <TouchableOpacity
//                         key={spot.id}
//                         activeOpacity={0.7}
//                         onPress={() => handleHotspotPress(index)}
//                         style={[
//                           styles.hotspot,
//                           {
//                             left: spot.x * (canvasWidth || 1),
//                             top: spot.y * (canvasHeight || 1),
//                           },
//                           isActive ? styles.hotspotActive : null,
//                         ]}
//                       >
//                         <View style={[styles.hotspotCore, isActive ? styles.hotspotCoreActive : null]}>
//                           <Volume2 color={COLORS.white} size={isActive ? 16 : 13} />
//                         </View>
//                         {isActive && (
//                           <View style={styles.hotspotPulse}>
//                             <View style={styles.hotspotPulseRing} />
//                           </View>
//                         )}
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </ImageBackground>
//               </Animated.View>
//             </PinchGestureHandler>
//           </Animated.View>
//         </PanGestureHandler>

//         {/* Dialogue Card */}
//         {currentHotspot && (
//           <View style={styles.dialogueCard}>
//             <View style={styles.dialogueHeader}>
//               <View style={styles.dialogueCopy}>
//                 <Text style={styles.readingLabel}>
//                   {isAudioReady ? (isPlaying ? 'Playing' : 'Paused') : isPlaying ? 'Loading...' : 'Paused'}
//                 </Text>
//                 <Text style={styles.roleText}>{currentHotspot.speaker}</Text>
//                 <Text style={styles.dialogueText}>{currentHotspot.dialogue}</Text>
//                 <Text style={styles.translation}>{currentHotspot.translation}</Text>
//               </View>
//               <TouchableOpacity style={styles.speakerButton} onPress={togglePlay}>
//                 {isPlaying ? (
//                   <Pause color={COLORS.text} size={22} />
//                 ) : (
//                   <Play color={COLORS.text} size={22} fill={COLORS.text} />
//                 )}
//               </TouchableOpacity>
//             </View>

//             {/* Progress Bar */}
//             <View style={styles.progressRow}>
//               <View style={styles.progressTrack}>
//                 {hotspots.map((spot, index) => (
//                   <TouchableOpacity
//                     key={spot.id}
//                     style={[
//                       styles.progressStep,
//                       index <= activeIndex ? styles.progressStepActive : null,
//                     ]}
//                     onPress={() => handleHotspotPress(index)}
//                   />
//                 ))}
//               </View>
//             </View>

//             {/* Action Buttons */}
//             <View style={styles.actions}>
//               <TouchableOpacity style={styles.iconBtn} onPress={goPrevious}>
//                 <RotateCcw color={COLORS.text} size={20} />
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.iconBtn} onPress={togglePlay}>
//                 {isPlaying ? (
//                   <Pause color={COLORS.text} size={20} />
//                 ) : (
//                   <Play color={COLORS.text} size={20} fill={COLORS.text} />
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.nextBtn, activeIndex >= hotspots.length - 1 ? styles.finishBtn : null]}
//                 onPress={goNext}
//               >
//                 <Mic color={COLORS.white} size={20} />
//                 <Text style={styles.nextBtnText}>
//                   {activeIndex >= hotspots.length - 1 ? 'Finish' : 'Next'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//       </View>
//     </GestureHandlerRootView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   screen: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     paddingTop: 56,
//   },
//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: SPACING.m,
//   },
//   roundBack: {
//     width: 46,
//     height: 46,
//     borderRadius: 23,
//     backgroundColor: 'rgba(5, 11, 24, 0.8)',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   scenePill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(5, 11, 24, 0.7)',
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//   },
//   scenePillText: {
//     color: COLORS.text,
//     fontSize: 15,
//     fontWeight: '800',
//   },
//   stepPill: {
//     minWidth: 58,
//     height: 46,
//     borderRadius: 23,
//     backgroundColor: 'rgba(5, 11, 24, 0.8)',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   stepText: {
//     color: COLORS.text,
//     fontSize: 15,
//     fontWeight: '900',
//   },
//   sceneViewport: {
//     flex: 1,
//     marginTop: 16,
//     overflow: 'hidden',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//   },
//   sceneCanvas: {
//     flex: 1,
//   },
//   sceneImage: {
//     flex: 1,
//   },
//   sceneImageStyle: {
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//   },
//   sceneScrim: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(5, 11, 24, 0.24)',
//   },
//   hotspot: {
//     position: 'absolute',
//     width: 48,
//     height: 48,
//     marginLeft: -24,
//     marginTop: -24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   hotspotActive: {
//     zIndex: 3,
//   },
//   hotspotCore: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: 'rgba(5, 11, 24, 0.86)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.22)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   hotspotCoreActive: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: COLORS.primary,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//     shadowColor: COLORS.primary,
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.6,
//     shadowRadius: 14,
//     elevation: 10,
//   },
//   hotspotPulse: {
//     position: 'absolute',
//     width: 60,
//     height: 60,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   hotspotPulseRing: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 2,
//     borderColor: COLORS.primary,
//     opacity: 0.4,
//   },
//   dialogueCard: {
//     marginHorizontal: SPACING.m,
//     marginTop: -22,
//     borderRadius: BORDER_RADIUS.l,
//     backgroundColor: COLORS.surface,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     padding: 18,
//     marginBottom: 16,
//   },
//   dialogueHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },
//   dialogueCopy: {
//     flex: 1,
//     marginRight: 14,
//   },
//   readingLabel: {
//     color: COLORS.cyan,
//     fontSize: 13,
//     fontWeight: '800',
//     marginBottom: 6,
//   },
//   roleText: {
//     color: COLORS.text,
//     fontSize: 18,
//     fontWeight: '900',
//   },
//   dialogueText: {
//     color: COLORS.text,
//     fontSize: 20,
//     lineHeight: 28,
//     fontWeight: '800',
//     marginTop: 8,
//   },
//   translation: {
//     color: COLORS.textSecondary,
//     fontSize: 14,
//     marginTop: 10,
//   },
//   speakerButton: {
//     width: 46,
//     height: 46,
//     borderRadius: 23,
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   progressRow: {
//     marginTop: 18,
//   },
//   progressTrack: {
//     flexDirection: 'row',
//     gap: 6,
//   },
//   progressStep: {
//     flex: 1,
//     height: 8,
//     borderRadius: 10,
//     backgroundColor: COLORS.border,
//   },
//   progressStepActive: {
//     backgroundColor: COLORS.accent,
//   },
//   actions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 16,
//     gap: 12,
//   },
//   iconBtn: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: COLORS.backgroundSoft,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   nextBtn: {
//     flex: 1,
//     height: 54,
//     borderRadius: 27,
//     backgroundColor: COLORS.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   finishBtn: {
//     backgroundColor: COLORS.pink,
//   },
//   nextBtnText: {
//     color: COLORS.white,
//     fontSize: 16,
//     fontWeight: '900',
//     marginLeft: 10,
//   },
// });
// import React, { useCallback, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ImageBackground,
//   StyleSheet,
//   LayoutChangeEvent,
// } from 'react-native';

// import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
// } from 'react-native-reanimated';

// import { useNavigation } from '@react-navigation/native';
// import { ChevronLeft, Pause, Play, RotateCcw, Mic, Volume2 } from 'lucide-react-native';

// import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
// import { AudioPlayer } from '../components/AudioPlayer';

// const FOCUS_SCALE = 2;

// interface Hotspot {
//   id: string;
//   x: number;
//   y: number;
//   speaker: string;
//   dialogue: string;
//   translation: string;
//   audioUrl: string;
// }

// interface SceneScreenProps {
//   scene: {
//     id: string;
//     title: string;
//     imageUri: string;
//     hotspots: Hotspot[];
//   };
// }

// export const SceneScreen = ({ scene }: SceneScreenProps) => {
//   const navigation = useNavigation<any>();

//   const hotspots = scene.hotspots;
//   const [activeIndex, setActiveIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [audioUri, setAudioUri] = useState<string | null>(null);
//   const [viewport, setViewport] = useState({ width: 0, height: 0 });

//   // 🔥 Reanimated shared values
//   const scale = useSharedValue(1);
//   const savedScale = useSharedValue(1);

//   const tx = useSharedValue(0);
//   const ty = useSharedValue(0);
//   const savedTx = useSharedValue(0);
//   const savedTy = useSharedValue(0);

//   const currentHotspot = hotspots[activeIndex];

//   // ---------------- AUDIO ----------------
//   const playAudio = useCallback((url: string) => {
//     setAudioUri(url);
//   }, []);

//   const stopAudio = useCallback(() => {
//     setAudioUri(null);
//   }, []);

//   // ---------------- ZOOM ----------------
//   const zoomToHotspot = useCallback(
//     (index: number) => {
//       if (!viewport.width) return;

//       const spot = hotspots[index];

//       const targetX = viewport.width * 0.5 - spot.x * viewport.width * FOCUS_SCALE;
//       const targetY = viewport.height * 0.4 - spot.y * viewport.height * FOCUS_SCALE;

//       scale.value = withTiming(FOCUS_SCALE, { duration: 500 });
//       tx.value = withTiming(targetX, { duration: 500 });
//       ty.value = withTiming(targetY, { duration: 500 });

//       savedScale.value = FOCUS_SCALE;
//       savedTx.value = targetX;
//       savedTy.value = targetY;

//       if (spot.audioUrl) {
//         setTimeout(() => playAudio(spot.audioUrl), 600);
//       }
//     },
//     [viewport]
//   );

//   const resetZoom = () => {
//     scale.value = withTiming(1);
//     tx.value = withTiming(0);
//     ty.value = withTiming(0);

//     savedScale.value = 1;
//     savedTx.value = 0;
//     savedTy.value = 0;
//   };

//   // ---------------- GESTURES ----------------

//   const panGesture = Gesture.Pan()
//     .onUpdate((e) => {
//       tx.value = savedTx.value + e.translationX;
//       ty.value = savedTy.value + e.translationY;
//     })
//     .onEnd(() => {
//       savedTx.value = tx.value;
//       savedTy.value = ty.value;
//     });

//   const pinchGesture = Gesture.Pinch()
//     .onUpdate((e) => {
//       scale.value = savedScale.value * e.scale;
//     })
//     .onEnd(() => {
//       savedScale.value = scale.value;
//     });

//   const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

//   // ---------------- ANIMATION STYLE ----------------
//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [
//         { scale: scale.value },
//         { translateX: tx.value },
//         { translateY: ty.value },
//       ],
//     };
//   });

//   // ---------------- HOTSPOT ----------------
//   const handleHotspotPress = (index: number) => {
//     setActiveIndex(index);
//     zoomToHotspot(index);
//   };

//   // ---------------- LAYOUT ----------------
//   const onLayout = (e: LayoutChangeEvent) => {
//     setViewport(e.nativeEvent.layout);
//   };

//   // auto zoom
//   useEffect(() => {
//     if (viewport.width) {
//       zoomToHotspot(activeIndex);
//     }
//   }, [activeIndex, viewport.width]);

//   // ---------------- UI ----------------
//   return (
//     <View style={styles.container}>
//       <AudioPlayer uri={audioUri} shouldPlay={isPlaying} />

//       {/* TOP BAR */}
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <ChevronLeft color={COLORS.text} />
//         </TouchableOpacity>

//         <Text style={styles.title}>{scene.title}</Text>

//         <Text style={styles.step}>
//           {activeIndex + 1}/{hotspots.length}
//         </Text>
//       </View>

//       {/* SCENE */}
//       <GestureDetector gesture={gesture}>
//         <Animated.View style={[styles.canvas, animatedStyle]} onLayout={onLayout}>
//           <ImageBackground source={{ uri: scene.imageUri }} style={styles.image}>
//             {hotspots.map((h, i) => {
//               const active = i === activeIndex;

//               return (
//                 <TouchableOpacity
//                   key={h.id}
//                   onPress={() => handleHotspotPress(i)}
//                   style={[
//                     styles.hotspot,
//                     {
//                       left: h.x * viewport.width,
//                       top: h.y * viewport.height,
//                     },
//                   ]}
//                 >
//                   <View style={[styles.dot, active && styles.activeDot]}>
//                     <Volume2 color="white" size={14} />
//                   </View>
//                 </TouchableOpacity>
//               );
//             })}
//           </ImageBackground>
//         </Animated.View>
//       </GestureDetector>

//       {/* CARD */}
//       {currentHotspot && (
//         <View style={styles.card}>
//           <Text style={styles.speaker}>{currentHotspot.speaker}</Text>
//           <Text style={styles.dialogue}>{currentHotspot.dialogue}</Text>
//           <Text style={styles.translation}>{currentHotspot.translation}</Text>

//           <View style={styles.actions}>
//             <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
//               {isPlaying ? <Pause /> : <Play />}
//             </TouchableOpacity>

//             <TouchableOpacity onPress={resetZoom}>
//               <RotateCcw />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 if (activeIndex < hotspots.length - 1) {
//                   setActiveIndex((p) => p + 1);
//                 }
//               }}
//             >
//               <Mic />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// // ---------------- STYLES ----------------
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },

//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     padding: SPACING.m,
//   },

//   title: {
//     color: COLORS.text,
//     fontWeight: '800',
//   },

//   step: {
//     color: COLORS.text,
//   },

//   canvas: {
//     flex: 1,
//   },

//   image: {
//     flex: 1,
//   },

//   hotspot: {
//     position: 'absolute',
//     width: 40,
//     height: 40,
//     marginLeft: -20,
//     marginTop: -20,
//   },

//   dot: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: COLORS.backgroundSoft,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   activeDot: {
//     backgroundColor: COLORS.primary,
//   },

//   card: {
//     padding: 16,
//     backgroundColor: COLORS.surface,
//     borderTopLeftRadius: BORDER_RADIUS.l,
//     borderTopRightRadius: BORDER_RADIUS.l,
//   },

//   speaker: {
//     color: COLORS.text,
//     fontWeight: '900',
//     fontSize: 16,
//   },

//   dialogue: {
//     fontSize: 18,
//     marginTop: 6,
//     color: COLORS.text,
//   },

//   translation: {
//     marginTop: 6,
//     color: COLORS.textSecondary,
//   },

//   actions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 12,
//   },
// });






import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { AudioPlayer } from '../components/AudioPlayer';
import { WordsSheet } from '../components/WordsSheet';
import { LeitnerBoxModal } from '../components/LeitnerBoxModal';
import { expandScenarioToDialogueItems, type Scenario } from '../data/scenarios';
import { useScenes } from '../data/ScenesContext';

const FOCUS_SCALE = 2;
const AUTO_ADVANCE_MS = 1000;

export const SceneScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { scenarioId } = route.params || {};
  const { getScene } = useScenes();

  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    let mounted = true;
    getScene(scenarioId).then((s) => {
      if (mounted) setScenario(s ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [scenarioId, getScene]);

  const hotspots = scenario ? expandScenarioToDialogueItems(scenario) : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [wordsVisible, setWordsVisible] = useState(false);
  const [boxVisible, setBoxVisible] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentDialogue = hotspots[activeIndex];

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  // رفرنس‌های به‌روز تا تایمرها بدون وابسته‌کردن افکت‌ها به مقادیر تازه دسترسی داشته باشند
  const playingRef = useRef(playing);
  const hotspotsLenRef = useRef(hotspots.length);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    hotspotsLenRef.current = hotspots.length;
  }, [hotspots.length]);

  // رفتن به دیالوگ بعدی (یا پایان در آخرین دیالوگ)
  const advanceToNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev >= hotspotsLenRef.current - 1) {
        setPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const playAudio = useCallback((url: string) => {
    setAudioUri(url);
    setIsAudioReady(false);
  }, []);

  const stopAudio = useCallback(() => {
    setAudioUri(null);
    setIsAudioReady(false);
  }, []);

  const handleAudioStatus = useCallback((status: string) => {
    if (status === 'playing') {
      setIsAudioReady(true);
    } else if (status === 'finished' || status === 'error') {
      // پایان صدا یا خطای پخش → بعد از کمی مکث خودکار به دیالوگ بعدی برو
      clearAdvanceTimer();
      if (playingRef.current) {
        advanceTimer.current = setTimeout(advanceToNext, AUTO_ADVANCE_MS);
      }
    }
  }, [clearAdvanceTimer, advanceToNext]);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    const spot = hotspots[activeIndex];
    if (!spot) return;

    // هر تایمر پیشرفت قبلی را لغو کن تا با جابه‌جایی دستی/خودکار تداخل نکند
    clearAdvanceTimer();

    // نقطه‌ی هات‌اسپات (spot.x, spot.y نسبت ۰..۱) را به مرکز صفحه (کمی بالاتر از وسط) می‌بریم.
    // با مبدأ مقیاس در مرکعِ ویو: پاسخِ صحیح برای transform ترتیب [translate, scale].
    const S = FOCUS_SCALE;
    const targetX = S * viewport.width * (0.5 - spot.x);
    const targetY = -0.08 * viewport.height - S * viewport.height * (spot.y - 0.5);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: FOCUS_SCALE,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (spot.audioUrl) {
      // دیالوگ دارای ویس: پس از پایان زوم پخش کن (پیشرفت با پایان صدا انجام می‌شود)
      setTimeout(() => playAudio(spot.audioUrl), 700);
    } else {
      // دیالوگ بدون ویس: بعد از مکثی متناسب با طول متن خودکار جلو برو تا گیر نکند
      const holdMs = Math.min(6000, Math.max(2500, (spot.dialogue?.length || 0) * 55));
      advanceTimer.current = setTimeout(() => {
        if (playingRef.current) advanceToNext();
      }, holdMs + 700);
    }
  }, [
    scenario,
    activeIndex,
    viewport.width,
    viewport.height,
    playAudio,
    clearAdvanceTimer,
    advanceToNext,
  ]);

  useEffect(() => {
    if (!playing) {
      stopAudio();
      clearAdvanceTimer();
    }
  }, [playing, stopAudio, clearAdvanceTimer]);

  useEffect(() => {
    return () => clearAdvanceTimer();
  }, [clearAdvanceTimer]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  };

  const goNext = () => {
    clearAdvanceTimer();
    stopAudio();
    if (activeIndex >= hotspots.length - 1) {
      setPlaying(false);
      return;
    }
    setActiveIndex((value) => value + 1);
  };

  const goPrevious = () => {
    clearAdvanceTimer();
    stopAudio();
    setPlaying(true);
    setActiveIndex((value) => Math.max(0, value - 1));
  };

  const togglePlay = () => {
    if (playing) {
      clearAdvanceTimer();
      stopAudio();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (currentDialogue.audioUrl) {
        playAudio(currentDialogue.audioUrl);
      }
    }
  };

  const onSceneBack = () => {
    clearAdvanceTimer();
    stopAudio();
    navigation.navigate('Scenes');
  };

  // تا وقتی صحنه از بک‌اند بارگذاری نشده، لودینگ نمایش بده
  if (!scenario) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AudioPlayer uri={audioUri} shouldPlay={playing} onPlaybackStatusUpdate={handleAudioStatus} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundBack} onPress={onSceneBack}>
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.scenePill}>
          <Text style={styles.scenePillText}>{scenario.title}</Text>
        </View>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>
            {activeIndex + 1} / {hotspots.length}
          </Text>
        </View>
      </View>

      {/* SCENE WITH ZOOM — تصویر زوم/جابه‌جا می‌شود تا نقطه‌ی فعال وسط بیاید (بدون آیکون) */}
      <View style={styles.sceneViewport} onLayout={handleLayout}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          <ImageBackground
            source={scenario.imageUri}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* DIALOGUE CARD */}
      {currentDialogue && (
        <View style={styles.dialogueCard}>
          <View style={styles.dialogueHeader}>
            <View style={styles.dialogueCopy}>
              <Text style={styles.readingLabel}>
                {isAudioReady ? (playing ? 'Reading...' : 'Paused') : playing ? 'Loading...' : 'Paused'}
              </Text>
              <Text style={styles.roleText}>{currentDialogue.speaker}</Text>
              <Text style={styles.dialogueText}>{currentDialogue.dialogue}</Text>
              <Text style={styles.translation}>{currentDialogue.translation}</Text>
            </View>
            <TouchableOpacity
              style={styles.wordsBtn}
              onPress={() => {
                setPlaying(false);
                setWordsVisible(true);
              }}
            >
              <BookOpen color={COLORS.primary} size={20} />
              <Text style={styles.wordsBtnText}>واژه‌ها</Text>
            </TouchableOpacity>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              {hotspots.map((spot, index) => (
                <View
                  key={spot.id}
                  style={[
                    styles.progressStep,
                    index <= activeIndex ? styles.progressStepActive : null,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* ACTION BUTTONS: قبلی / پخش‌ومکث / بعدی */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.navBtn, activeIndex === 0 ? styles.navBtnDisabled : null]}
              onPress={goPrevious}
              disabled={activeIndex === 0}
            >
              <ChevronLeft color={activeIndex === 0 ? COLORS.textSecondary : COLORS.text} size={20} />
              <Text
                style={[styles.navBtnText, activeIndex === 0 ? styles.navBtnTextDisabled : null]}
              >
                قبلی
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
              {playing ? (
                <Pause color={COLORS.white} size={22} />
              ) : (
                <Play color={COLORS.white} size={22} fill={COLORS.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary, activeIndex >= hotspots.length - 1 ? styles.finishBtn : null]}
              onPress={goNext}
            >
              <Text style={styles.navBtnTextPrimary}>
                {activeIndex >= hotspots.length - 1 ? 'پایان' : 'بعدی'}
              </Text>
              {activeIndex < hotspots.length - 1 && (
                <ChevronRight color={COLORS.white} size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* شیت واژه‌ها + جعبه‌ی لایتنر */}
      <WordsSheet
        visible={wordsVisible}
        onClose={() => setWordsVisible(false)}
        dialogueText={currentDialogue?.dialogue ?? ''}
        backendWords={currentDialogue?.words}
        onOpenBox={() => {
          setWordsVisible(false);
          setBoxVisible(true);
        }}
      />
      <LeitnerBoxModal visible={boxVisible} onClose={() => setBoxVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingTop: 56,
  },
  roundBack: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(5, 11, 24, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 11, 24, 0.7)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scenePillText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepPill: {
    minWidth: 58,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(5, 11, 24, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },

  sceneViewport: {
    flex: 1,
    marginTop: 16,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sceneCanvas: {
    flex: 1,
  },
  sceneImage: {
    flex: 1,
  },
  sceneImageStyle: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sceneScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 11, 24, 0.24)',
  },

  hotspot: {
    position: 'absolute',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotActive: {
    zIndex: 3,
  },
  hotspotCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(5, 11, 24, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotCoreActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },

  dialogueCard: {
    marginHorizontal: SPACING.m,
    marginTop: -22,
    marginBottom: 28,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    paddingBottom: 22,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dialogueCopy: {
    flex: 1,
    marginRight: 14,
  },
  wordsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  wordsBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  readingLabel: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  dialogueText: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  translation: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },

  progressRow: {
    marginTop: 18,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  progressStep: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  progressStepActive: {
    backgroundColor: COLORS.accent,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  navBtnTextDisabled: {
    color: COLORS.textSecondary,
  },
  navBtnTextPrimary: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.pink,
  },
});