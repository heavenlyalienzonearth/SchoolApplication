-- ==========================================================
-- VIDYANKURAM SCHOOL PORTAL - TRANSACTIONAL DATA PURGE SCRIPT
-- RUN THIS ON YOUR SQL SERVER INSTANCE TO CLEAN ALL TRANSACTIONS
-- ==========================================================

PRINT 'Starting transactional data purge...';
GO

-- Disable constraints temporarily to prevent constraint check errors during purge
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- 1. Purge Stationery Orders and Items
PRINT 'Purging Stationery Orders and Items...';
DELETE FROM [stationary_order_items];
IF OBJECTPROPERTY(OBJECT_ID('[stationary_order_items]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[stationary_order_items]', RESEED, 0);

DELETE FROM [stationary_orders];
IF OBJECTPROPERTY(OBJECT_ID('[stationary_orders]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[stationary_orders]', RESEED, 0);

-- 2. Purge Daily Moments
PRINT 'Purging Student Daily Moments...';
DELETE FROM [student_daily_moments];
IF OBJECTPROPERTY(OBJECT_ID('[student_daily_moments]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[student_daily_moments]', RESEED, 0);

-- 3. Purge Library Borrows
PRINT 'Purging Library Borrow History...';
DELETE FROM [library_borrows];
IF OBJECTPROPERTY(OBJECT_ID('[library_borrows]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[library_borrows]', RESEED, 0);

-- 4. Purge Leaves and Attendance
PRINT 'Purging Leaves and Attendance records...';
DELETE FROM [leave_requests];
IF OBJECTPROPERTY(OBJECT_ID('[leave_requests]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[leave_requests]', RESEED, 0);

DELETE FROM [attendance];
IF OBJECTPROPERTY(OBJECT_ID('[attendance]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[attendance]', RESEED, 0);

-- 5. Purge Bills and Milestones
PRINT 'Purging Student Bills and Milestone records...';
DELETE FROM [parent_bills];
IF OBJECTPROPERTY(OBJECT_ID('[parent_bills]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[parent_bills]', RESEED, 0);

DELETE FROM [parent_milestones];
IF OBJECTPROPERTY(OBJECT_ID('[parent_milestones]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[parent_milestones]', RESEED, 0);

-- 6. Purge Admissions and Admission Vaccinations
PRINT 'Purging Admission Inquiries and Vaccinations...';
DELETE FROM [admission_vaccinations];
IF OBJECTPROPERTY(OBJECT_ID('[admission_vaccinations]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[admission_vaccinations]', RESEED, 0);

DELETE FROM [admissions];
IF OBJECTPROPERTY(OBJECT_ID('[admissions]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[admissions]', RESEED, 0);

-- 7. Purge Contact Inquiries and Franchise Inquiries
PRINT 'Purging General Contact and Franchise Inquiries...';
DELETE FROM [contact_submissions];
IF OBJECTPROPERTY(OBJECT_ID('[contact_submissions]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[contact_submissions]', RESEED, 0);

DELETE FROM [franchise_inquiries];
IF OBJECTPROPERTY(OBJECT_ID('[franchise_inquiries]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[franchise_inquiries]', RESEED, 0);

-- 8. Purge Career Applications
PRINT 'Purging Job Applications...';
DELETE FROM [job_applications];
IF OBJECTPROPERTY(OBJECT_ID('[job_applications]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[job_applications]', RESEED, 0);

-- 9. Purge Active Refresh Tokens
PRINT 'Purging Auth Refresh Tokens...';
DELETE FROM [refresh_tokens];
IF OBJECTPROPERTY(OBJECT_ID('[refresh_tokens]'), 'TableHasIdentity') = 1
    DBCC CHECKIDENT ('[refresh_tokens]', RESEED, 0);

-- Re-enable constraints
EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'Transactional data purge completed successfully!';
GO
