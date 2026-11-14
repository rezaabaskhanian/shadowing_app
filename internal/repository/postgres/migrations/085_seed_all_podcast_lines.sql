-- +migrate Up
-- اضافه کردن متن و جمله‌های کامل برای تمام ۹ قسمت مجموعه‌های پادکست

-- قسمت ۱ از مجموعه ۱: Morning Coffee Routine
INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms) VALUES
('a1111111-1111-1111-1111-000000000001', 0, 'Barista', 'Good morning! What can I get started for you today?', 'صبح بخیر! امروز چی براتون آماده کنم؟', 0, 4000),
('a1111111-1111-1111-1111-000000000001', 1, 'Customer', 'Hi! Could I have a medium vanilla latte with oat milk, please?', 'سلام! می‌تونم یه لاته وانیل متوسط با شیر جو دوسر داشته باشم لطفاً؟', 4200, 9500),
('a1111111-1111-1111-1111-000000000001', 2, 'Barista', 'Sure thing. Would you like that hot or iced?', 'حتماً. گرم میل دارید یا آیس؟', 9800, 13000),
('a1111111-1111-1111-1111-000000000001', 3, 'Customer', 'Hot, please. And is there a light roast option available?', 'گرم لطفاً. و آیا گزینه برشته‌کاری روشن هم موجود دارید؟', 13300, 18500),
('a1111111-1111-1111-1111-000000000001', 4, 'Barista', 'Yes, our Ethiopian single-origin roast is wonderful today.', 'بله، قهوه تک‌خاستگاه اتیوپی ما امروز فوق‌العاده‌ست.', 18800, 24000),
('a1111111-1111-1111-1111-000000000001', 5, 'Customer', 'Sounds perfect! Here is my card for payment.', 'عالی به نظر می‌رسه! بفرمایید این هم کارتم برای پرداخت.', 24300, 29000),
('a1111111-1111-1111-1111-000000000001', 6, 'Barista', 'Thank you. It will be ready at the counter in two minutes.', 'ممنون. تا دو دقیقه دیگه روی پیشخوان آماده‌ست.', 29300, 35000)
ON CONFLICT DO NOTHING;

-- قسمت ۲ از مجموعه ۱: Finding the Right Train
INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms) VALUES
('a1111111-1111-1111-1111-000000000002', 0, 'Traveler', 'Excuse me, could you tell me which platform the express train leaves from?', 'ببخشید، می‌تونید بگید قطار تندرو از کدوم سکو حرکت می‌کنه؟', 0, 5500),
('a1111111-1111-1111-1111-000000000002', 1, 'Officer', 'Sure, that will be platform four on the lower level.', 'حتماً، از سکوی شماره چهار در طبقه پایین خواهد بود.', 5800, 10500),
('a1111111-1111-1111-1111-000000000002', 2, 'Traveler', 'Do I need to transfer at Central Station to reach the airport?', 'آیا لازمه در ایستگاه مرکزی برای رفتن به فرودگاه خط عوض کنم؟', 10800, 16000),
('a1111111-1111-1111-1111-000000000002', 3, 'Officer', 'No, this one goes directly to the airport terminal.', 'خیر، این قطار مستقیم به ترمینال فرودگاه می‌ره.', 16300, 21000),
('a1111111-1111-1111-1111-000000000002', 4, 'Traveler', 'Thank you so much! Have a great day.', 'خیلی ممنونم! روز خوبی داشته باشید.', 21300, 25000)
ON CONFLICT DO NOTHING;

-- قسمت ۳ از مجموعه ۱: Shopping at the Local Market
INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms) VALUES
('a1111111-1111-1111-1111-000000000003', 0, 'Shopper', 'Hello! Are these organic strawberries from today morning?', 'سلام! آیا این توت‌فرنگی‌های ارگانیک مال امروز صبح هستند؟', 0, 5000),
('a1111111-1111-1111-1111-000000000003', 1, 'Vendor', 'Yes, freshly picked from the farm. Very sweet and juicy.', 'بله، تازه از مزرعه چیده شده‌اند. خیلی شیرین و آبدارند.', 5300, 11000),
('a1111111-1111-1111-1111-000000000003', 2, 'Shopper', 'Great! I will take two baskets, please.', 'عالیه! لطفاً دو سبد برمی‌دارم.', 11300, 15000),
('a1111111-1111-1111-1111-000000000003', 3, 'Vendor', 'That will be eight dollars in total.', 'مجموعاً می‌شه هشت دلار.', 15300, 19000),
('a1111111-1111-1111-1111-000000000003', 4, 'Shopper', 'Here you go. Could I get a receipt as well?', 'بفرمایید. می‌تونم رسید هم داشته باشم؟', 19300, 24000)
ON CONFLICT DO NOTHING;

-- +migrate Down
-- no-op

