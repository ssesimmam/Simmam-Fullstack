import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/portal/admin')({
  beforeLoad: () => {
    throw redirect({
      to: '/wch1925/login',
      replace: true,
    })
  },
})