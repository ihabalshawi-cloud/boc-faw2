import 'package:equatable/equatable.dart';

/// نوع السؤال.
enum QuestionType {
  /// اختيار من متعدد (خياران أو أكثر).
  multipleChoice,

  /// صح أو خطأ. الخيار 0 = صح، والخيار 1 = خطأ.
  trueFalse,
}

/// سؤال داخل اختبار الدرس.
class QuizQuestion extends Equatable {
  const QuizQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
    this.type = QuestionType.multipleChoice,
    this.points = 10,
    this.imageUrl,
    this.explanation,
  });

  /// موقع خيار "صح" في أسئلة صح أو خطأ.
  static const trueIndex = 0;

  /// موقع خيار "خطأ" في أسئلة صح أو خطأ.
  static const falseIndex = 1;

  final String id;
  final String questionText;
  final QuestionType type;
  final List<String> options;

  /// موقع الإجابة الصحيحة داخل [options] (يبدأ من الصفر).
  final int correctAnswerIndex;
  final int points;

  /// صورة توضيحية اختيارية للسؤال.
  final String? imageUrl;

  /// شرح يظهر للطالب بعد الإجابة.
  final String? explanation;

  bool get isTrueFalse => type == QuestionType.trueFalse;

  bool isCorrect(int selectedIndex) => selectedIndex == correctAnswerIndex;

  String get correctAnswer => options[correctAnswerIndex];

  @override
  List<Object?> get props => [
        id,
        questionText,
        type,
        options,
        correctAnswerIndex,
        points,
        imageUrl,
        explanation,
      ];
}
