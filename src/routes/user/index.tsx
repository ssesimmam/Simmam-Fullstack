import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/user/')({ component: UserIndex })

function UserIndex() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/user/profile', replace: true })
  }, [navigate])

  return null
}
