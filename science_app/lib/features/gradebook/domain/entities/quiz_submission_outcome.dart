import 'package:equatable/equatable.dart';

/// نتيجة إرسال درجة الاختبار إلى سجل المعلّمة.
class QuizSubmissionOutcome extends Equatable {
  const QuizSubmissionOutcome({
    required this.savedScore,
    required this.maxScore,
    required this.alreadySubmitted,
  });

  /// الدرجة المحفوظة في السجل.
  final double savedScore;
  final int maxScore;

  /// true إذا كان الطالب قد حلّ الاختبار سابقاً، فبقيت درجته الأولى.
  final bool alreadySubmitted;

  @override
  List<Object?> get props => [savedScore, maxScore, alreadySubmitted];
}
