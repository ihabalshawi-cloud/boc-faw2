import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/quiz_question.dart';

class QuizQuestionModel extends QuizQuestion {
  const QuizQuestionModel({
    required super.id,
    required super.questionText,
    required super.options,
    required super.correctAnswerIndex,
    super.points,
    super.imageUrl,
    super.explanation,
  });

  /// يتحقق من صحة السؤال قبل إنشائه: خياران على الأقل،
  /// وموقع الإجابة الصحيحة ضمن الخيارات، ونقاط غير سالبة.
  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    final options = JsonUtils.readStringList(json, 'options');
    final correctIndex = JsonUtils.readInt(
      json,
      'correctAnswerIndex',
      fallback: -1,
    );
    final points = JsonUtils.readInt(json, 'points', fallback: 10);

    if (options.length < 2) {
      throw const DataParsingException(
        'يجب أن يحتوي السؤال على خيارين على الأقل',
      );
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      throw const DataParsingException(
        'موقع الإجابة الصحيحة خارج نطاق الخيارات',
      );
    }
    if (points < 0) {
      throw const DataParsingException('نقاط السؤال لا يمكن أن تكون سالبة');
    }

    return QuizQuestionModel(
      id: JsonUtils.requireString(json, 'id'),
      questionText: JsonUtils.requireString(json, 'questionText'),
      options: options,
      correctAnswerIndex: correctIndex,
      points: points,
      imageUrl: json['imageUrl'] as String?,
      explanation: json['explanation'] as String?,
    );
  }

  factory QuizQuestionModel.fromEntity(QuizQuestion q) => QuizQuestionModel(
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    points: q.points,
    imageUrl: q.imageUrl,
    explanation: q.explanation,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'questionText': questionText,
    'options': options,
    'correctAnswerIndex': correctAnswerIndex,
    'points': points,
    'imageUrl': imageUrl,
    'explanation': explanation,
  };
}
