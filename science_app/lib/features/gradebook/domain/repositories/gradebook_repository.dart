import '../../../auth/domain/entities/app_user.dart';
import '../../../lessons/domain/entities/quiz_result.dart';
import '../entities/assignment.dart';
import '../entities/quiz_submission_outcome.dart';

/// عقد سجل الدرجات في طبقة المجال.
abstract interface class GradebookRepository {
  /// يرسل نتيجة اختبار مصحَّح آلياً إلى سجل المعلّمة.
  Future<QuizSubmissionOutcome> submitQuizResult({
    required Student student,
    required Assignment assignment,
    required QuizResult result,
  });
}
