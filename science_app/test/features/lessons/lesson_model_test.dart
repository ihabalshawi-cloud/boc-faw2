import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/core/errors/exceptions.dart';
import 'package:science_kids/features/lessons/data/models/lesson_model.dart';
import 'package:science_kids/features/lessons/data/models/quiz_question_model.dart';
import 'package:science_kids/features/lessons/domain/entities/quiz_question.dart';

void main() {
  final questionJson = {
    'id': 'q1',
    'questionText': 'ما العضو المسؤول عن ضخ الدم في جسم الإنسان؟',
    'options': ['الرئتان', 'القلب', 'المعدة'],
    'correctAnswerIndex': 1,
    'points': 10,
  };

  test('يحوّل الدرس مع أسئلته من وإلى JSON', () {
    final lesson = LessonModel.fromJson({
      'title': 'الجهاز الدوري',
      'videoUrl': 'https://example.com/heart.mp4',
      'quizList': [questionJson],
      'isPublished': true,
      'createdAt': DateTime(2026, 9, 1),
    }, id: 'l1');

    expect(lesson.quizList.single.correctAnswer, 'القلب');
    expect(lesson.quizList.single.isCorrect(1), isTrue);
    expect(lesson.totalPoints, 10);

    final restored = LessonModel.fromJson(lesson.toJson(), id: 'l1');
    expect(restored, lesson);
  });

  test('يرفض سؤالاً موقع إجابته خارج الخيارات', () {
    expect(
      () => QuizQuestionModel.fromJson({
        ...questionJson,
        'correctAnswerIndex': 5,
      }),
      throwsA(isA<DataParsingException>()),
    );
  });

  test('يرفض رابط فيديو غير صالح', () {
    expect(
      () => LessonModel.fromJson({
        'title': 'درس',
        'videoUrl': 'javascript:alert(1)',
      }, id: 'l2'),
      throwsA(isA<DataParsingException>()),
    );
  });

  test('سؤال صح أو خطأ: خيارات افتراضية وتحويل ذهاب وإياب', () {
    final q = QuizQuestionModel.fromJson({
      'id': 'q2',
      'type': 'trueFalse',
      'questionText': 'النباتات تصنع غذاءها بنفسها',
      'correctAnswerIndex': 0,
    });
    expect(q.isTrueFalse, isTrue);
    expect(q.options, ['صح', 'خطأ']);
    expect(q.correctAnswer, 'صح');
    expect(QuizQuestionModel.fromJson(q.toJson()), q);
  });

  test('يرفض سؤال صح أو خطأ بأكثر من خيارين', () {
    expect(
      () => QuizQuestionModel.fromJson({
        'id': 'q3',
        'type': 'trueFalse',
        'questionText': 'سؤال',
        'options': ['صح', 'خطأ', 'ربما'],
        'correctAnswerIndex': 0,
      }),
      throwsA(isA<DataParsingException>()),
    );
  });

  test('الأسئلة القديمة بدون نوع تُقرأ اختياراً من متعدد', () {
    final q = QuizQuestionModel.fromJson(questionJson);
    expect(q.type, QuestionType.multipleChoice);
  });
}
