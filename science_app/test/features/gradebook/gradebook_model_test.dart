import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/core/errors/exceptions.dart';
import 'package:science_kids/features/gradebook/data/models/assignment_model.dart';
import 'package:science_kids/features/gradebook/data/models/gradebook_model.dart';
import 'package:science_kids/features/gradebook/data/models/submission_model.dart';
import 'package:science_kids/features/gradebook/domain/entities/assignment.dart';
import 'package:science_kids/features/gradebook/domain/entities/gradebook.dart';
import 'package:science_kids/features/gradebook/domain/entities/submission.dart';

void main() {
  test('الواجب: تحويل ذهاب وإياب', () {
    final a = AssignmentModel(
      id: 'a1',
      title: 'تجربة الطفو',
      classId: '5A',
      teacherId: 't1',
      type: AssignmentType.experiment,
      dueDate: DateTime(2026, 10, 10),
      createdAt: DateTime(2026, 10, 1),
    );
    expect(AssignmentModel.fromJson(a.toJson(), id: 'a1'), a);
    expect(a.type.arabicLabel, 'تجربة علمية');
  });

  test('التسليم: يقرأ الإجابات ويرفض درجة أكبر من القصوى', () {
    final s = SubmissionModel.fromJson({
      'assignmentId': 'a1',
      'studentId': 's1',
      'classId': '5A',
      'status': 'graded',
      'quizAnswers': {'q1': 1, 'q2': 0},
      'score': 8,
      'maxScore': 10,
    }, id: SubmissionModel.buildId('a1', 's1'));

    expect(s.id, 'a1_s1');
    expect(s.status, SubmissionStatus.graded);
    expect(s.quizAnswers, {'q1': 1, 'q2': 0});
    expect(s.percentage, 80);
    expect(SubmissionModel.fromJson(s.toJson(), id: s.id), s);

    expect(
      () => SubmissionModel.fromJson({
        'assignmentId': 'a1',
        'studentId': 's1',
        'classId': '5A',
        'score': 15,
        'maxScore': 10,
      }, id: 'x'),
      throwsA(isA<DataParsingException>()),
    );
  });

  test('سجل الدرجات: المجاميع والتقدير اللفظي', () {
    final g = GradebookModel(
      studentId: 's1',
      classId: '5A',
      entries: [
        GradeEntryModel(
          assignmentId: 'a1',
          assignmentTitle: 'الطفو',
          score: 9,
          maxScore: 10,
          gradedAt: DateTime(2026, 10, 11),
        ),
        GradeEntryModel(
          assignmentId: 'a2',
          assignmentTitle: 'النبات',
          score: 8,
          maxScore: 10,
          gradedAt: DateTime(2026, 10, 12),
        ),
      ],
    );

    expect(g.totalScore, 17);
    expect(g.percentage, 85);
    expect(g.gradeLevel, GradeLevel.veryGood);
    expect(g.gradeLevel.arabicLabel, 'جيد جداً');

    final json = g.toJson();
    expect(json['gradeLevel'], 'veryGood');
    // الدرجات مخزّنة كخريطة مفتاحها معرّف الواجب.
    expect((json['entries'] as Map).keys, ['a1', 'a2']);
    expect(GradebookModel.fromJson(json, id: 's1'), g);
  });

  test('سجل الدرجات: يقرأ الشكل القديم (قائمة) أيضاً', () {
    final g = GradebookModel.fromJson({
      'classId': '5A',
      'entries': [
        {
          'assignmentId': 'a1',
          'assignmentTitle': 'الطفو',
          'score': 7,
          'maxScore': 10,
          'gradedAt': DateTime(2026, 10, 11),
        },
      ],
    }, id: 's1');
    expect(g.entries.single.assignmentId, 'a1');
    expect(g.totalScore, 7);
  });
}
