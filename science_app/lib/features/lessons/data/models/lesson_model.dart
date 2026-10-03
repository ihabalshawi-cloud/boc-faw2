import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/lesson.dart';
import 'quiz_question_model.dart';

/// شكل المستند في `lessons/{lessonId}`. الأسئلة مخزّنة داخل المستند نفسه
/// في الحقل `quizList` لأن عددها صغير، فيُقرأ الدرس كاملاً بطلب واحد.
class LessonModel extends Lesson {
  const LessonModel({
    required super.id,
    required super.title,
    required super.videoUrl,
    required super.createdAt,
    super.quizList,
    super.description,
    super.unitTitle,
    super.order,
    super.thumbnailUrl,
    super.durationMinutes,
    super.isPublished,
    super.createdBy,
    super.updatedAt,
  });

  factory LessonModel.fromJson(Map<String, dynamic> json, {String? id}) {
    final videoUrl = JsonUtils.requireString(json, 'videoUrl');
    final uri = Uri.tryParse(videoUrl);
    if (uri == null || !uri.hasScheme || !uri.scheme.startsWith('http')) {
      throw DataParsingException('رابط الفيديو غير صالح: $videoUrl');
    }

    return LessonModel(
      id: id ?? JsonUtils.requireString(json, 'id'),
      title: JsonUtils.requireString(json, 'title'),
      videoUrl: videoUrl,
      quizList: JsonUtils.readMapList(
        json,
        'quizList',
      ).map(QuizQuestionModel.fromJson).toList(growable: false),
      description: json['description'] as String? ?? '',
      unitTitle: json['unitTitle'] as String? ?? '',
      order: JsonUtils.readInt(json, 'order'),
      thumbnailUrl: json['thumbnailUrl'] as String?,
      durationMinutes: JsonUtils.readInt(json, 'durationMinutes'),
      isPublished: json['isPublished'] as bool? ?? false,
      createdBy: json['createdBy'] as String?,
      createdAt: JsonUtils.parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: JsonUtils.parseDate(json['updatedAt']),
    );
  }

  factory LessonModel.fromEntity(Lesson l) => LessonModel(
    id: l.id,
    title: l.title,
    videoUrl: l.videoUrl,
    quizList: l.quizList,
    description: l.description,
    unitTitle: l.unitTitle,
    order: l.order,
    thumbnailUrl: l.thumbnailUrl,
    durationMinutes: l.durationMinutes,
    isPublished: l.isPublished,
    createdBy: l.createdBy,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  );

  Map<String, dynamic> toJson() => {
    'title': title,
    'videoUrl': videoUrl,
    'quizList': quizList
        .map((q) => QuizQuestionModel.fromEntity(q).toJson())
        .toList(),
    'description': description,
    'unitTitle': unitTitle,
    'order': order,
    'thumbnailUrl': thumbnailUrl,
    'durationMinutes': durationMinutes,
    'isPublished': isPublished,
    'createdBy': createdBy,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
    'totalPoints': totalPoints,
  };
}
