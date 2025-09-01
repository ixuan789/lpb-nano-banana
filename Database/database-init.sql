-- Nano Banana AI 图像生成器数据库初始化脚本
-- 适用于 Supabase PostgreSQL

-- 创建生成历史表
CREATE TABLE IF NOT EXISTS generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prompt TEXT NOT NULL,
    image_urls TEXT[] NOT NULL,
    num_outputs INTEGER NOT NULL DEFAULT 1,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text-to-image', 'image-to-image'))
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_history_type ON generation_history(type);

-- 启用行级安全策略 (RLS)
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（因为使用服务端密钥）
CREATE POLICY "Allow all operations on generation_history" ON generation_history
    FOR ALL USING (true);

-- 创建存储桶用于存储生成的图片（如果需要）
-- 注意：这个需要在 Supabase 控制台中手动创建，或使用 Supabase 客户端 SDK
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- 为存储桶创建策略（如果使用 Supabase Storage）
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'generated-images');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');


-- 数据库初始化完成
-- 表结构和策略已创建