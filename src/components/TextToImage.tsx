'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, Loader2, Download, Image as ImageIcon, Maximize2 } from 'lucide-react'
import Image from 'next/image'

export default function TextToImage() {
  const [prompt, setPrompt] = useState('')
  const [numOutputs, setNumOutputs] = useState([1])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [currentGeneratedImageIndex, setCurrentGeneratedImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [textResponse, setTextResponse] = useState('')

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleCopyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
    } catch (err) {
      console.error('复制图片失败:', err)
    }
  }

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFullscreen = (imageUrl: string) => {
    // 创建全屏遮罩层
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
    `
    
    const img = document.createElement('img')
    img.src = imageUrl
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
    `
    
    overlay.appendChild(img)
    document.body.appendChild(overlay)
    
    // 点击遮罩层关闭全屏
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay)
    })
    
    // ESC键关闭全屏
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay)
        document.removeEventListener('keydown', handleEsc)
      }
    }
    document.addEventListener('keydown', handleEsc)
  }



  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词')
      return
    }

    console.log('🚀 开始文生图请求...')
    console.log('📝 提示词:', prompt)
    console.log('🔢 生成数量:', numOutputs[0])
    
    setIsGenerating(true)
    setError('')
    setGeneratedImages([])
    setTextResponse('')

    try {
      const requestBody = {
        prompt,
        numOutputs: numOutputs[0],
      }
      
      console.log('📦 请求体:', requestBody)
      console.log('📡 发送API请求到 /api/generate/text-to-image')
      const startTime = Date.now()
      
      const response = await fetch('/api/generate/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const endTime = Date.now()
      console.log(`⏱️ API请求耗时: ${endTime - startTime}ms`)
      console.log('📊 响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('📦 API响应数据:', data)

      if (data.success) {
        console.log('✅ 生成成功，图片数量:', data.images?.length || 0)
        console.log('🔗 生成的图片链接:', data.images)
        if (data.images && data.images.length > 0) {
          setGeneratedImages(data.images)
          setCurrentGeneratedImageIndex(0)
          setTextResponse('')
        } else if (data.text) {
          // 只有文字响应，没有图片
          setTextResponse(data.text)
          setGeneratedImages([])
        } else {
          setError('生成失败：未返回有效内容')
        }
      } else {
        console.error('❌ 生成失败:', data.error)
        setError(data.error || '生成失败')
      }
    } catch (err) {
      console.error('❌ 网络错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 h-full items-stretch">
      {/* 左侧输入区 */}
      <Card className="w-full xl:w-1/3 2xl:w-1/4 h-fit bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 min-h-[80px] flex items-center px-6 py-3 rounded-t-2xl">
          <div className="flex items-center gap-3 text-lg font-bold w-full">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">文生图设置</span>
          </div>
        </div>
        <CardContent className="space-y-6">
          {/* 提示词输入 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">提示词</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
                disabled={!prompt}
                className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="使用自然语言描述你想要生成的图片..."
              className="min-h-[140px] resize-none border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl"
            />
          </div>

          {/* 生成数量滑块 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">生成数量</label>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{numOutputs[0]} 张</span>
            </div>
            <Slider
              value={numOutputs}
              onValueChange={setNumOutputs}
              max={4}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              '生成图片'
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}
          
          {textResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">AI 响应</h4>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{textResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 右侧生成结果区 */}
      <Card className="w-full xl:w-2/3 2xl:w-3/4 pt-0 overflow-hidden bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 min-h-[80px] flex items-center px-6 py-3 rounded-t-2xl">
          <div className="flex items-center gap-3 text-lg font-bold w-full">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">生成结果</span>
          </div>
        </div>
        <CardContent className="space-y-4 p-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse opacity-20"></div>
              </div>
              <p className="text-emerald-600 font-medium">正在生成图片，请稍候...</p>
            </div>
          ) : generatedImages.length > 0 ? (
            <>
              {/* 主图片显示区域 - 1:1 比例 */}
              <div className="relative">
                <div className="aspect-square bg-white rounded-xl border-2 border-emerald-200 overflow-hidden shadow-lg">
                  <Image
                    src={generatedImages[currentGeneratedImageIndex]}
                    alt={`生成图片 ${currentGeneratedImageIndex + 1}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* 全屏按钮 */}
                <button
                  onClick={() => handleFullscreen(generatedImages[currentGeneratedImageIndex])}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 border border-emerald-200"
                  title="全屏显示"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                </button>
                
                {/* 操作按钮组 */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <button
                    onClick={() => handleCopyImage(generatedImages[currentGeneratedImageIndex])}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 border border-emerald-200"
                    title="复制图片"
                  >
                    <Copy className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(generatedImages[currentGeneratedImageIndex], currentGeneratedImageIndex)}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 border border-emerald-200"
                    title="下载图片"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
                

              </div>
              
              {/* 页码显示 */}
              {generatedImages.length > 1 && (
                <div className="text-center">
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {currentGeneratedImageIndex + 1} / {generatedImages.length}
                  </span>
                </div>
              )}
              
              {/* 缩略图网格 */}
              {generatedImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {generatedImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentGeneratedImageIndex(index)}
                      className={`w-full aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                        currentGeneratedImageIndex === index 
                          ? 'border-emerald-500 ring-2 ring-emerald-200' 
                          : 'border-emerald-200 hover:border-emerald-400'
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`生成图片 ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-emerald-600 font-medium text-sm">生成的图片将在这里显示</p>
                <p className="text-xs text-emerald-400">暂无内容</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}