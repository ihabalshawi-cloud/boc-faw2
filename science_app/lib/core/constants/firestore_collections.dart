/// أسماء مجموعات Firestore في مكان واحد لتجنّب الأخطاء الإملائية.
abstract final class FirestoreCollections {
  static const users = 'users';
  static const classes = 'classes';
  static const lessons = 'lessons';
  static const assignments = 'assignments';
  static const submissions = 'submissions';
  static const gradebooks = 'gradebooks';
}

/// مواضيع (Topics) الإشعارات في Firebase Cloud Messaging.
abstract final class MessagingTopics {
  static const allStudents = 'all_students';
  static const allTeachers = 'all_teachers';
  static const allParents = 'all_parents';

  /// موضوع خاص بكل صف دراسي، مثل: class_5A
  static String forClass(String classId) => 'class_$classId';
}
