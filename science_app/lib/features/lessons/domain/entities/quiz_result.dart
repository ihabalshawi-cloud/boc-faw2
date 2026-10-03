import 'package:equatable/equatable.dart';

/// نتيجة محاولة الطالب في اختبار درس.
class QuizResult extends Equatable {
  const QuizResult({
    required this.lessonId,
    required this.answers,
    required this.pointsEarned,
    required this.totalPoints,
    required this.correctCount,
    required this.totalQuestions,
    required this.bestStreak,
  });

  final String lessonId;

  /// معرّف السؤال ← رقم الخيار الذي اختاره الطالب.
  final Map<String, int> answers;
  final int pointsEarned;
  final int totalPoints;
  final int correctCount;
  final int totalQuestions;

  /// أطول سلسلة إجابات صحيحة متتالية.
  final int bestStreak;

  /// النسبة المئوية من 0 إلى 100.
  double get percentage =>
      totalPoints == 0 ? 0 : (pointsEarned / totalPoints) * 100;

  /// عدد النجوم (0 إلى 3) لعرضها للطفل.
  int get stars => switch (percentage) {
        >= 90 => 3,
        >= 70 => 2,
        >= 50 => 1,
        _ => 0,
      };

  /// تحويل النقاط إلى درجة الواجب. تُقرّب لعدد صحيح حتى تبقى
  /// مجاميع سجل الدرجات دقيقة عند التحقق منها في قواعد Firestore.
  int scaledScore(int maxScore) {
    if (totalPoints == 0 || maxScore <= 0) return 0;
    return ((pointsEarned / totalPoints) * maxScore).round().clamp(0, maxScore);
  }

  @override
  List<Object?> get props => [
        lessonId,
        answers,
        pointsEarned,
        totalPoints,
        correctCount,
        totalQuestions,
        bestStreak,
      ];
}
