-- Migration: Add widget_layouts to profiles table
-- This stores user's dashboard widget configuration (positions, sizes, visibility)

-- Add the widget_layouts column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS widget_layouts JSONB DEFAULT NULL;

-- Add the widget_visibility column for which widgets are shown
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS widget_visibility JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.widget_layouts IS 'Stores react-grid-layout positions for dashboard widgets';
COMMENT ON COLUMN public.profiles.widget_visibility IS 'Stores which widgets are visible on dashboard';

-- Grant access (should already have from RLS but being explicit)
-- Users can update their own profile which includes widget layouts
