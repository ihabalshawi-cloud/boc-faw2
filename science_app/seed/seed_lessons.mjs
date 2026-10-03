// يرفع كل درس في مجلد lessons/ إلى Firebase:
//   1. صور الدرس ← Firebase Storage في المسار lessons/<lessonId>/<اسم الملف>
//   2. مستند الدرس ← Firestore في lessons/<lessonId>
//
// داخل lesson.json تُكتب الصور بالشكل "upload:images/flower_parts.webp"،
// والسكربت يستبدلها برابط التحميل الحقيقي بعد الرفع.
//
// الاستخدام:
//   npm install
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//   npm run seed -- --bucket <اسم-الحاوية>            # كل الدروس
//   npm run seed -- --bucket <اسم-الحاوية> --lesson unit1_ch1_plants
//   npm run seed -- --dry-run                         # فحص بدون رفع

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UPLOAD_PREFIX = 'upload:';
const LESSONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'lessons');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // نفس حد قواعد Storage
const CONTENT_TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function parseArgs(argv) {
  const args = { dryRun: false, bucket: process.env.FIREBASE_STORAGE_BUCKET, lesson: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--bucket') args.bucket = argv[++i];
    else if (a === '--lesson') args.lesson = argv[++i];
    else throw new Error(`خيار غير معروف: ${a}`);
  }
  if (!args.dryRun && !args.bucket) {
    throw new Error(
      'حدّد حاوية Storage: --bucket <project-id>.firebasestorage.app\n' +
        '(تجدها في Firebase Console ← Storage، أو في lib/firebase_options.dart تحت storageBucket)',
    );
  }
  return args;
}

/** يجمع كل قيم "upload:..." في المستند مهما كان عمقها. */
function collectUploads(value, found = new Set()) {
  if (typeof value === 'string' && value.startsWith(UPLOAD_PREFIX)) found.add(value.slice(UPLOAD_PREFIX.length));
  else if (Array.isArray(value)) value.forEach((v) => collectUploads(v, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectUploads(v, found));
  return found;
}

/** يستبدل كل "upload:..." بالرابط المقابل. */
function resolveUploads(value, urls) {
  if (typeof value === 'string' && value.startsWith(UPLOAD_PREFIX)) return urls.get(value.slice(UPLOAD_PREFIX.length));
  if (Array.isArray(value)) return value.map((v) => resolveUploads(v, urls));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveUploads(v, urls)]));
  }
  return value;
}

/** فحوص سريعة قبل الرفع. الفحص الكامل للأسئلة موجود في test/seed/seed_lessons_test.dart. */
async function validateLesson(dir, lesson) {
  const errors = [];
  if (!lesson.id || lesson.id !== path.basename(dir)) errors.push(`"id" يجب أن يساوي اسم المجلد (${path.basename(dir)})`);
  if (!lesson.title) errors.push('"title" مفقود');
  if (!Array.isArray(lesson.quizList) || lesson.quizList.length === 0) errors.push('"quizList" فارغة');

  for (const rel of collectUploads(lesson)) {
    const file = path.resolve(dir, rel);
    // منع الخروج من مجلد الدرس عبر ../
    if (!file.startsWith(path.resolve(dir) + path.sep)) {
      errors.push(`مسار غير مسموح: ${rel}`);
      continue;
    }
    if (!CONTENT_TYPES[path.extname(file).toLowerCase()]) errors.push(`نوع صورة غير مدعوم: ${rel}`);
    try {
      const info = await stat(file);
      if (info.size > MAX_IMAGE_BYTES) errors.push(`الصورة أكبر من 5 ميغابايت: ${rel}`);
    } catch {
      errors.push(`الصورة غير موجودة: ${rel}`);
    }
  }
  if (errors.length) throw new Error(`أخطاء في الدرس ${path.basename(dir)}:\n  - ${errors.join('\n  - ')}`);
}

async function loadLessons(only) {
  const names = only ? [only] : (await readdir(LESSONS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const lessons = [];
  for (const name of names) {
    const dir = path.join(LESSONS_DIR, name);
    const lesson = JSON.parse(await readFile(path.join(dir, 'lesson.json'), 'utf8'));
    await validateLesson(dir, lesson);
    lessons.push({ dir, lesson });
  }
  return lessons;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lessons = await loadLessons(args.lesson);

  if (args.dryRun) {
    for (const { lesson } of lessons) {
      console.log(`✔ ${lesson.id}: ${lesson.quizList.length} أسئلة، ${collectUploads(lesson).size} صور`);
    }
    console.log('فحص فقط، لم يُرفع شيء.');
    return;
  }

  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore');
  const { getStorage, getDownloadURL } = await import('firebase-admin/storage');

  initializeApp({ credential: applicationDefault(), storageBucket: args.bucket });
  const db = getFirestore();
  const bucket = getStorage().bucket();

  for (const { dir, lesson } of lessons) {
    const urls = new Map();
    for (const rel of collectUploads(lesson)) {
      const destination = `lessons/${lesson.id}/${path.basename(rel)}`;
      const file = bucket.file(destination);
      await file.save(await readFile(path.resolve(dir, rel)), {
        resumable: false,
        metadata: {
          contentType: CONTENT_TYPES[path.extname(rel).toLowerCase()],
          // الصور لا تتغير كثيراً: تُخزَّن في الأجهزة لمدة يوم.
          cacheControl: 'public, max-age=86400',
        },
      });
      urls.set(rel, await getDownloadURL(file));
      console.log(`  ⬆ ${destination}`);
    }

    const { id, createdAt, ...rest } = resolveUploads(lesson, urls);
    const quizList = rest.quizList;
    await db.doc(`lessons/${id}`).set({
      ...rest,
      totalPoints: quizList.reduce((sum, q) => sum + (q.points ?? 10), 0),
      createdAt: createdAt ? Timestamp.fromDate(new Date(createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✔ lessons/${id}: ${quizList.length} أسئلة و${urls.size} صور`);
  }
}

main().catch((e) => {
  console.error(`✘ ${e.message}`);
  process.exit(1);
});
