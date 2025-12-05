-- Migration: Add name fields to profiles
-- Created: 2025-12-05
-- Description: Adds first_name and last_name columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;
