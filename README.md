# AD1 — Enterprise ERP & Point of Sale System

نظام إدارة موارد المؤسسات (ERP) ونقاط البيع (POS) متكامل وعالي الأداء، مبني بمعمارية كائنية طبقية (Multi-tier Architecture) تضاهي أنظمة Odoo و SAP Business One.

---

## 🏛️ المعمارية الهندسية (Architecture)

يتكون النظام من 4 طبقات رئيسية لضمان الفصل التام للمسؤوليات (Separation of Concerns):

1. **طبقة العرض (Presentation Layer - React + Tailwind CSS)**: واجهات كاشير وإدارة مالية وتنفيذية سلسة وديناميكية دون أي قواعد عمل داخل المكونات.
2. **طبقة التطبيق والخدمات (Application Layer - Services)**: إدارة تدفقات العمل، التحقق من الصلاحيات، وتوجيه العمليات المركبة.
3. **طبقة النطاق والمستودعات (Domain & Repository Layer)**: تحتوي على محركات المحاسبة والمخزون والقيود المزدوجة وتقييم المخزون (WAC / FIFO).
4. **طبقة البنية التحتية والبيانات (Infrastructure & Persistence - PostgreSQL + Drizzle ORM)**: التعامل المباشر مع قاعدة البيانات مع دعم الترحيل المحاسبي والتصحيح الذاتي للهيكل (Self-healing Auto Migration).

---

## 🛠️ أوامر التشغيل والاختبار في السطر البرمجي (Terminal Execution Commands)

### 1. استنساخ المستودع وتجهيز البيئة (Environment Setup)

```bash
# 1. استنساخ المستودع والدخول لمجلد المشروع
git clone https://github.com/feraslion/AD1.git
cd AD1

# 2. تثبيت الحزم والتبعيات (Dependencies)
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
```

### 2. التشغيل للتطوير المحالي (Development Server)

```bash
# تشغيل خادم التطوير الخفيف
npm run dev
```

### 3. الفحص البرمجي وبناء المشروع (Engineering Quality Gate)

```bash
# 1. التحقق من سلامة الأنواع (TypeScript Checker & Linter)
npm run lint

# 2. بناء المشروع للإنتاج (Production Build)
npm run build
```

### 4. تشغيل حزمة الاختبارات الشاملة (Automated Test Suites)

```bash
# تشغيل كافة اختبارات المحاسبة، المبيعات، المشتريات، المخزون، والتقارير المالية
npx tsx src/tests/test_phases9_10_11.ts && npx tsx src/tests/test_phases12_13_14_15.ts
```

---

## 🤖 دليل ربط وإدماج Google Jules (jules.google.com Integration Guide)

[Google Jules](https://jules.google.com) هو وكيل برمجيات ذكي من Google متكامل مع GitHub يقوم بتحليل المستودع، حل المشكلات (Issues)، وإنشاء طلبات سحب (Pull Requests) متوافقة مع معايير الجودة.

### خطوات سير العمل الصحيحة (Integration Workflow)

1. **الربط والترخيص (Authentication & Permissions)**:
   - قم بزيارة موقع [jules.google.com](https://jules.google.com) وتسجيل الدخول بحساب Google.
   - اربط حساب GitHub الخاص بك (`feraslion`) وامنح Jules صلاحية الوصول للمستودع `feraslion/AD1`.
   - تأكد من منح Jules صلاحيات القراءة والكتابة (**Read & Write Permissions**) لإنشاء الفروع والـ Pull Requests.

2. **تعيين المهام وإصدار التوجيهات (Task Assignment)**:
   - يمكنك إنشاء **Issue** جديدة في GitHub تصف المهمة المطلوبة (مثل: "إضافة تقرير ميزانية مراجعة مجمع" أو "تحسين أداء استعلامات المخزون").
   - أو توجيه Jules مباشرة عبر واجهة المحادثة في [jules.google.com](https://jules.google.com) بإرسال رابط المستودع مع الأمر:
     > `"Analyze feraslion/AD1 repository, review missing tests, and submit a PR conforming to AGENTS.md engineering quality standards."`

3. **مراجعة واختبار طلبات السحب (Review & Test Jules PRs)**:
   عندما ينتهي Jules من إنجاز المهمة وفتح Pull Request، قم بجلب التغييرات واختبارها محلياً:

   ```bash
   # جلب الفروع الجديدة من GitHub
   git fetch origin

   # التبديل إلى فرع Jules للمعاينة والاختبار
   git checkout <jules-branch-name>

   # تشغيل الفحص البرمجي واختبارات النظام
   npm run lint
   npm run build
   npx tsx src/tests/test_phases9_10_11.ts && npx tsx src/tests/test_phases12_13_14_15.ts
   ```

4. **الدمج على الفرع الرئيسي (Merge to Main Branch)**:
   بعد التأكد من اجتياز كافة التحققات وبناء مشروع خالي من الأخطاء، اعتمد الـ PR على GitHub ثم حدّث مستودعك المحلي:

   ```bash
   git checkout main
   git pull origin main
   ```

---

## 📋 بوابات الجودة وضوابط التطوير (AGENTS.md Compliance)

قبل اعتماد أي كود جديد أو دمج Pull Request مقدم من Jules، يجب تحسين النظافة البرمجية واستيفاء المعايير التالية:

- **Build ناجح**: `npm run build` ينتهي بنجاح وبدون أخطاء.
- **TypeScript & Linter**: `npm run lint` يمر بدون أي تحذيرات أو أخطاء أنواع.
- **الاختبارات الشاملة**: نجاح كافة اختبارات المراحل التشغيلية وقيود التوازن المالي (Debit == Credit).
- **لا توجد تكرارات**: التزام كامل بأسس DRY وتجريد قواعد العمل في طبقة الخدمات والـ Repositories.
