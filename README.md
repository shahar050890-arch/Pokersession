# מעקב פוקר — Poker Session Tracker

אפליקציית ווב למעקב אחרי רווחים והפסדים במשחקי פוקר, עם תקציב חודשי.
עברית, RTL מלא, mobile-first, dark mode.

## סטאק

React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Supabase (Auth + Postgres + RLS)

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה מצביעה כברירת מחדל על פרויקט ה-Supabase שלה (`src/lib/supabase.ts`).
המפתח שם הוא publishable — הוא נשלח ממילא לדפדפן של כל מבקר, ולבדו אינו מעניק
גישה לשום דבר: RLS הוא מה שקובע מה כל משתמש מחובר יכול לקרוא ולכתוב.

כדי להצביע על פרויקט Supabase אחר, צור `.env` (ראה `.env.example`):

| משתנה | מה זה |
|---|---|
| `VITE_SUPABASE_URL` | כתובת ה-API של פרויקט Supabase |
| `VITE_SUPABASE_ANON_KEY` | המפתח הציבורי (publishable / anon) |

## מודל הנתונים

`supabase/migrations/` מכיל את הסכמה המלאה. שתי טבלאות:

**`poker_sessions`** — סשן בודד. `total_in` ו-`profit` הן עמודות `generated`
ב-Postgres, כך שהחישוב חי במקום אחד ואי אפשר שייווצר פער בין הנתון הגולמי לנגזר:

```
total_in = buy_in_amount × (1 + rebuys)
profit   = cash_out − total_in
```

**`budget_settings`** — שורה אחת למשתמש: `monthly_budget`, `mode`, `rollover`.

RLS מופעל על שתיהן, עם policy נפרד ל-select/insert/update/delete. כל policy
משווה `auth.uid()` ל-`user_id`, כך שמשתמש לא יכול לגשת לשורות של אחר גם אם
יעקוף את ה-UI.

## לוגיקת התקציב

כל החישוב ב-`src/lib/budget.ts`, נגזר מהסשנים הגולמיים — שום סכום לא נשמר פעמיים.

**`fixed`** — כל כניסה מקטינה את התקציב, רווחים לא משפיעים:

```
זמין = monthly_budget − Σ total_in
```

**`replenish`** — יציאות חוזרות לתקציב, כך שבפועל רק ההפסד הנקי מקטין אותו.
הזמין אף פעם לא עולה מעל `monthly_budget`:

```
זמין = monthly_budget − Σ total_in + Σ cash_out     (חסום מלמעלה)
```

**`rollover`** — יתרה חיובית שלא נוצלה עוברת לחודש הבא. חריגה לא יוצרת חוב:
החודש הבא מתחיל מהתקציב המלא.

## מבנה

```
src/
  lib/         supabase client, טיפוסים, לוגיקת תקציב, פורמוט מטבע/תאריך
  context/     Auth, Data (CRUD + מצב), Theme
  components/  Layout, כרטיסים, גרפים, אייקונים
  pages/       Auth, Dashboard, Sessions, SessionForm, Settings
```
