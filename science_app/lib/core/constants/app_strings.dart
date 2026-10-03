/// جميع نصوص الواجهة باللغة العربية.
abstract final class AppStrings {
  // عام
  static const appName = 'عالم العلوم';
  static const appSubtitle = 'العلوم للصف الخامس الابتدائي';
  static const loading = 'جارِ التحميل...';
  static const retry = 'إعادة المحاولة';
  static const save = 'حفظ';
  static const cancel = 'إلغاء';
  static const next = 'التالي';
  static const back = 'رجوع';
  static const done = 'تم';

  // الأدوار
  static const student = 'طالب';
  static const teacher = 'معلّم';
  static const parent = 'وليّ أمر';
  static const chooseRole = 'من أنت؟';

  // تسجيل الدخول
  static const login = 'تسجيل الدخول';
  static const logout = 'تسجيل الخروج';
  static const register = 'إنشاء حساب جديد';
  static const email = 'البريد الإلكتروني';
  static const password = 'كلمة المرور';
  static const fullName = 'الاسم الكامل';
  static const forgotPassword = 'نسيت كلمة المرور؟';
  static const resetPasswordSent =
      'أرسلنا رابط استعادة كلمة المرور إلى بريدك الإلكتروني';

  // الدروس والاختبارات
  static const lessons = 'الدروس';
  static const watchVideo = 'شاهد الفيديو';
  static const startQuiz = 'ابدأ الاختبار';
  static const question = 'السؤال';
  static const points = 'نقاط';
  static const correctAnswer = 'إجابة صحيحة! أحسنت 🎉';
  static const wrongAnswer = 'حاول مرة أخرى 💪';
  static const quizFinished = 'انتهى الاختبار';

  // شاشة الاختبار التفاعلي
  static const trueLabel = 'صح';
  static const falseLabel = 'خطأ';
  static const questionOf = 'السؤال';
  static const of = 'من';
  static const myPoints = 'نقاطي';
  static const nextQuestion = 'السؤال التالي';
  static const chooseCorrectAnswer = 'اختر الإجابة الصحيحة';
  static const trueOrFalse = 'صح أم خطأ؟';
  static const showResult = 'اعرض النتيجة';
  static const theCorrectAnswerIs = 'الإجابة الصحيحة هي:';
  static const didYouKnow = 'هل تعلم؟';
  static const streakBonus = 'سلسلة نارية! 🔥';
  static const pointsSuffix = 'نقطة';
  static const noQuestions = 'لا توجد أسئلة في هذا الدرس بعد';
  static const exitQuizTitle = 'هل تريد الخروج؟';
  static const exitQuizBody = 'إذا خرجت الآن ستضيع إجاباتك في هذا الاختبار.';
  static const stay = 'أكمل الاختبار';
  static const exit = 'خروج';

  /// عبارات التشجيع عند الإجابة الصحيحة.
  static const praises = [
    'بطل العلوم! 🎉',
    'عالِم صغير رائع! 🔬',
    'إجابة مذهلة! ⭐',
    'أحسنت يا بطل! 🚀',
    'عبقري! 🧠',
    'رائع جداً! 🌟',
  ];

  /// عبارات لطيفة عند الإجابة الخاطئة.
  static const encouragements = [
    'لا بأس، نتعلم من أخطائنا 💪',
    'قريب جداً! ركّز في السؤال القادم 🌈',
    'المحاولة شجاعة! هيا نكمل 🦸',
  ];

  // شاشة النتيجة
  static const resultPerfect = 'رائع! أنت بطل العلوم 🏆';
  static const resultGreat = 'عمل ممتاز! ⭐';
  static const resultGood = 'جيد! استمر بالتعلم 💪';
  static const resultTryAgain = 'لا بأس، لنحاول مرة أخرى 🌱';
  static const pointsEarned = 'النقاط المكتسبة';
  static const correctAnswers = 'الإجابات الصحيحة';
  static const bestStreak = 'أطول سلسلة صحيحة';
  static const percentage = 'النسبة';
  static const playAgain = 'العب مرة أخرى';
  static const backToLessons = 'العودة إلى الدروس';
  static const savingScore = 'جارِ إرسال درجتك إلى المعلّمة...';
  static const scoreSaved = 'تم حفظ درجتك في سجل المعلّمة ✅';
  static const scoreAlreadySaved =
      'حللت هذا الاختبار من قبل، والدرجة المحفوظة هي محاولتك الأولى';
  static const practiceMode = 'اختبار تدريبي، الدرجة لا تُرسل إلى السجل';
  static const scoreSaveFailed = 'لم نتمكن من حفظ درجتك';

  // الواجبات والدرجات
  static const assignments = 'الواجبات';
  static const gradebook = 'سجل الدرجات';
  static const dueDate = 'آخر موعد للتسليم';
  static const submit = 'تسليم';
  static const score = 'الدرجة';
  static const feedback = 'ملاحظات المعلّم';

  // حالات التسليم
  static const statusPending = 'لم يُسلَّم بعد';
  static const statusSubmitted = 'تم التسليم';
  static const statusLate = 'تسليم متأخر';
  static const statusGraded = 'تم التصحيح';

  // التقديرات
  static const gradeExcellent = 'ممتاز';
  static const gradeVeryGood = 'جيد جداً';
  static const gradeGood = 'جيد';
  static const gradeAcceptable = 'مقبول';
  static const gradeNeedsWork = 'يحتاج إلى تحسين';

  // الأخطاء
  static const errorGeneric = 'حدث خطأ غير متوقع، حاول مرة أخرى';
  static const errorNetwork = 'تحقق من اتصالك بالإنترنت';
  static const errorPermission = 'ليست لديك صلاحية للقيام بهذا الإجراء';
  static const errorNotFound = 'البيانات المطلوبة غير موجودة';

  // الإشعارات
  static const notificationsChannel = 'إشعارات عالم العلوم';
  static const newLessonNotification = 'درس جديد بانتظارك!';
  static const newAssignmentNotification = 'لديك واجب جديد';
  static const gradePublishedNotification = 'تم نشر درجتك';
}
