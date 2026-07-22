-- =====================================================================
-- VIDYANKURAM SCHOOL APPLICATION - MASTER TABLES CLEANUP SEQUENCE SCRIPT
-- =====================================================================
-- WARNING: THIS SCRIPT IS FOR REFERENCE / CLEANUP PURPOSES ONLY.
-- IT DOES NOT EXECUTE AUTOMATICALLY. ALWAYS BACK UP YOUR DATABASE FIRST!
-- =====================================================================

-- ---------------------------------------------------------------------
-- SECTION 1: DEPENDENT / CHILD TRANSACTIONAL TABLES
-- Must be cleaned up FIRST to prevent Foreign Key constraint violations
-- ---------------------------------------------------------------------

-- Step 1: Delete Order Item details (FK -> stationary_items, stationary_orders)
DELETE FROM stationary_order_items;

-- Step 2: Delete Parent Stationery Orders (FK -> users)
DELETE FROM stationary_orders;

-- Step 3: Delete Library Borrow logs (FK -> library_books, students)
DELETE FROM library_borrows;

-- Step 4: Delete Admission Vaccination logs (FK -> admissions, vaccinations)
DELETE FROM admission_vaccinations;

-- Step 5: Delete Student Billing & Waivers (FK -> students)
DELETE FROM parent_bills;

-- Step 6: Delete Parent/Student Milestone progress (FK -> students)
DELETE FROM parent_milestones;

-- Step 7: Delete Student Leave Requests (FK -> students)
DELETE FROM leave_requests;

-- Step 8: Delete Meal Suspension Requests (FK -> students)
DELETE FROM meal_suspension_requests;

-- Step 9: Delete Student Attendance logs (FK -> students)
DELETE FROM attendance;

-- Step 10: Delete Student Daily Moments (FK -> students, users)
DELETE FROM student_daily_moments;

-- Step 11: Delete Class Assignments & Homework (FK -> programs, users)
DELETE FROM class_assignments;

-- Step 12: Delete Job Applications (FK -> careers)
DELETE FROM job_applications;

-- Step 13: Delete User Refresh Tokens (FK -> users)
DELETE FROM refresh_tokens;

-- Step 14: Delete Teacher Achievements (FK -> users)
DELETE FROM teacher_achievements;

-- Step 15: Delete System Users (FK -> students, programs)
DELETE FROM users;

-- Step 16: Delete Students Roster (FK -> programs)
DELETE FROM students;

-- Step 17: Delete Admissions Applications (FK -> programs)
DELETE FROM admissions;


-- ---------------------------------------------------------------------
-- SECTION 2: MASTER / REFERENCE TABLES
-- Core master tables cleaned up in sequence after child dependencies are cleared
-- ---------------------------------------------------------------------

-- Step 18: Delete Milestone Templates (Master template per program)
DELETE FROM milestone_templates;

-- Step 19: Delete School Circulars (Master notice board)
DELETE FROM circulars;

-- Step 20: Delete Fee Structure Templates (Master fee configurations)
DELETE FROM fee_structures;

-- Step 21: Delete Stationery Items Catalog (Master inventory catalog)
DELETE FROM stationary_items;

-- Step 22: Delete Library Books Catalog (Master book inventory)
DELETE FROM library_books;

-- Step 23: Delete Vaccination Master List (Master medical reference)
DELETE FROM vaccinations;

-- Step 24: Delete Meal Plans (Master weekly menu template)
DELETE FROM meal_plans;

-- Step 25: Delete Career Postings (Master job openings)
DELETE FROM careers;

-- Step 26: Delete Academic Programs (Core program master: Toddler, Preschool, Kindergarten)
DELETE FROM programs;

-- Step 27: Delete Frequently Asked Questions (Master FAQ content)
DELETE FROM faqs;

-- Step 28: Delete Site Settings (Master system config)
DELETE FROM site_settings;

-- Step 29: Delete Feature Permissions (Master role access matrix)
DELETE FROM feature_permissions;

-- Step 30: Delete CMS Page Sections (Master page content layout)
DELETE FROM page_sections;

-- =====================================================================
-- END OF CLEANUP SEQUENCE SCRIPT
-- =====================================================================
