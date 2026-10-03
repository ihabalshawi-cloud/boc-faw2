import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/assignment.dart';

/// شكل المستند في `assignments/{assignmentId}`.
class AssignmentModel extends Assignment {
  const AssignmentModel({
    required super.id,
    required super.title,
    required super.classId,
    required super.teacherId,
    required super.dueDate,
    required super.createdAt,
    super.type,
    super.description,
    super.lessonId,
    super.maxScore,
    super.isPublished,
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json, {String? id}) {
    final dueDate = JsonUtils.parseDate(json['dueDate']);
    if (dueDate == null) {
      throw const DataParsingException('موعد تسليم الواجب مفقود');
    }
    final maxScore = JsonUtils.readInt(json, 'maxScore', fallback: 100);
    if (maxScore <= 0) {
      throw const DataParsingException('الدرجة القصوى يجب أن تكون أكبر من صفر');
    }

    return AssignmentModel(
      id: id ?? JsonUtils.requireString(json, 'id'),
      title: JsonUtils.requireString(json, 'title'),
      description: json['description'] as String? ?? '',
      type: JsonUtils.readEnum(
        json,
        'type',
        AssignmentType.values,
        AssignmentType.homework,
      ),
      classId: JsonUtils.requireString(json, 'classId'),
      teacherId: JsonUtils.requireString(json, 'teacherId'),
      lessonId: json['lessonId'] as String?,
      maxScore: maxScore,
      dueDate: dueDate,
      createdAt: JsonUtils.parseDate(json['createdAt']) ?? DateTime.now(),
      isPublished: json['isPublished'] as bool? ?? false,
    );
  }

  factory AssignmentModel.fromEntity(Assignment a) => AssignmentModel(
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        classId: a.classId,
        teacherId: a.teacherId,
        lessonId: a.lessonId,
        maxScore: a.maxScore,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        isPublished: a.isPublished,
      );

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'type': type.name,
        'classId': classId,
        'teacherId': teacherId,
        'lessonId': lessonId,
        'maxScore': maxScore,
        'dueDate': dueDate,
        'createdAt': createdAt,
        'isPublished': isPublished,
      };
}
