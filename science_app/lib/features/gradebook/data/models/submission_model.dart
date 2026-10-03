import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/submission.dart';

/// شكل المستند في `submissions/{assignmentId}_{studentId}`.
/// المعرّف المركّب يمنع الطالب من إنشاء أكثر من تسليم للواجب نفسه.
class SubmissionModel extends Submission {
  const SubmissionModel({
    required super.id,
    required super.assignmentId,
    required super.studentId,
    required super.classId,
    required super.maxScore,
    super.status,
    super.quizAnswers,
    super.textAnswer,
    super.attachmentUrls,
    super.score,
    super.teacherFeedback,
    super.submittedAt,
    super.gradedAt,
    super.gradedBy,
  });

  static String buildId(String assignmentId, String studentId) =>
      '${assignmentId}_$studentId';

  factory SubmissionModel.fromJson(Map<String, dynamic> json, {String? id}) {
    final maxScore = JsonUtils.readInt(json, 'maxScore', fallback: 100);
    final rawScore = json['score'];
    final score = rawScore is num ? rawScore.toDouble() : null;
    if (score != null && (score < 0 || score > maxScore)) {
      throw DataParsingException(
        'الدرجة $score خارج النطاق المسموح (0 - $maxScore)',
      );
    }

    final rawAnswers = json['quizAnswers'];
    final answers = <String, int>{
      if (rawAnswers is Map)
        for (final e in rawAnswers.entries)
          if (e.value is num) e.key.toString(): (e.value as num).toInt(),
    };

    return SubmissionModel(
      id: id ?? JsonUtils.requireString(json, 'id'),
      assignmentId: JsonUtils.requireString(json, 'assignmentId'),
      studentId: JsonUtils.requireString(json, 'studentId'),
      classId: JsonUtils.requireString(json, 'classId'),
      status: JsonUtils.readEnum(
        json,
        'status',
        SubmissionStatus.values,
        SubmissionStatus.pending,
      ),
      quizAnswers: answers,
      textAnswer: json['textAnswer'] as String?,
      attachmentUrls: JsonUtils.readStringList(json, 'attachmentUrls'),
      score: score,
      maxScore: maxScore,
      teacherFeedback: json['teacherFeedback'] as String?,
      submittedAt: JsonUtils.parseDate(json['submittedAt']),
      gradedAt: JsonUtils.parseDate(json['gradedAt']),
      gradedBy: json['gradedBy'] as String?,
    );
  }

  factory SubmissionModel.fromEntity(Submission s) => SubmissionModel(
    id: s.id,
    assignmentId: s.assignmentId,
    studentId: s.studentId,
    classId: s.classId,
    status: s.status,
    quizAnswers: s.quizAnswers,
    textAnswer: s.textAnswer,
    attachmentUrls: s.attachmentUrls,
    score: s.score,
    maxScore: s.maxScore,
    teacherFeedback: s.teacherFeedback,
    submittedAt: s.submittedAt,
    gradedAt: s.gradedAt,
    gradedBy: s.gradedBy,
  );

  Map<String, dynamic> toJson() => {
    'assignmentId': assignmentId,
    'studentId': studentId,
    'classId': classId,
    'status': status.name,
    'quizAnswers': quizAnswers,
    'textAnswer': textAnswer,
    'attachmentUrls': attachmentUrls,
    'score': score,
    'maxScore': maxScore,
    'teacherFeedback': teacherFeedback,
    'submittedAt': submittedAt,
    'gradedAt': gradedAt,
    'gradedBy': gradedBy,
  };
}
