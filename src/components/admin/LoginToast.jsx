'use client'

import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function LoginToast() {
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    if (adminUser) {
      const user = JSON.parse(adminUser)
      toast(
        <div>
          <div className="font-medium">
            Login sebagai {user.role.toUpperCase()}
          </div>
          <div className="text-sm">
            {user.name} ({user.email})
          </div>
        </div>
      )
    }
  }, [])

  return null
} 