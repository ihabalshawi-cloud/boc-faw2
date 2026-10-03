import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// الحالة المرئية لزر الإجابة.
enum AnswerVisualState {
  /// قبل الإجابة: الزر قابل للضغط.
  idle,

  /// هذه هي الإجابة الصحيحة (تقفز فرحاً).
  correct,

  /// اختارها الطالب وهي خاطئة (تهتز).
  wrong,

  /// خيار آخر لم يُختر (يبهت).
  dimmed,
}

/// غلاف مشترك لأزرار الإجابة يضيف المؤثرات البصرية:
/// انكماش عند الضغط، قفزة للإجابة الصحيحة، اهتزاز للخاطئة، وبهتان للبقية.
class AnswerFeedbackAnimator extends StatefulWidget {
  const AnswerFeedbackAnimator({
    super.key,
    required this.state,
    required this.child,
    this.onTap,
  });

  final AnswerVisualState state;
  final Widget child;

  /// يُتجاهل الضغط تلقائياً إذا لم تكن الحالة [AnswerVisualState.idle].
  final VoidCallback? onTap;

  @override
  State<AnswerFeedbackAnimator> createState() => _AnswerFeedbackAnimatorState();
}

class _AnswerFeedbackAnimatorState extends State<AnswerFeedbackAnimator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _reveal = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  );
  bool _pressed = false;

  bool get _enabled =>
      widget.state == AnswerVisualState.idle && widget.onTap != null;

  @override
  void didUpdateWidget(covariant AnswerFeedbackAnimator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state == widget.state) return;
    if (widget.state == AnswerVisualState.correct ||
        widget.state == AnswerVisualState.wrong) {
      _reveal.forward(from: 0);
    } else if (widget.state == AnswerVisualState.idle) {
      _reveal.reset();
      _pressed = false;
    }
  }

  @override
  void dispose() {
    _reveal.dispose();
    super.dispose();
  }

  void _setPressed(bool value) {
    if (!_enabled || _pressed == value) return;
    setState(() => _pressed = value);
  }

  void _handleTap() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
    widget.onTap!();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: _handleTap,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 300),
        opacity: widget.state == AnswerVisualState.dimmed ? 0.45 : 1,
        child: AnimatedScale(
          duration: const Duration(milliseconds: 120),
          scale: _pressed ? 0.92 : 1,
          child: AnimatedBuilder(
            animation: _reveal,
            child: widget.child,
            builder: (context, child) {
              final t = _reveal.value;
              return switch (widget.state) {
                AnswerVisualState.correct => Transform.scale(
                    // قفزة مرنة: تكبر ثم تعود لحجمها.
                    scale: 1 + 0.12 * math.sin(math.pi * t),
                    child: child,
                  ),
                AnswerVisualState.wrong => Transform.translate(
                    // اهتزاز يخفت تدريجياً.
                    offset: Offset(math.sin(t * math.pi * 6) * 12 * (1 - t), 0),
                    child: child,
                  ),
                _ => child!,
              };
            },
          ),
        ),
      ),
    );
  }
}
