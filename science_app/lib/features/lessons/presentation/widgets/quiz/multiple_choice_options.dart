import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import 'answer_feedback_animator.dart';

/// أزرار كبيرة ملوّنة لأسئلة الاختيار من متعدد.
class MultipleChoiceOptions extends StatelessWidget {
  const MultipleChoiceOptions({
    super.key,
    required this.options,
    required this.stateFor,
    required this.onSelected,
  });

  final List<String> options;

  /// يحدد الحالة المرئية لكل خيار حسب رقمه.
  final AnswerVisualState Function(int index) stateFor;
  final ValueChanged<int> onSelected;

  static const _letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

  static const _colors = [
    AppColors.accent,
    AppColors.fun,
    AppColors.purple,
    AppColors.secondary,
    AppColors.primary,
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < options.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: AnswerFeedbackAnimator(
              key: ValueKey('mc-option-$i'),
              state: stateFor(i),
              onTap: () => onSelected(i),
              child: _OptionTile(
                letter: i < _letters.length ? _letters[i] : '${i + 1}',
                text: options[i],
                baseColor: _colors[i % _colors.length],
                state: stateFor(i),
              ),
            ),
          ),
      ],
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.letter,
    required this.text,
    required this.baseColor,
    required this.state,
  });

  final String letter;
  final String text;
  final Color baseColor;
  final AnswerVisualState state;

  Color get _color => switch (state) {
        AnswerVisualState.correct => AppColors.correct,
        AnswerVisualState.wrong => AppColors.wrong,
        _ => baseColor,
      };

  IconData? get _trailingIcon => switch (state) {
        AnswerVisualState.correct => Icons.check_circle_rounded,
        AnswerVisualState.wrong => Icons.cancel_rounded,
        _ => null,
      };

  @override
  Widget build(BuildContext context) {
    final icon = _trailingIcon;
    return Semantics(
      button: true,
      label: '$letter: $text',
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        constraints: const BoxConstraints(minHeight: 76),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _color,
          borderRadius: BorderRadius.circular(26),
          // ظل سفلي سميك يعطي شكل الزر الكرتوني ثلاثي الأبعاد.
          boxShadow: [
            BoxShadow(
              color: Color.lerp(_color, Colors.black, 0.3)!,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.white,
              child: Text(
                letter,
                style: TextStyle(
                  color: _color,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),
            ),
            if (icon != null) Icon(icon, color: Colors.white, size: 34),
          ],
        ),
      ),
    );
  }
}
