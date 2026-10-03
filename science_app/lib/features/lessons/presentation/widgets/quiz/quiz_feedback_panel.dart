import 'package:flutter/material.dart';

import '../../../../../core/constants/app_strings.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../domain/entities/quiz_question.dart';

/// اللوحة السفلية بعد الإجابة: صح أم خطأ، الإجابة الصحيحة، الشرح، وزر التالي.
class QuizFeedbackPanel extends StatelessWidget {
  const QuizFeedbackPanel({
    super.key,
    required this.question,
    required this.correct,
    required this.encouragement,
    required this.isLast,
    required this.onNext,
  });

  final QuizQuestion question;
  final bool correct;
  final String encouragement;
  final bool isLast;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final color = correct ? AppColors.correct : AppColors.fun;
    final explanation = question.explanation;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(top: BorderSide(color: color, width: 4)),
      ),
      // الحد الأقصى نصف الشاشة تقريباً: الشرح الطويل يُمرَّر،
      // وزر "التالي" يبقى ظاهراً دائماً على الهواتف الصغيرة.
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.45,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    correct ? AppStrings.correctAnswer : encouragement,
                    key: const ValueKey('feedback-message'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Color.lerp(color, Colors.black, 0.25),
                    ),
                  ),
                  if (!correct) ...[
                    const SizedBox(height: 6),
                    Text(
                      '${AppStrings.theCorrectAnswerIs} ${question.correctAnswer}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                  if (explanation != null && explanation.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Text(
                        '💡 ${AppStrings.didYouKnow} $explanation',
                        style: const TextStyle(
                            fontSize: 16, color: AppColors.textDark),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            key: const ValueKey('next-button'),
            onPressed: onNext,
            icon: Icon(
              isLast ? Icons.emoji_events_rounded : Icons.arrow_back_rounded,
            ),
            label:
                Text(isLast ? AppStrings.showResult : AppStrings.nextQuestion),
          ),
        ],
      ),
    );
  }
}
