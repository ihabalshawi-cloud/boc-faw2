import 'package:equatable/equatable.dart';

import '../../../../core/constants/app_strings.dart';

/// التقدير اللفظي حسب النسبة المئوية.
enum GradeLevel {
  excellent(AppStrings.gradeExcellent, 90),
  veryGood(AppStrings.gradeVeryGood, 80),
  good(AppStrings.gradeGood, 70),
  acceptable(AppStrings.gradeAcceptable, 50),
  needsWork(AppStrings.gradeNeedsWork, 0);

  const GradeLevel(this.arabicLabel, this.minPercentage);

  final String arabicLabel;
  final double minPercentage;

  static GradeLevel fromPercentage(double percentage) => values.firstWhere(
    (g) => percentage >= g.minPercentage,
    orElse: () => needsWork,
  );
}

/// درجة واحدة في سجل الطالب.
class GradeEntry extends Equatable {
  const GradeEntry({
    required this.assignmentId,
    required this.assignmentTitle,
    required this.score,
    required this.maxScore,
    required this.gradedAt,
    this.submissionId,
  });

  final String assignmentId;
  final String assignmentTitle;
  final String? submissionId;
  final double score;
  final int maxScore;
  final DateTime gradedAt;

  double get percentage => maxScore == 0 ? 0 : (score / maxScore) * 100;

  @override
  List<Object?> get props => [
    assignmentId,
    assignmentTitle,
    submissionId,
    score,
    maxScore,
    gradedAt,
  ];
}

/// سجل درجات الطالب في مادة العلوم. مستند واحد لكل طالب.
class Gradebook extends Equatable {
  const Gradebook({
    required this.studentId,
    required this.classId,
    this.studentName = '',
    this.entries = const [],
    this.updatedAt,
  });

  final String studentId;
  final String studentName;
  final String classId;
  final List<GradeEntry> entries;
  final DateTime? updatedAt;

  double get totalScore => entries.fold(0, (sum, e) => sum + e.score);

  int get totalMaxScore => entries.fold(0, (sum, e) => sum + e.maxScore);

  double get percentage =>
      totalMaxScore == 0 ? 0 : (totalScore / totalMaxScore) * 100;

  GradeLevel get gradeLevel => GradeLevel.fromPercentage(percentage);

  @override
  List<Object?> get props => [
    studentId,
    studentName,
    classId,
    entries,
    updatedAt,
  ];
}
