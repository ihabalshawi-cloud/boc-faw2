import 'package:equatable/equatable.dart';

/// سؤال اختيار من متعدد داخل الدرس.
class QuizQuestion extends Equatable {
  const QuizQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
    this.points = 10,
    this.imageUrl,
    this.explanation,
  });

  final String id;
  final String questionText;
  final List<String> options;

  /// موقع الإجابة الصحيحة داخل [options] (يبدأ من الصفر).
  final int correctAnswerIndex;
  final int points;

  /// صورة توضيحية اختيارية للسؤال.
  final String? imageUrl;

  /// شرح يظهر للطالب بعد الإجابة.
  final String? explanation;

  bool isCorrect(int selectedIndex) => selectedIndex == correctAnswerIndex;

  String get correctAnswer => options[correctAnswerIndex];

  @override
  List<Object?> get props => [
    id,
    questionText,
    options,
    correctAnswerIndex,
    points,
    imageUrl,
    explanation,
  ];
}
