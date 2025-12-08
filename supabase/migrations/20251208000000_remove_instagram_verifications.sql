-- Remove instagram_verifications table as it is no longer used
-- The flow has been updated to use Meta Graph API which doesn't require manual verification
DROP TABLE IF EXISTS instagram_verifications;
