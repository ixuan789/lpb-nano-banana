'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Button } from '@/components/ui/button'
import { LogOut, Image as ImageIcon, Type, History } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ImageToImage from './ImageToImage'
import TextToImage from './TextToImage'
import GenerationHistory from './GenerationHistory'

export default function MainPage() {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('image-to-image')

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                🍌
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Nano Banana
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">退出登录</span>
              <span className="sm:hidden">退出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1">


        {/* 功能选项卡 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-md border border-emerald-200/50 shadow-lg rounded-xl p-1 sm:p-2 h-12 sm:h-16">
            <TabsTrigger 
              value="image-to-image" 
              className="flex items-center gap-1 sm:gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-red-200 data-[state=active]:shadow-xl data-[state=active]:text-orange-900 data-[state=active]:border-2 data-[state=active]:border-orange-300 data-[state=active]:scale-105 rounded-lg transition-all duration-300 font-medium h-10 sm:h-12 text-xs sm:text-base text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">图生图</span>
              <span className="sm:hidden">图生图</span>
            </TabsTrigger>
            <TabsTrigger 
              value="text-to-image" 
              className="flex items-center gap-1 sm:gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-200 data-[state=active]:to-teal-200 data-[state=active]:shadow-xl data-[state=active]:text-emerald-900 data-[state=active]:border-2 data-[state=active]:border-emerald-300 data-[state=active]:scale-105 rounded-lg transition-all duration-300 font-medium h-10 sm:h-12 text-xs sm:text-base text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Type className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">文生图</span>
              <span className="sm:hidden">文生图</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-1 sm:gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-200 data-[state=active]:to-blue-200 data-[state=active]:shadow-xl data-[state=active]:text-cyan-900 data-[state=active]:border-2 data-[state=active]:border-cyan-300 data-[state=active]:scale-105 rounded-lg transition-all duration-300 font-medium h-10 sm:h-12 text-xs sm:text-base text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">生成历史</span>
              <span className="sm:hidden">历史</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image-to-image" className="space-y-4 sm:space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-4 sm:p-8">
              <div className="mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">图生图模式</span>
                </h2>
                <p className="text-orange-600 text-sm sm:text-lg leading-relaxed">
                  上传参考图片，添加提示词，使用自然语言即可。
                </p>
              </div>
              <ImageToImage />
            </div>
          </TabsContent>

          <TabsContent value="text-to-image" className="space-y-4 sm:space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-4 sm:p-8">
              <div className="mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Type className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">文生图模式</span>
                </h2>
                <p className="text-emerald-600 text-sm sm:text-lg leading-relaxed">
                  通过自然语言提示词描述，生成精美的图像作品。
                </p>
              </div>
              <TextToImage />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-4 sm:p-8">
              <div className="mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <History className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">生成历史</span>
                </h2>
                <p className="text-cyan-600 text-sm sm:text-lg leading-relaxed">
                  查看之前的创作历史，请定期清理生成历史，以避免占用过多空间。
                </p>
              </div>
              <GenerationHistory />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 页脚 */}
      <footer className="mt-auto text-center py-4 sm:py-8">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg p-4 sm:p-6">
            <p className="text-gray-600 text-xs sm:text-sm font-medium">
              © 2025 | 该项目由 老婆宝 构建
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}