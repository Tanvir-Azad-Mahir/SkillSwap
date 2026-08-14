-- SkillSwap+ Admin & Main Platform Schema

-- 1. Custom Types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS skill_difficulty CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;

CREATE TYPE user_role AS ENUM ('Learner', 'Mentor', 'Swap Master', 'Super Admin', 'Moderator', 'Finance Admin', 'Content Admin');
CREATE TYPE user_status AS ENUM ('Active', 'Pending', 'Suspended');
CREATE TYPE skill_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE request_status AS ENUM ('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled');
CREATE TYPE session_status AS ENUM ('Scheduled', 'Active', 'Completed', 'Cancelled', 'Disputed');
CREATE TYPE course_status AS ENUM ('Active', 'Pending', 'Suspended');
CREATE TYPE transaction_type AS ENUM ('Session Earned', 'Session Spent', 'Welcome Bonus', 'Penalty', 'Course Enrolled', 'Manual Adjustment');
CREATE TYPE report_status AS ENUM ('Pending', 'Under Review', 'Resolved', 'Dismissed');
CREATE TYPE media_type AS ENUM ('Image', 'Video', 'Document', 'Other');

-- 2. Clean up existing tables if any
DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.ss_transactions CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.mentorship_requests CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Tables

-- EXTENDED PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'Learner',
  status user_status DEFAULT 'Active',
  credits INTEGER DEFAULT 100,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  status user_status DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  difficulty skill_difficulty DEFAULT 'Intermediate',
  status user_status DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SKILLS (Many-to-many relationship for learning/teaching)
CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  is_learning BOOLEAN DEFAULT false,
  is_teaching BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, skill_id)
);

-- MENTORSHIP REQUESTS
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  status request_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  duration_minutes INTEGER DEFAULT 60,
  credits_exchanged INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status session_status DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  price_credits INTEGER DEFAULT 0,
  status course_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SS TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.ss_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  description TEXT,
  status report_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDIA
CREATE TABLE IF NOT EXISTS public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type media_type DEFAULT 'Other',
  size_bytes BIGINT DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS) policies

-- (Note: In a true production environment, policies would be extremely strict. 
-- For the sake of this prompt, we enable generic reading and allow admins full access.)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Moderator', 'Finance Admin', 'Content Admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Everyone can read active categories/skills
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (status = 'Active' OR is_admin());
CREATE POLICY "Public read active skills" ON public.skills FOR SELECT USING (status = 'Active' OR is_admin());

-- Admins get full ALL access to all tables
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (is_admin());
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL USING (is_admin());
CREATE POLICY "Admin full access skills" ON public.skills FOR ALL USING (is_admin());
CREATE POLICY "Admin full access user_skills" ON public.user_skills FOR ALL USING (is_admin());
CREATE POLICY "Admin full access mentorship_requests" ON public.mentorship_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access sessions" ON public.sessions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access courses" ON public.courses FOR ALL USING (is_admin());
CREATE POLICY "Admin full access ss_transactions" ON public.ss_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access reports" ON public.reports FOR ALL USING (is_admin());
CREATE POLICY "Admin full access reviews" ON public.reviews FOR ALL USING (is_admin());
CREATE POLICY "Admin full access media" ON public.media FOR ALL USING (is_admin());
CREATE POLICY "Admin full access platform_settings" ON public.platform_settings FOR ALL USING (is_admin());

-- Seed Initial Categories & Skills
INSERT INTO public.categories (name) VALUES ('Development'), ('Design'), ('Marketing'), ('Languages'), ('Business');
INSERT INTO public.skills (name, category_id, difficulty) 
SELECT 'React', id, 'Intermediate' FROM public.categories WHERE name = 'Development';
INSERT INTO public.skills (name, category_id, difficulty) 
SELECT 'Figma', id, 'Beginner' FROM public.categories WHERE name = 'Design';
