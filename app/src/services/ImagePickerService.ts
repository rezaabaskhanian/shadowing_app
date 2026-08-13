let picker: any = null;
try {
  picker = require('react-native-image-picker');
} catch (e) {
  // بسته وقتی نصب/لینک شود (native rebuild) فعال می‌شود؛ تا آن زمان دکمه‌ی
  // افزودن عکس بی‌اثر است و کاربر همچنان می‌تواند فقط با متن پیشنهاد بدهد.
  picker = null;
}

export interface PickedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

// ImagePickerService یک عکس از گالری دستگاه انتخاب می‌کند (اختیاری بودن عکس در
// پیشنهاد صحنه یعنی نبود این بسته نباید کل فرم را خراب کند).
export class ImagePickerService {
  static available(): boolean {
    return !!picker;
  }

  static async pickImage(): Promise<PickedImage | null> {
    if (!picker) return null;
    try {
      const result = await picker.launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets || result.assets.length === 0) return null;
      const asset = result.assets[0];
      if (!asset.uri) return null;
      return {
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        mimeType: asset.type || 'image/jpeg',
      };
    } catch (err) {
      console.warn('[ImagePickerService] pickImage failed:', err);
      return null;
    }
  }
}
