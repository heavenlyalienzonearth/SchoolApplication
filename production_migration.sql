-- ==========================================================
-- VIDYANKURAM SCHOOL PORTAL - PRODUCTION SCHEMA UPGRADE SCRIPT
-- RUN THIS ON YOUR PRODUCTION SQL SERVER INSTANCE
-- ==========================================================

PRINT 'Starting production schema upgrade...';
GO

-- 1. Add 2FA columns to the existing 'users' table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'two_factor_secret')
BEGIN
    PRINT 'Adding two_factor_secret column to users table...';
    ALTER TABLE users ADD two_factor_secret VARCHAR(100) NULL;
END;
ELSE
BEGIN
    PRINT 'two_factor_secret column already exists.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'two_factor_enabled')
BEGIN
    PRINT 'Adding two_factor_enabled column to users table...';
    ALTER TABLE users ADD two_factor_enabled BIT NOT NULL DEFAULT 0;
END;
ELSE
BEGIN
    PRINT 'two_factor_enabled column already exists.';
END;
GO

-- 2. Create 'feature_permissions' table if it does not exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'feature_permissions')
BEGIN
    PRINT 'Creating feature_permissions table...';
    CREATE TABLE feature_permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        feature VARCHAR(100) NOT NULL,
        is_enabled BIT NOT NULL DEFAULT 1
    );
END;
ELSE
BEGIN
    PRINT 'feature_permissions table already exists.';
END;
GO

PRINT 'Production schema upgrade completed successfully!';
GO
