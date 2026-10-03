import 'package:equatable/equatable.dart';

import 'quiz_question.dart';

/// درس علوم يحتوي على فيديو وقائمة أسئلة.
class Lesson extends Equatable {
  const Lesson({
    required this.id,
    required this.title,
    required this.videoUrl,
    required this.createdAt,
    this.quizList = const [],
    this.description = '',
    this.unitTitle = '',
    this.order = 0,
    this.thumbnailUrl,
    this.durationMinutes = 0,
    this.isPublished = false,
    this.createdBy,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String videoUrl;
  final List<QuizQuestion> quizList;

  final String description;

  /// عنوان الوحدة، مثل: "الوحدة الأولى: الكائنات الحية".
  final String unitTitle;

  /// ترتيب الدرس داخل الوحدة.
  final int order;
  final String? thumbnailUrl;
  final int durationMinutes;
  final bool isPublished;

  /// معرّف المعلّم الذي أنشأ الدرس.
  final String? createdBy;
  final DateTime createdAt;
  final DateTime? updatedAt;

  /// مجموع نقاط جميع أسئلة الدرس.
  int get totalPoints => quizList.fold(0, (sum, q) => sum + q.points);

  bool get hasQuiz => quizList.isNotEmpty;

  @override
  List<Object?> get props => [
        id,
        title,
        videoUrl,
        quizList,
        description,
        unitTitle,
        order,
        thumbnailUrl,
        durationMinutes,
        isPublished,
        createdBy,
        createdAt,
        updatedAt,
      ];
}
