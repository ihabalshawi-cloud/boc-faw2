import '../../../../core/constants/app_strings.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/quiz_question.dart';

class QuizQuestionModel extends QuizQuestion {
  const QuizQuestionModel({
    required super.id,
    required super.questionText,
    required super.options,
    required super.correctAnswerIndex,
    super.type,
    super.points,
    super.imageUrl,
    super.explanation,
  });

  /// خيارا أسئلة صح أو خطأ بالترتيب الثابت (0 = صح، 1 = خطأ).
  static const trueFalseOptions = [AppStrings.trueLabel, AppStrings.falseLabel];

  /// يتحقق من صحة السؤال قبل إنشائه: خياران على الأقل (وخياران بالضبط
  /// لأسئلة صح أو خطأ)، وموقع الإجابة الصحيحة ضمن الخيارات، ونقاط غير سالبة.
  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    final type = JsonUtils.readEnum(
      json,
      'type',
      QuestionType.values,
      QuestionType.multipleChoice,
    );
    final rawOptions = JsonUtils.readStringList(json, 'options');
    final options = type == QuestionType.trueFalse && rawOptions.isEmpty
        ? trueFalseOptions
        : rawOptions;
    final correctIndex = JsonUtils.readInt(
      json,
      'correctAnswerIndex',
      fallback: -1,
    );
    final points = JsonUtils.readInt(json, 'points', fallback: 10);

    if (type == QuestionType.trueFalse && options.length != 2) {
      throw const DataParsingException(
        'سؤال صح أو خطأ يجب أن يحتوي على خيارين فقط',
      );
    }
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
      type: type,
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
        type: q.type,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        points: q.points,
        imageUrl: q.imageUrl,
        explanation: q.explanation,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'questionText': questionText,
        'type': type.name,
        'options': options,
        'correctAnswerIndex': correctAnswerIndex,
        'points': points,
        'imageUrl': imageUrl,
        'explanation': explanation,
      };
}
