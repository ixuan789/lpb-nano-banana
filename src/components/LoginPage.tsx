'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const success = await login(password)
    if (!success) {
      setError('密码错误，请重试')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-amber-100 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/30 via-rose-200/20 to-amber-200/30"></div>
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/95 shadow-2xl border border-orange-200/50">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            Nano Banana
          </CardTitle>
          <CardDescription className="text-gray-600">
            Hi,你来啦。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                请输入访问密码
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? '验证中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}