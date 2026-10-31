# منصة المسابقات والتحديات التفاعلية (LocalStorage Quiz Platform)

منصة إلكترونية للمسابقات والمعرفة تعمل بالكامل داخل المتصفح باستخدام JavaScript وLocalStorage فقط، دون حاجة لخادم أو قاعدة بيانات خارجية.

## التقنية
- HTML5, CSS3 (Tailwind CSS عبر CDN), JavaScript ES6+ Modules.
- تصميم متجاوب (Responsive)، دعم اللغة العربية والإنجليزية مع اتجاه واجهة (RTL/LTR).
- وضع ليلي ونهائي (Dark/Light Mode) مع حفظ التفضيل في LocalStorage.
- التخزين الوحيد: LocalStorage من خلال طبقة مركزية (`js/storage/storageManager.js`).

## تشغيل المشروع
لا حاجة لتثبيتDependencias أو خادم. افتح ملف `index.html` مباشرة في المتصفح:
```
موقع تعلم اساسيات البرمجة بالعب/
└── index.html   # افتح هذا الملف في المتصفح
```
أو عبر أي خادم ثابت بسيط (مثل Live Server في VS Code).

## بنية الملفات
```
index.html                 # نقطة الدخول والروتر
css/
  themes.css               # متغيرات السمة (ليلي/نهاري)
  style.css                # أنماط أساسية
js/
  app.js                   # التمهيد، الروتر،حراس الصلاحية، السمة واللغة
  config/appConfig.js      # مفاتيح التخزين، الإصدار، القيم الافتراضية، القواميس ثنائية اللغة
  storage/
    storageKeys.js         # مفاتيح التخزين الموحدة
    storageManager.js      # الطبقة المركزية: getData/saveData/updateData/deleteData/clearData/initializeStorage/validateStoredData/migrateStorage/exportData/importData/resetData/logAudit
    storageValidation.js   # التحقق من المداخلات وتنظيف النصوص (حماية من XSS)
    migrations.js          # نظام ترحيل إصدارات البيانات
  utils/
    id.js                  # معرفات فريدة UUID
    crypto.js              # تجزئة كلمة المرور (SHA-256)
  services/
    questionService.js     # جلب وتصفية الأسئلة المعتمدة
    gamificationService.js # النقاط، XP، المستويات، الشارات، الإنجازات، التحديات، streak
    competitionService.js  # غرف المنافسات المحلية
    leaderboardService.js  # لوحة المتصدرين (عام/أسبوعي/شهري/فئة عمرية)
  auth/
    authService.js         # تسجيل/دخول/خروج/تعديل/حذف حساب، جلسات محلية
  pages/
    homePage.js            # الصفحة الرئيسية
    authPages.js           # تسجيل الدخول والتسجيل
    dashboard.js           # لوحة المستخدم
    categoryPage.js        # التصنيفات
    quizStart.js / quizPlay.js / quizResult.js  # المسابقة الفردية
    adminPage.js           # لوحة الإدارة (أسئلة، تصنيفات، سجل تدقيق)
    competitionPage.js     # المنافسات المحلية
    leaderboardPage.js     # لوحة المتصدرين
    settingsPage.js        # الإعدادات، تصدير/استيراد، إعادة ضبط
  tests/
    storage.test.js / auth.test.js / gamification.test.js / admin.test.js / competition.test.js / leaderboard.test.js / settings.test.js
    testUtils.js
tests/_run_tests.mjs         # مشغل الاختبارات (يُحذف بعد الاستخدام)
backend/                   # غير مستخدم في هذا الإصدار (पूरा لخيارات مستقبلية)
```

## مفاتيح التخزين (LocalStorage)
تُعرَّف في `js/config/appConfig.js` وتُستخدم حصرًا من خلال `StorageManager`:
`app_users`, `app_current_user`, `app_questions`, `app_categories`, `app_age_groups`, `app_difficulty_levels`, `app_quizzes`, `app_quiz_questions`, `app_quiz_results`, `app_points`, `app_xp`, `app_levels`, `app_badges`, `app_user_badges`, `app_achievements`, `app_challenges`, `app_challenge_progress`, `app_leaderboard`, `app_settings`, `app_admin`, `app_audit_logs`, `app_competition_rooms`, `app_competition_participants`, `app_competition_room_questions`, `app_question_review`, `app_version`.

## إدارة حساب المدير
- يتم إنشاء حساب مدير واحد تلقائيًا عند أول تشغيل (في `initializeStorage`).
- اسم المستخدم: `admin` ، كلمة المرور: `Admin@123456` (تُخزّن مجمزة بـ SHA-256، ليست نصًا صريحًا).
- لا يمكن إنشاء حساب مدير من خلال التسجيل العام، ولا يمكن حذف حساب المدير من الواجهة.
- المدير يستطيع: عرض وتعديل وحذف الأسئلة، اعتماد أو رفض الأسئلة، إدارة التصنيفات، الاطلاع على سجل التدقيق (`app_audit_logs`).

## النسخ الاحتياطي والاستعادة
من صفحة `#settings` (الإعدادات):
- **تصدير**: يحمّل جميع بيانات المستخدم كملف JSON (`quiz-export-YYYY-MM-DD.json`).
- **استيراد**: 선택 ملف JSON، يُتحقق من بنيته، ويُطلب تأكيد قبل استبدال البيانات الحالية. المفاتيح غير المعروفة تُتجاهل.
- **إعادة ضبط**: تمسح جميع البيانات المحلية نهائيًا بعد تأكيد صريح من المستخدم ولا يمكن الاسترجاع.

## حدود الإصدار المحلي
- 모든 البيانات تُخزّن في LocalStorage للمتصفح والجهاز الحالي فقط؛ ليست مشتركة بين الأجهزة أو المستخدمين.
- LocalStorage ليس نظام مصادقة آمنًا؛ كلمات المرور تُخزّن مجمزة ولكن يمكن لمستخدم الجهاز نفسه التلاعب بالبيانات عبر أدوات المتصفح.
- لا تناسب الخدمة الإنتاجية متعددة الأجهزة؛ الغرض منها التعلم والتجربة المحلية.
- البنية منظمة بفصل المسؤوليات لتسهيل ربطها مستقبلًا بخادم حقيقي وقاعدة بيانات (مثل PostgreSQL) عبر واجهات API دون إعادة بناء الواجهة.

## الاختبارات
تحتوي المجلد `tests/` على اختبارات وحدة وتكامل للخدمات الأساسية (التخزين، المصادقة، gamification، الإدارة، المنافسات، لوحة المتصدرين، الإعدادات). يمكن تشغيلها عبر Node.js مع ملف `tests/_run_tests.mjs` (يحتاج شيم `localStorage` أو متصفح).

## تطوير المستقبل
النظام مصمم للانتقال إلى خلفية حقيقية: استبدل `StorageManager` بطبقة خدمة تُستدعي واجهات API، مع الاحتفاظ بنفس واجهات الصفحات والخدمات.
