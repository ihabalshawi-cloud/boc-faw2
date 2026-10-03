import 'package:equatable/equatable.dart';

/// نوع الواجب.
enum AssignmentType {
  quiz('اختبار قصير'),
  homework('واجب منزلي'),
  project('مشروع'),
  experiment('تجربة علمية');

  const AssignmentType(this.arabicLabel);

  final String arabicLabel;
}

/// واجب يضعه المعلّم لشعبة معيّنة، وقد يرتبط بدرس.
class Assignment extends Equatable {
  const Assignment({
    required this.id,
    required this.title,
    required this.classId,
    required this.teacherId,
    required this.dueDate,
    required this.createdAt,
    this.type = AssignmentType.homework,
    this.description = '',
    this.lessonId,
    this.maxScore = 100,
    this.isPublished = false,
  });

  final String id;
  final String title;
  final String description;
  final AssignmentType type;
  final String classId;
  final String teacherId;

  /// الدرس المرتبط (اختياري). في الاختبارات القصيرة تُؤخذ الأسئلة منه.
  final String? lessonId;
  final int maxScore;
  final DateTime dueDate;
  final DateTime createdAt;
  final bool isPublished;

  bool isOverdue([DateTime? now]) => (now ?? DateTime.now()).isAfter(dueDate);

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        type,
        classId,
        teacherId,
        lessonId,
        maxScore,
        dueDate,
        createdAt,
        isPublished,
      ];
}
