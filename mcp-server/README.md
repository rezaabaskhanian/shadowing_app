# lingoflow-mcp

سرور MCP که API ادمینِ LingoFlow را در اختیار Claude می‌گذارد تا ساخت محتوا و گزارش‌گیری خودکار شود.

## قانون امنیتی
- هر چیزی که ساخته می‌شود **پیش‌نویس / غیرفعال** است؛ انتشار فقط از پنل ادمین.
- ویرایش‌ها وضعیت انتشار را تغییر نمی‌دهند.
- ابزارِ حذف، کاربر، اشتراک، پرداخت و تنظیمات وجود ندارد.

## ساخت
```bash
cd mcp-server
go build -o lingoflow-mcp .
```

## اتصال به Claude Code
```bash
claude mcp add lingoflow --scope user \
  -e LINGOFLOW_API_URL=https://api.lingoflow.ir \
  -e LINGOFLOW_ADMIN_PHONE=09xxxxxxxxx \
  -e LINGOFLOW_ADMIN_PASSWORD='...' \
  -- /Users/apple/Desktop/project_go/Shadowing-backend/mcp-server/lingoflow-mcp
```
بعد Claude Code را دوباره باز کن و با `/mcp` ببین وصل است.

برای تست روی سرور محلی، `LINGOFLOW_API_URL=http://localhost:8088`.

## ابزارها
| بخش | ابزار |
|---|---|
| صحنه | list_scenes, get_scene, generate_scene, create_scene_draft, update_scene |
| صدا/آپلود | list_tts_voices, generate_audio, upload_image, upload_audio, upload_video |
| کتابخانه | list_resources, get_resource, save_resource, list_idioms, import_idioms |
| پادکست | list_podcasts, get_podcast, get_podcast_level_presets, generate_podcast_script, create_podcast_draft, update_podcast, generate_podcast_audio |
| موضوع صحبت | list_speaking_topics, suggest_speaking_topic, create_speaking_topic_draft, update_speaking_topic |
| کلیپ ویدیو | list_video_clips, get_video_clip, detect_video_lines, complete_video_clip, create_video_clip_draft, update_video_clip |
| گزارش | get_analytics, get_ai_usage_report, content_health |

## نمونه درخواست‌ها
- «منبع X را بخوان و ۳ صحنه‌ی starter پیش‌نویس با صدا بساز»
- «برای صحنه‌ی Y یک پادکست درسیِ beginner بساز و صدایش را تولید کن»
- «content_health: چه محتوایی ناقص است؟»
- «آمار ۷ روز اخیر: کدام بخش‌ها بیشتر استفاده شده‌اند؟»
