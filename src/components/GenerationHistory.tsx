'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Download, Trash2, RefreshCw, Image as ImageIcon, Type, Loader2 } from 'lucide-react'
import { HistoryRecord } from '@/lib/supabase'
import Image from 'next/image'

export default function GenerationHistory() {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/history')
      const data = await response.json()
      
      if (data.success) {
        setHistoryRecords(data.records)
      } else {
        setError(data.error || '获取历史记录失败')
      }
    } catch (err) {
      console.error('获取历史记录错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteRecord = async (id: string) => {
    setIsDeleting(id)
    try {
      console.log('🗑️ 开始删除记录:', id)
      const response = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      })
      
      console.log('删除响应状态:', response.status)
      
      if (!response.ok) {
        console.error('删除请求失败:', response.status, response.statusText)
        if (response.status === 404) {
          // 记录不存在，可能是数据不同步，刷新列表
          console.log('记录不存在，刷新历史记录列表')
          await fetchHistory()
          setError('记录已不存在，列表已刷新')
        } else {
          setError(`删除失败: ${response.status} ${response.statusText}`)
        }
        return
      }
      
      const data = await response.json()
      console.log('删除响应数据:', data)
      
      if (data.success) {
        setHistoryRecords(prev => prev.filter(record => record.id !== id))
        if (selectedRecord?.id === id) {
          setSelectedRecord(null)
        }
        console.log('✅ 记录删除成功')
      } else {
        console.error('删除失败:', data.error)
        setError(data.error || '删除失败')
      }
    } catch (err) {
      console.error('删除记录错误:', err)
      setError(`删除失败: ${err instanceof Error ? err.message : '网络错误'}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      return
    }
    
    setIsDeleting('all')
    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setHistoryRecords([])
        setSelectedRecord(null)
      } else {
        setError(data.error || '清空失败')
      }
    } catch (err) {
      console.error('清空历史记录错误:', err)
      setError('清空失败，请稍后重试')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDownloadImage = (imageUrl: string, recordId: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `nano-banana-${recordId}-${index + 1}.jpg`
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeIcon = (type: string) => {
    return type === 'text-to-image' ? <Type className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />
  }

  const getTypeName = (type: string) => {
    return type === 'text-to-image' ? '文生图' : '图生图'
  }

  useEffect(() => {
    fetchHistory()
  }, [])
  
  // 添加定期刷新功能，确保数据同步
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isDeleting) {
        fetchHistory()
      }
    }, 30000) // 每30秒刷新一次
    
    return () => clearInterval(interval)
  }, [isLoading, isDeleting])

  return (
    <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:gap-8 h-full items-stretch">
      {/* 左侧历史记录列表 */}
      <div className="w-full xl:w-2/5 space-y-3 lg:space-y-4">
        <Card className="pt-0 overflow-hidden bg-white/90 backdrop-blur-sm border-cyan-100 shadow-xl rounded-2xl">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100 min-h-[60px] lg:min-h-[80px] flex items-center px-4 lg:px-6 py-2 lg:py-3 rounded-t-2xl">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 lg:gap-3 text-base lg:text-lg font-bold">
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">生成历史</span>
              </div>
              <div className="flex gap-1.5 lg:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  disabled={isLoading}
                  className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3 p-0 lg:p-2"
                >
                  <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllHistory}
                  disabled={isDeleting === 'all' || !historyRecords || historyRecords.length === 0}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3 p-0 lg:p-2"
                >
                  {isDeleting === 'all' ? (
                    <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="space-y-3 lg:space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 lg:py-12 space-y-3 lg:space-y-4">
                <div className="relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                </div>
                <p className="text-gray-600 font-medium text-sm lg:text-base">加载历史记录中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 lg:py-12 space-y-3 lg:space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 lg:p-4">
                  <p className="text-red-600 text-xs lg:text-sm font-medium">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  className="border-red-200 text-red-600 hover:bg-red-50 h-8 lg:h-9 text-xs lg:text-sm"
                >
                  重试
                </Button>
              </div>
            ) : !historyRecords || historyRecords.length === 0 ? (
              <div className="text-center py-8 lg:py-12 space-y-3 lg:space-y-4">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-gray-600 font-medium text-sm lg:text-base">还没有生成记录</p>
                  <p className="text-xs lg:text-sm text-gray-400">开始创作您的第一张图片吧</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3 max-h-80 lg:max-h-96 overflow-y-auto">
                {historyRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`p-3 lg:p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedRecord?.id === record.id 
                        ? 'border-blue-300 bg-blue-50/50 shadow-md' 
                        : 'border-gray-200 bg-white/50 hover:bg-gray-50/50'
                    }`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-0.5 lg:py-1 text-xs lg:text-sm ${
                          record.type === 'text-to-image' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : 'border-purple-200 text-purple-700 bg-purple-50'
                        }`}
                      >
                        <span className="w-3 h-3 lg:w-4 lg:h-4">{getTypeIcon(record.type)}</span>
                        <span className="hidden sm:inline">{getTypeName(record.type)}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRecord(record.id)
                        }}
                        disabled={isDeleting === record.id}
                        className="h-7 w-7 lg:h-8 lg:w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {isDeleting === record.id ? (
                          <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-700 line-clamp-2 mb-2 lg:mb-3 font-medium leading-relaxed">
                      {record.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 bg-gray-100 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md text-xs">{formatDate(record.created_at)}</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md font-medium text-xs">{record.image_urls.length} 张图片</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 右侧详情展示 */}
      <div className="w-full xl:w-3/5">
        {selectedRecord ? (
          <Card className="bg-white/90 backdrop-blur-sm border-cyan-100 shadow-xl rounded-2xl">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100 min-h-[60px] lg:min-h-[80px] flex items-center px-4 lg:px-6 py-2 lg:py-3 rounded-t-2xl">
              <div className="flex items-center gap-2 lg:gap-3 text-base lg:text-lg font-bold">
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">记录详情</span>
              </div>
            </div>
            <CardHeader className="pb-3 lg:pb-4 px-4 lg:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-0">
                <CardTitle className="flex items-center gap-2 lg:gap-3 text-lg lg:text-xl font-semibold text-gray-800">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center ${
                    selectedRecord.type === 'text-to-image' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}>
                    <div className="text-white w-4 h-4 lg:w-5 lg:h-5">{getTypeIcon(selectedRecord.type)}</div>
                  </div>
                  <span className="hidden sm:inline">{getTypeName(selectedRecord.type)} 详情</span>
                  <span className="sm:hidden">详情</span>
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={`px-2 lg:px-3 py-0.5 lg:py-1 text-xs lg:text-sm ${
                    selectedRecord.type === 'text-to-image' 
                      ? 'border-green-200 text-green-700 bg-green-50' 
                      : 'border-purple-200 text-purple-700 bg-purple-50'
                  }`}
                >
                  {formatDate(selectedRecord.created_at)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 lg:space-y-8 px-4 lg:px-6">
              {/* 提示词 */}
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-base lg:text-lg">提示词</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPrompt(selectedRecord.prompt)}
                    className="h-8 w-8 lg:h-9 lg:w-9 p-0 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                  </Button>
                </div>
                <div className="p-3 lg:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">{selectedRecord.prompt}</p>
                </div>
              </div>

              <Separator className="bg-gray-200" />

              {/* 生成的图片 */}
              <div className="space-y-4 lg:space-y-5">
                <h4 className="font-semibold text-gray-800 text-base lg:text-lg">生成的图片 ({selectedRecord.image_urls.length} 张)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {selectedRecord.image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`生成的图片 ${index + 1}`}
                        width={400}
                        height={224}
                        className="w-full h-40 sm:h-48 lg:h-56 object-cover rounded-xl border border-gray-200 shadow-md group-hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2 lg:gap-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyImage(imageUrl)}
                            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 h-8 w-8 lg:h-9 lg:w-9 p-0"
                          >
                            <Copy className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadImage(imageUrl, selectedRecord.id, index)}
                            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-gray-200 h-8 w-8 lg:h-9 lg:w-9 p-0"
                          >
                            <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 lg:top-3 lg:right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-1.5 lg:px-2 py-0.5 lg:py-1">
                          <span className="text-xs font-medium text-gray-700">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full bg-white/90 backdrop-blur-sm border-cyan-100 shadow-xl rounded-2xl">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100 min-h-[60px] lg:min-h-[80px] flex items-center px-4 lg:px-6 py-2 lg:py-3 rounded-t-2xl">
              <div className="flex items-center gap-2 lg:gap-3 text-base lg:text-lg font-bold">
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">详情预览</span>
              </div>
            </div>
            <CardContent className="flex flex-col items-center justify-center h-full px-4 lg:px-6">
              <div className="text-center space-y-2 lg:space-y-3">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-700">选择历史记录</h3>
                <p className="text-gray-500 max-w-sm text-sm lg:text-base">从左侧列表中选择一个历史记录来查看详情</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}