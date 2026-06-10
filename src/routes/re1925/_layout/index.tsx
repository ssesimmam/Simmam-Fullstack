import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/re1925/_layout/')({
  component: ReIndexRedirect,
})

function ReIndexRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/re1925/checkin', replace: true })
  }, [navigate])

  return null
}
