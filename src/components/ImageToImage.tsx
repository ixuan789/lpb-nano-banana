'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, Loader2, Upload, X, Download, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, ArrowLeftRight } from 'lucide-react'
import Image from 'next/image'

export default function ImageToImage() {
  const [prompt, setPrompt] = useState('')
  const [numOutputs, setNumOutputs] = useState([1])
  const [isGenerating, setIsGenerating] = useState(false)
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState(0)
  const [currentGeneratedImageIndex, setCurrentGeneratedImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [textResponse, setTextResponse] = useState('')
  const [comparisonPosition, setComparisonPosition] = useState(50)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过 10MB')
        return false
      }
      return file.type.startsWith('image/')
    })

    const totalFiles = referenceImages.length + validFiles.length
    if (totalFiles > 9) {
      setError('最多只能上传 9 张图片')
      return
    }

    setReferenceImages(prev => [...prev, ...validFiles])
    setError('')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const removeImage = (index: number) => {
    setReferenceImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // 如果删除的是当前选中的图片，或者当前选中索引超出范围，重置为0
      if (index === selectedReferenceIndex || selectedReferenceIndex >= newImages.length) {
        setSelectedReferenceIndex(0)
      }
      // 如果删除的图片在当前选中图片之前，需要调整索引
      else if (index < selectedReferenceIndex) {
        setSelectedReferenceIndex(selectedReferenceIndex - 1)
      }
      return newImages
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词')
      return
    }

    if (referenceImages.length === 0) {
      setError('请上传至少一张参考图片')
      return
    }

    console.log('🚀 开始图片生成请求...')
    console.log('📝 提示词:', prompt)
    console.log('🔢 生成数量:', numOutputs[0])
    console.log('🖼️ 参考图片数量:', referenceImages.length)
    
    setIsGenerating(true)
    setError('')
    setGeneratedImages([])

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('numOutputs', numOutputs[0].toString())
      
      referenceImages.forEach((file, index) => {
        console.log(`📎 添加参考图片 ${index + 1}:`, file.name, '大小:', (file.size / 1024).toFixed(2) + 'KB')
        formData.append('referenceImages', file)
      })

      console.log('📡 发送API请求到 /api/generate/image-to-image')
      const startTime = Date.now()
      
      const response = await fetch('/api/generate/image-to-image', {
        method: 'POST',
        body: formData,
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

  const handleDownloadImage = (imageUrl: string, index?: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${index !== undefined ? index + 1 : Date.now()}.jpg`
    link.click()
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

  const getUploadButtonText = () => {
    if (referenceImages.length === 0) return '选择图片'
    if (referenceImages.length < 9) return '添加更多图片'
    return '已达到最大数量'
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



  const navigateReference = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedReferenceIndex(prev => prev > 0 ? prev - 1 : referenceImages.length - 1)
    } else {
      setSelectedReferenceIndex(prev => prev < referenceImages.length - 1 ? prev + 1 : 0)
    }
  }



  const handleComparisonDragStart = (e: React.MouseEvent) => {
     e.preventDefault()
     
     const container = e.currentTarget.parentElement
     if (!container) return
     
     const handleMouseMove = (e: MouseEvent) => {
       const rect = container.getBoundingClientRect()
       const x = e.clientX - rect.left
       const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
       setComparisonPosition(percentage)
     }
     
     const handleMouseUp = () => {
  
       document.removeEventListener('mousemove', handleMouseMove)
       document.removeEventListener('mouseup', handleMouseUp)
     }
     
     document.addEventListener('mousemove', handleMouseMove)
     document.addEventListener('mouseup', handleMouseUp)
   }

  return (
    <>

      
      <div className="flex flex-col lg:flex-row gap-6 h-full max-w-7xl mx-auto items-stretch">
      {/* 左侧参考图片区 */}
      <Card className="flex-1 pt-0 overflow-hidden bg-white/90 backdrop-blur-sm border-orange-100 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 min-h-[80px] flex items-center px-6 py-3 rounded-t-2xl">
          <div className="flex items-center gap-3 text-lg font-bold w-full">
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">参考图片</span>
            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">{referenceImages.length}</span>
          </div>
        </div>
        <CardContent className="space-y-4 p-4">
          {referenceImages.length === 0 ? (
            <div 
              className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center bg-orange-50/30 hover:bg-orange-50/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  拖拽图片到此处，或点击选择文件来上传图片，可选择多张
                </p>
              </div>
            </div>
          ) : referenceImages.length > 0 && referenceImages[selectedReferenceIndex] ? (
            <div className="space-y-4">
              {/* 主图片显示区域 - 1:1 比例 */}
              <div className="relative">
                <div className="aspect-square bg-white rounded-xl border-2 border-orange-200 overflow-hidden shadow-lg">
                  {referenceImages[selectedReferenceIndex] && (
                    <Image
                      src={URL.createObjectURL(referenceImages[selectedReferenceIndex])}
                      alt={`参考图片 ${selectedReferenceIndex + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                
                {/* 左右导航箭头 */}
                {referenceImages.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateReference('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 border border-orange-200"
                    >
                      <ChevronLeft className="w-5 h-5 text-orange-600" />
                    </button>
                    <button
                      onClick={() => navigateReference('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 border border-orange-200"
                    >
                      <ChevronRight className="w-5 h-5 text-orange-600" />
                    </button>
                  </>
                )}
                
                {/* 删除按钮 */}
                <button
                  onClick={() => removeImage(selectedReferenceIndex)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* 页码显示 */}
              {referenceImages.length > 1 && (
                <div className="text-center">
                  <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                    {selectedReferenceIndex + 1} / {referenceImages.length}
                  </span>
                </div>
              )}
              
              {/* 缩略图网格 - 用于管理多张图片 */}
              {referenceImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => setSelectedReferenceIndex(index)}
                        className={`w-full aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                          selectedReferenceIndex === index 
                            ? 'border-orange-500 ring-2 ring-orange-200' 
                            : 'border-orange-200 hover:border-orange-400'
                        }`}
                      >
                        {file && (
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`参考图片 ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          
          {/* 拖拽上传区域 - 当已有图片时也显示 */}
          {referenceImages.length > 0 && referenceImages.length < 9 && (
            <div 
              className="border-2 border-dashed border-orange-200 rounded-xl p-4 text-center bg-orange-50/30 hover:bg-orange-50/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  继续添加更多图片
                </p>
              </div>
            </div>
          )}
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={referenceImages.length >= 9}
            variant="outline"
            className="w-full h-10 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-700 transition-all duration-200 font-medium rounded-lg text-sm"
          >
            {getUploadButtonText()}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="text-xs text-orange-600 text-center bg-orange-50 rounded-lg py-2 px-3 border border-orange-100">
            最多上传 9 张图片，单张不超过 10MB
          </p>
        </CardContent>
      </Card>

      {/* 中间生成设置区 */}
      <Card className="flex-1 pt-0 overflow-hidden bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 min-h-[80px] flex items-center px-6 py-3 rounded-t-2xl">
          <div className="flex items-center gap-3 text-lg font-bold w-full">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">生成设置</span>
          </div>
        </div>
        <CardContent className="space-y-4 p-4">
          {/* 提示词输入 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">自定义提示词</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
                disabled={!prompt}
                className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="使用自然语言描述你想要生成的图片..."
              className="min-h-[100px] resize-none border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg text-sm"
            />
          </div>

          {/* 生成数量滑块 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">生成数量</label>
              <span className="text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent bg-emerald-50 px-2 py-1 rounded-lg">{numOutputs[0]} 张</span>
            </div>
            <Slider
              value={numOutputs}
              onValueChange={setNumOutputs}
              max={4}
              min={1}
              step={1}
              className="w-full [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-emerald-500 [&_[data-slot=slider-range]]:to-teal-500"
            />
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || referenceImages.length === 0}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              `生成 ${numOutputs[0]} 张图片`
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
      <Card className="flex-1 pt-0 overflow-hidden bg-white/90 backdrop-blur-sm border-blue-100 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 min-h-[80px] flex items-center px-6 py-3 rounded-t-2xl">
          <div className="flex items-center gap-3 text-lg font-bold w-full">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">生成结果</span>
          </div>
        </div>
        <CardContent className="space-y-4 p-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse opacity-20"></div>
              </div>
              <p className="text-orange-600 font-medium">正在生成图片，请稍候...</p>
            </div>
          ) : generatedImages.length > 0 ? (
            <>
              {/* 主图片显示区域 - 1:1 比例 */}
              <div className="relative">
                <div className="aspect-square bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-lg">
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
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 border border-blue-200"
                  title="全屏显示"
                >
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                </button>
                
                {/* 操作按钮组 */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <button
                    onClick={() => handleCopyImage(generatedImages[currentGeneratedImageIndex])}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 border border-blue-200"
                    title="复制图片"
                  >
                    <Copy className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(generatedImages[currentGeneratedImageIndex], currentGeneratedImageIndex)}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 border border-blue-200"
                    title="下载图片"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                

              </div>
              
              {/* 页码显示 */}
              {generatedImages.length > 1 && (
                <div className="text-center">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
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
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-blue-200 hover:border-blue-400'
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

              {/* 图片对比区域 */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5" />
                  图片对比
                </h3>
                
                {/* 对比显示 - 可拖拽分割线 */}
                <div className="relative aspect-square bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-lg">
                  {/* 原图 */}
                  <div className="absolute inset-0">
                    {referenceImages[selectedReferenceIndex] && (
                      <Image
                        src={URL.createObjectURL(referenceImages[selectedReferenceIndex])}
                        alt="参考图片"
                        width={400}
                        height={400}
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      原图
                    </div>
                  </div>
                  
                  {/* 生成图 - 使用clip-path实现分割效果 */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(${comparisonPosition}% 0%, 100% 0%, 100% 100%, ${comparisonPosition}% 100%)`
                    }}
                  >
                    <Image
                      src={generatedImages[currentGeneratedImageIndex]}
                      alt="生成图片"
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      生成图
                    </div>
                  </div>
                  
                  {/* 可拖拽的分割线 */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
                    style={{ left: `${comparisonPosition}%` }}
                    onMouseDown={handleComparisonDragStart}
                  >
                    {/* 分割线中心的拖拽手柄 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-300 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* 百分比显示 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-blue-600 border border-blue-200">
                    {Math.round(comparisonPosition)}%
                  </div>
                </div>
                
                {/* 参考图片选择 */}
                {referenceImages.length > 1 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      选择参考图片：
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {referenceImages.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedReferenceIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                            selectedReferenceIndex === index 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-blue-200 hover:border-blue-400'
                          }`}
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`参考图片 ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-blue-600 font-medium text-sm">生成的图片将在这里显示</p>
                <p className="text-xs text-blue-400">暂无内容</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}