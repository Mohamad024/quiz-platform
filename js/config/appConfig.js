export const STORAGE_VERSION = 1;
export const STORAGE_KEYS = {
  USERS: 'app_users',
  CURRENT_USER: 'app_current_user',
  QUESTIONS: 'app_questions',
  CATEGORIES: 'app_categories',
  AGE_GROUPS: 'app_age_groups',
  DIFFICULTIES: 'app_difficulty_levels',
  QUIZZES: 'app_quizzes',
  QUIZ_QUESTIONS: 'app_quiz_questions',
  QUIZ_RESULTS: 'app_quiz_results',
  POINTS: 'app_points',
  XP: 'app_xp',
  LEVELS: 'app_levels',
  BADGES: 'app_badges',
  USER_BADGES: 'app_user_badges',
  ACHIEVEMENTS: 'app_achievements',
  CHALLENGES: 'app_challenges',
  CHALLENGE_PROGRESS: 'app_challenge_progress',
  LEADERBOARD: 'app_leaderboard',
  SETTINGS: 'app_settings',
  ADMIN: 'app_admin',
  AUDIT_LOGS: 'app_audit_logs',
  COMPETITION_ROOMS: 'app_competition_rooms',
  COMPETITION_PARTICIPANTS: 'app_competition_participants',
  COMPETITION_ROOM_QUESTIONS: 'app_competition_room_questions',
  QUESTION_REVIEW: 'app_question_review',
  VERSION: 'app_version',
};
export const ROLES = { USER: 'user', ADMIN: 'admin' };
export const QUIZ_TYPES = { SOLO: 'solo', MULTIPLAYER: 'multiplayer' };
export const QUESTION_STATUS = { DRAFT: 'draft', REVIEW: 'review', APPROVED: 'approved', REJECTED: 'rejected' };
export const CHALLENGE_TYPES = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly' };
export const ROOM_STATUS = { WAITING: 'waiting', ACTIVE: 'active', FINISHED: 'finished' };

export const DEFAULT_DATA = {
  [STORAGE_KEYS.AGE_GROUPS]: [
    { id: 'ag1', name: { ar: 'أطفال (6-12)', en: 'Kids (6-12)' }, minAge: 6, maxAge: 12 },
    { id: 'ag2', name: { ar: 'مراهقون (13-17)', en: 'Teens (13-17)' }, minAge: 13, maxAge: 17 },
    { id: 'ag3', name: { ar: 'بالغون (18+)', en: 'Adults (18+)' }, minAge: 18, maxAge: 100 },
  ],
  [STORAGE_KEYS.DIFFICULTIES]: [
    { id: 'df1', name: 'easy', value: 1, xpMultiplier: 1.0, pointMultiplier: 1.0, label: { ar: 'سهل', en: 'Easy' } },
    { id: 'df2', name: 'medium', value: 2, xpMultiplier: 1.5, pointMultiplier: 1.5, label: { ar: 'متوسط', en: 'Medium' } },
    { id: 'df3', name: 'hard', value: 3, xpMultiplier: 2.0, pointMultiplier: 2.0, label: { ar: 'صعب', en: 'Hard' } },
  ],
  [STORAGE_KEYS.CATEGORIES]: [
    { id: 'cat1', name: { ar: 'العلوم', en: 'Science' }, slug: 'science', description: null, parentId: null },
    { id: 'cat2', name: { ar: 'الرياضيات', en: 'Math' }, slug: 'math', description: null, parentId: null },
    { id: 'cat3', name: { ar: 'التاريخ', en: 'History' }, slug: 'history', description: null, parentId: null },
    { id: 'cat4', name: { ar: 'الجغرافيا', en: 'Geography' }, slug: 'geography', description: null, parentId: null },
    { id: 'cat5', name: { ar: 'الثقافة العامة', en: 'General Knowledge' }, slug: 'general', description: null, parentId: null },
    { id: 'cat6', name: { ar: 'التكنولوجيا', en: 'Technology' }, slug: 'technology', description: null, parentId: null },
    { id: 'cat7', name: { ar: 'الذكاء الاصطناعي', en: 'AI' }, slug: 'ai', description: null, parentId: null },
    { id: 'cat8', name: { ar: 'البرمجة', en: 'Programming' }, slug: 'programming', description: null, parentId: null },
  ],
  [STORAGE_KEYS.LEVELS]: [
    { id: 'lv1', level: 1, minXP: 0, maxXP: 99, name: { ar: 'مبتدئ', en: 'Beginner' } },
    { id: 'lv2', level: 2, minXP: 100, maxXP: 249, name: { ar: 'متوسط', en: 'Intermediate' } },
    { id: 'lv3', level: 3, minXP: 250, maxXP: 499, name: { ar: 'متقدم', en: 'Advanced' } },
    { id: 'lv4', level: 4, minXP: 500, maxXP: 999, name: { ar: 'خبير', en: 'Expert' } },
    { id: 'lv5', level: 5, minXP: 1000, maxXP: null, name: { ar: 'أسطوري', en: 'Legendary' } },
  ],
  [STORAGE_KEYS.BADGES]: [
    { id: 'bd1', name: { ar: 'بداية جيدة', en: 'Good Start' }, description: { ar: 'إكمال أول مسابقة', en: 'Complete first quiz' }, criteria: { type: 'quiz_count', value: 1 }, imageUrl: null },
    { id: 'bd2', name: { ar: 'مثالي', en: 'Perfectionist' }, description: { ar: 'إجابة صحيحة على 10 أسئلة متتالية', en: '10 consecutive correct answers' }, criteria: { type: 'streak_correct', value: 10 }, imageUrl: null },
  ],
  [STORAGE_KEYS.ACHIEVEMENTS]: [
    { id: 'ac1', name: { ar: 'مائة سؤال', en: '100 Questions' }, description: { ar: 'الإجابة على 100 سؤال', en: 'Answer 100 questions' }, criteria: { type: 'answers_count', value: 100 }, type: 'count' },
  ],
  [STORAGE_KEYS.CHALLENGES]: [
    { id: 'ch1', title: { ar: 'تحدي الأسبوع', en: 'Weekly Challenge' }, description: { ar: 'أكمل 5 مسابقات هذا الأسبوع', en: 'Complete 5 quizzes this week' }, type: 'weekly', categoryId: null, target: 5, rewardXp: 100, rewardPoints: 50, startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date(Date.now() + 604800000).toISOString(), isActive: true },
    { id: 'ch2', title: { ar: 'تحدي اليوم', en: 'Daily Challenge' }, description: { ar: 'أكمل مسابقة واحدة اليوم', en: 'Complete 1 quiz today' }, type: 'daily', categoryId: null, target: 1, rewardXp: 30, rewardPoints: 20, startDate: new Date().setHours(0,0,0,0) ? new Date().toISOString() : new Date().toISOString(), endDate: new Date(Date.now() + 86400000).toISOString(), isActive: true },
  ],
  [STORAGE_KEYS.SETTINGS]: [
    { id: 'st1', key: 'site_name', value: { ar: 'منصة المسابقات التفاعلية', en: 'Interactive Quiz Platform' } },
    { id: 'st2', key: 'default_language', value: 'ar' },
    { id: 'st3', key: 'default_theme', value: 'light' },
  ],
};
export const DEFAULT_QUESTIONS = [
  {
    id: 'q1', text: { ar: 'ما هو كوكب closest إلى الشمس؟', en: 'Which planet is closest to the Sun?' },
    categoryId: 'cat1', ageGroupId: 'ag3', difficultyId: 'df1',
    correctAnswer: 'زحل', options: [
      { id: 'q1o1', text: { ar: 'أرض', en: 'Earth' }, isCorrect: false, order: 1 },
      { id: 'q1o2', text: { ar: 'زحل', en: 'Saturn' }, isCorrect: false, order: 2 },
      { id: 'q1o3', text: { ar: 'مركور', en: 'Mercury' }, isCorrect: true, order: 3 },
      { id: 'q1o4', text: { ar: 'المريخ', en: 'Mars' }, isCorrect: false, order: 4 },
    ],
    explanation: { ar: 'مركور أقرب كواكب المجموعة الشمسية إلى الشمس.', en: 'Mercury is the closest planet to the Sun.' },
    source: 'local', status: 'approved', isAiGenerated: false, createdBy: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];
export const MESSAGES = {
  ar: {
    welcome: 'مرحباً بك في منصة المسابقات',
    login: 'تسجيل الدخول', register: 'إنشاء حساب', logout: 'تسجيل الخروج',
    success: 'تم بنجاح', error: 'حدث خطأ', required: 'هذا الحقل مطلوب',
    userExists: 'اسم المستخدم مستخدم مسبقاً', invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    sessionRestored: 'تم استعادة الجلسة', dataSaved: 'تم حفظ البيانات',
    quizStarted: 'بدأت المسابقة', quizCompleted: 'انتهت المسابقة',
    pointsEarned: 'نقاط تم كسبها', xpEarned: 'خبرة تم كسبها',
    levelUp: 'ارتقى المستوى!', noData: 'لا توجد بيانات', confirmDelete: 'هل أنت متأكد من الحذف؟',
    importSuccess: 'تم الاستيراد بنجاح', importInvalid: 'ملف غير صالح', exportSuccess: 'تم التصدير بنجاح',
    adminOnly: 'هذا القسم مخصص للمدير فقط', questionApproved: 'تم اعتماد السؤال', questionRejected: 'تم رفض السؤال',
    categories: 'التصنيفات', start_quiz: 'ابدأ مسابقة', difficulty: 'الصعوبة', count: 'عدد الأسئلة',
    start: 'بدء', question: 'سؤال', correct: 'صحيح', wrong: 'خطأ', next: 'التالي', finish: 'إنهاء',
    result: 'النتيجة', points_earned: 'نقاط', xp_earned: 'خبرة', back: 'العودة', welcome_sub: 'اختبر معلوماتك وتحدى نفسك',
  },
  en: {
    welcome: 'Welcome to Interactive Quiz Platform',
    login: 'Login', register: 'Create Account', logout: 'Logout',
    success: 'Success', error: 'An error occurred', required: 'This field is required',
    userExists: 'Username already exists', invalidCredentials: 'Invalid username or password',
    sessionRestored: 'Session restored', dataSaved: 'Data saved',
    quizStarted: 'Quiz started', quizCompleted: 'Quiz completed',
    pointsEarned: 'Points earned', xpEarned: 'XP earned',
    levelUp: 'Level up!', noData: 'No data', confirmDelete: 'Are you sure to delete?',
    importSuccess: 'Import successful', importInvalid: 'Invalid file', exportSuccess: 'Export successful',
    adminOnly: 'Admin section only', questionApproved: 'Question approved', questionRejected: 'Question rejected',
    categories: 'Categories', start_quiz: 'Start Quiz', difficulty: 'Difficulty', count: 'Number of questions',
    start: 'Start', question: 'Question', correct: 'Correct', wrong: 'Wrong', next: 'Next', finish: 'Finish',
    result: 'Result', points_earned: 'Points earned', xp_earned: 'XP earned', back: 'Back', welcome_sub: 'Test your knowledge and challenge yourself',
  },
};
export const LANG = { AR: 'ar', EN: 'en' };
