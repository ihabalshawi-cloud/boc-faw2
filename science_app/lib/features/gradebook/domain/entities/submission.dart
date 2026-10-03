import 'package:equatable/equatable.dart';

import '../../../../core/constants/app_strings.dart';

enum SubmissionStatus {
  pending(AppStrings.statusPending),
  submitted(AppStrings.statusSubmitted),
  late(AppStrings.statusLate),
  graded(AppStrings.statusGraded);

  const SubmissionStatus(this.arabicLabel);

  final String arabicLabel;
}

/// تسليم طالب لواجب معيّن.
class Submission extends Equatable {
  const Submission({
    required this.id,
    required this.assignmentId,
    required this.studentId,
    required this.classId,
    required this.maxScore,
    this.status = SubmissionStatus.pending,
    this.quizAnswers = const {},
    this.textAnswer,
    this.attachmentUrls = const [],
    this.score,
    this.teacherFeedback,
    this.submittedAt,
    this.gradedAt,
    this.gradedBy,
  });

  final String id;
  final String assignmentId;
  final String studentId;
  final String classId;
  final SubmissionStatus status;

  /// إجابات الاختبار: معرّف السؤال ← رقم الخيار الذي اختاره الطالب.
  final Map<String, int> quizAnswers;

  /// إجابة نصية للواجبات المفتوحة.
  final String? textAnswer;

  /// روابط ملفات أو صور مرفوعة (مثل صورة تجربة علمية).
  final List<String> attachmentUrls;

  /// الدرجة. تبقى null حتى يتم التصحيح.
  final double? score;
  final int maxScore;
  final String? teacherFeedback;
  final DateTime? submittedAt;
  final DateTime? gradedAt;

  /// معرّف المعلّم الذي صحّح (أو "auto" للتصحيح الآلي للاختبارات).
  final String? gradedBy;

  bool get isGraded => status == SubmissionStatus.graded && score != null;

  /// النسبة المئوية من 0 إلى 100، أو null إذا لم يُصحَّح بعد.
  double? get percentage =>
      (score == null || maxScore == 0) ? null : (score! / maxScore) * 100;

  @override
  List<Object?> get props => [
    id,
    assignmentId,
    studentId,
    classId,
    status,
    quizAnswers,
    textAnswer,
    attachmentUrls,
    score,
    maxScore,
    teacherFeedback,
    submittedAt,
    gradedAt,
    gradedBy,
  ];
}
