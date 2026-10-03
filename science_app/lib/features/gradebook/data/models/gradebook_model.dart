import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/gradebook.dart';

class GradeEntryModel extends GradeEntry {
  const GradeEntryModel({
    required super.assignmentId,
    required super.assignmentTitle,
    required super.score,
    required super.maxScore,
    required super.gradedAt,
    super.submissionId,
  });

  factory GradeEntryModel.fromJson(Map<String, dynamic> json) =>
      GradeEntryModel(
        assignmentId: JsonUtils.requireString(json, 'assignmentId'),
        assignmentTitle: json['assignmentTitle'] as String? ?? '',
        submissionId: json['submissionId'] as String?,
        score: JsonUtils.readDouble(json, 'score'),
        maxScore: JsonUtils.readInt(json, 'maxScore', fallback: 100),
        gradedAt: JsonUtils.parseDate(json['gradedAt']) ?? DateTime.now(),
      );

  factory GradeEntryModel.fromEntity(GradeEntry e) => GradeEntryModel(
    assignmentId: e.assignmentId,
    assignmentTitle: e.assignmentTitle,
    submissionId: e.submissionId,
    score: e.score,
    maxScore: e.maxScore,
    gradedAt: e.gradedAt,
  );

  Map<String, dynamic> toJson() => {
    'assignmentId': assignmentId,
    'assignmentTitle': assignmentTitle,
    'submissionId': submissionId,
    'score': score,
    'maxScore': maxScore,
    'gradedAt': gradedAt,
  };
}

/// شكل المستند في `gradebooks/{studentId}`.
/// المجاميع تُحفظ أيضاً لتسهيل الترتيب والاستعلام في لوحة المعلّم.
class GradebookModel extends Gradebook {
  const GradebookModel({
    required super.studentId,
    required super.classId,
    super.studentName,
    super.entries,
    super.updatedAt,
  });

  factory GradebookModel.fromJson(Map<String, dynamic> json, {String? id}) =>
      GradebookModel(
        studentId: id ?? JsonUtils.requireString(json, 'studentId'),
        studentName: json['studentName'] as String? ?? '',
        classId: JsonUtils.requireString(json, 'classId'),
        entries: JsonUtils.readMapList(
          json,
          'entries',
        ).map(GradeEntryModel.fromJson).toList(growable: false),
        updatedAt: JsonUtils.parseDate(json['updatedAt']),
      );

  factory GradebookModel.fromEntity(Gradebook g) => GradebookModel(
    studentId: g.studentId,
    studentName: g.studentName,
    classId: g.classId,
    entries: g.entries,
    updatedAt: g.updatedAt,
  );

  Map<String, dynamic> toJson() => {
    'studentId': studentId,
    'studentName': studentName,
    'classId': classId,
    'entries': entries
        .map((e) => GradeEntryModel.fromEntity(e).toJson())
        .toList(),
    'totalScore': totalScore,
    'totalMaxScore': totalMaxScore,
    'percentage': percentage,
    'gradeLevel': gradeLevel.name,
    'updatedAt': updatedAt,
  };
}
