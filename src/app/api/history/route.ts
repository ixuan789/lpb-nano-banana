import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// 获取历史记录
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    console.log('📋 获取生成历史记录...')
    const { data, error } = await supabase
      .from('generation_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '获取历史记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, records: data })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 删除所有历史记录
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    console.log('🔍 DELETE请求参数:', { id, url: request.url })
    
    const supabase = createServerSupabaseClient()

    if (id) {
      // 删除单条记录
      console.log('🗑️ 删除单条历史记录:', id)
      
      // 先检查记录是否存在
      const { data: existingRecord, error: checkError } = await supabase
        .from('generation_history')
        .select('id')
        .eq('id', id)
        .single()
      
      if (checkError) {
        console.error('检查记录存在性错误:', checkError)
        if (checkError.code === 'PGRST116') {
          return NextResponse.json(
            { error: '记录不存在' },
            { status: 404 }
          )
        }
      }
      
      console.log('📋 找到记录:', existingRecord)
      
      const { error, data } = await supabase
        .from('generation_history')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('数据库删除错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return NextResponse.json(
          { error: `删除记录失败: ${error.message}` },
          { status: 500 }
        )
      }
      
      console.log('✅ 删除成功，影响行数:', data?.length || 0)

      return NextResponse.json({ success: true, message: '记录已删除' })
    } else {
      // 删除所有记录
      console.log('🗑️ 清空所有历史记录...')
      const { error, data } = await supabase
        .from('generation_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录的技巧
        .select()

      if (error) {
        console.error('数据库清空错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return NextResponse.json(
          { error: `清空历史记录失败: ${error.message}` },
          { status: 500 }
        )
      }
      
      console.log('✅ 清空成功，删除行数:', data?.length || 0)

      return NextResponse.json({ success: true, message: '历史记录已清空' })
    }
  } catch (error) {
    console.error('DELETE API错误:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}