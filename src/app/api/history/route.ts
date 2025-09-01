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
    
    const supabase = createServerSupabaseClient()

    if (id) {
      // 删除单条记录
      console.log('🗑️ 删除单条历史记录:', id)
      const { error } = await supabase
        .from('generation_history')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: '删除记录失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: '记录已删除' })
    } else {
      // 删除所有记录
      console.log('🗑️ 清空所有历史记录...')
      const { error } = await supabase
        .from('generation_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录的技巧

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: '清空历史记录失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: '历史记录已清空' })
    }
  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}