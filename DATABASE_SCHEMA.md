# 📄 Database Schema — compyouteacher
_Last updated: 2025-07-16_

---

## 🗂️ Tables

---

### 📄 `bucket_groups`
- 🔷 **Purpose:** Stores the buckets and reflection written by the student in Module 4.
- 🔷 **Notes:** Anonymous/public write & read is enabled.

| Name         | Type       | Default             | Notes            |
|--------------|------------|---------------------|------------------|
| `user_email` | text       | NULL                | ✅ Primary Key   |
| `id`         | uuid       | `gen_random_uuid()` |                  |
| `buckets`    | jsonb      | NULL                | Buckets structure|
| `updated_at` | timestamp  | NULL                |                  |
| `reflection` | text       | NULL                |                  |

---

### 📄 `module3_responses`
- 🔷 **Purpose:** Stores responses from Module 3 (thesis, rhetorical analysis) & teacher feedback.
- 🔷 **Notes:** Anonymous/public write & read is enabled.

| Name              | Type       | Default             | Notes          |
|-------------------|------------|---------------------|----------------|
| `id`              | uuid       | `gen_random_uuid()` | ✅ Primary Key |
| `user_email`       | text       | NULL                |                |
| `responses`       | json       | NULL                |                |
| `created_at`      | timestamp  | `now()`             |                |
| `teacher_comment` | text       | NULL                |                |
| `teacher_score`   | int4       | NULL                |                |
| `thesis`          | text       | NULL                |                |

---

### 📄 `module9_quiz`
- 🔷 **Purpose:** Stores the student’s quiz result & submission timestamp from Module 9.
- 🔷 **Notes:** Anonymous/public write & read is enabled. Composite primary key: `(id, user_email)`.

| Name           | Type       | Default     | Notes            |
|----------------|------------|-------------|------------------|
| `id`           | int8       | NULL        | ✅ Composite PK  |
| `user_email`   | text       | NULL        | ✅ Composite PK  |
| `created_at`   | timestamp  | `now()`     |                  |
| `score`        | int2       | NULL        |                  |
| `total`        | int2       | NULL        |                  |
| `submitted_at` | timestamp  | `now()`     |                  |

---

### 📄 `student_drafts`
- 🔷 **Purpose:** Tracks drafts written by students in Module 6 & 7, including sections, revision state, final text, and audio.
- 🔷 **Notes:** Composite primary key: `(user_email, module)`.

| Name           | Type       | Default          | Notes            |
|----------------|------------|------------------|------------------|
| `user_email`   | text       | NULL             | ✅ Composite PK  |
| `module`       | int2       | `'6'`            | ✅ Composite PK  |
| `sections`     | jsonb      | NULL             |                  |
| `locked`       | bool       | `false`          |                  |
| `updated_at`   | timestamp  | `now()`          |                  |
| `created_at`   | timestamp  | `now()`          |                  |
| `full_text`    | text       | NULL             |                  |
| `revised`      | bool       | NULL             |                  |
| `audio_url`    | text       | NULL             |                  |
| `final_ready`  | bool       | `false`          |                  |
| `final_text`   | text       | NULL             |                  |

---

### 📄 `student_outlines`
- 🔷 **Purpose:** Stores outlines created in Module 5, including thesis, body, and conclusion.
- 🔷 **Notes:** Composite primary key: `(user_email, module)`.

| Name           | Type       | Default             | Notes            |
|----------------|------------|---------------------|------------------|
| `user_email`   | text       | NULL                | ✅ Composite PK  |
| `module`       | int4       | `5`                 | ✅ Composite PK  |
| `id`           | uuid       | `gen_random_uuid()` |                  |
| `created_at`   | timestamp  | `now()`             |                  |
| `outline`      | jsonb      | NULL                |                  |
| `updated_at`   | timestamp  | `now()`             |                  |
| `finalized`    | bool       | `false`             |                  |

---

### 📄 `tchart_entries`
- 🔷 **Purpose:** Stores the T-chart entries from Module 2 (observations, quotes, categories, etc.).
- 🔷 **Notes:** Anonymous/public write & read is enabled.

| Name         | Type       | Default             | Notes            |
|--------------|------------|---------------------|------------------|
| `id`         | uuid       | `gen_random_uuid()` | ✅ Primary Key   |
| `updated_at` | timestamp  | `now()`             |                  |
| `user_email` | text       | NULL                |                  |
| `category`   | text       | NULL                |                  |
| `letter_url` | text       | NULL                |                  |
| `type`       | text       | NULL                |                  |
| `observation`| text       | NULL                |                  |
| `quote`      | text       | NULL                |                  |

---

## 📝 Notes
- 🔐 **Access Control:**
  - Anonymous/public access is enabled on all tables right now.
  - RLS (Row Level Security) is recommended for production but currently disabled.
  - When enabling RLS, you’ll need to write policies to allow only the owner (`user_email`) to read/write their own rows.

- 🧰 **JSON/JSONB Usage:**
  - Heavily used (`buckets`, `responses`, `sections`, `outline`) to store structured data.

---
