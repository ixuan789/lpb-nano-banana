import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { prompt, numOutputs = 1 } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { status: 400 }
      )
    }

    console.log(`🚀 开始并行生成 ${numOutputs} 张图片...`)
    
    // 创建单个API请求的函数
    const generateSingleImage = async () => {
      const response = await fetch('https://api.huandutech.com/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nano-banana.vercel.app',
          'X-Title': 'Nano Banana',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview:free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Generate an image based on this prompt: ${prompt}. Please generate a visual image, not just text description.`
                }
              ]
            }
          ],
          // 增加超时时间，给图片生成更多时间
          timeout: 60000
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('OpenRouter API error:', errorData)
        throw new Error('图片生成失败')
      }
      
      return response.json()
    }
    
    // 并行发起多个请求
    const promises = Array.from({ length: numOutputs }, () => generateSingleImage())
    const results = await Promise.all(promises)
    
    console.log(`✅ 成功获取 ${results.length} 个API响应`)
    console.log('所有API响应:', JSON.stringify(results, null, 2))
    
    // 从所有并行请求结果中提取图片和文本
    const imageUrls: string[] = []
    const textContents: string[] = []
    let hasAnyImageGeneration = false
    let completedResponsesCount = 0
    
    for (let i = 0; i < results.length; i++) {
      const data = results[i]
      console.log(`🔍 处理第 ${i + 1} 个API响应:`, JSON.stringify(data, null, 2))
      
      const choice = data.choices?.[0]
      const message = choice?.message
      const finishReason = choice?.finish_reason
      const generatedImages = message?.images || []
      const generatedContent = message?.content
      
      console.log(`📝 第 ${i + 1} 个响应的文本内容:`, generatedContent)
      console.log(`🖼️ 第 ${i + 1} 个响应的图片:`, generatedImages)
      console.log(`🏁 第 ${i + 1} 个响应的完成状态:`, finishReason)
      
      // 检查API响应是否完成
      const isResponseComplete = finishReason && ['stop', 'length', 'content_filter', 'tool_calls'].includes(finishReason)
      
      if (!isResponseComplete) {
        console.log(`⚠️ 第 ${i + 1} 个响应未完成，finish_reason: ${finishReason}，跳过处理`)
        continue
      }
      
      // 统计完成的响应数量
      completedResponsesCount++
      
      // 检查是否有图片生成迹象
      if (generatedImages.length > 0) {
        hasAnyImageGeneration = true
        
        // 提取这个响应中的图片
        for (const image of generatedImages) {
          if (image.image_url?.url) {
            console.log(`🖼️ 添加第 ${i + 1} 个响应的图片URL: ${image.image_url.url.substring(0, 50)}...`)
            imageUrls.push(image.image_url.url)
          }
        }
      }
      
      // 只有在没有任何图片生成迹象时才收集文本内容
      if (!hasAnyImageGeneration && generatedContent && typeof generatedContent === 'string') {
        textContents.push(generatedContent)
      }
    }
    
    // 合并文本内容
    const textContent = textContents.join('\n\n').trim()
    
    console.log(`🔍 图片生成检测结果: completedResponses=${completedResponsesCount}/${results.length}, hasAnyImageGeneration=${hasAnyImageGeneration}, imageUrls.length=${imageUrls.length}, textContent.length=${textContent.length}`)
    
    // 检查是否有足够的完成响应来做决定
    if (completedResponsesCount === 0) {
      console.log('❌ 没有任何完成的API响应，无法生成内容')
      return NextResponse.json({
        success: false,
        error: '所有API响应都未完成，请稍后重试'
      }, { status: 500 })
    }
    
    // 如果有图片，保存到数据库并返回图片
    if (imageUrls.length > 0) {
      console.log(`🖼️ 总共提取到 ${imageUrls.length} 张图片`)
      
      const supabase = createServerSupabaseClient()

      // 保存到数据库
      console.log('💾 保存生成历史到数据库...')
      const { data: historyRecord, error: dbError } = await supabase
        .from('generation_history')
        .insert({
          prompt,
          image_urls: imageUrls,
          num_outputs: numOutputs,
          type: 'text-to-image'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // 即使数据库保存失败，也返回生成的图片
      }

      return NextResponse.json({
        success: true,
        images: imageUrls,
        historyId: historyRecord?.id
      })
    }
    
    // 只有在确认没有任何图片生成迹象且有文本内容时，才返回文本响应
    if (!hasAnyImageGeneration && imageUrls.length === 0 && textContent.trim()) {
      console.log('📝 确认所有API响应都没有生成图片，返回文本响应:', textContent)
      return NextResponse.json({
        success: true,
        text: textContent.trim(),
        images: []
      })
    }
    
    // 既没有图片也没有文本内容
    console.error('❌ 所有API响应都没有生成图片或文本内容:', results)
    return NextResponse.json(
      { error: '未能生成图片，API未返回图片内容' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Text-to-image generation error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
