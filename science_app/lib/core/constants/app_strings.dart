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
