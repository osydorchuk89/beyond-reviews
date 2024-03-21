/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const RegistrationLazyImport = createFileRoute('/registration')()
const IndexLazyImport = createFileRoute('/')()
const LoginIndexLazyImport = createFileRoute('/login/')()
const LoginSuccessLazyImport = createFileRoute('/login/success')()

// Create/Update Routes

const RegistrationLazyRoute = RegistrationLazyImport.update({
  path: '/registration',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/registration.lazy').then((d) => d.Route))

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const LoginIndexLazyRoute = LoginIndexLazyImport.update({
  path: '/login/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/login.index.lazy').then((d) => d.Route))

const LoginSuccessLazyRoute = LoginSuccessLazyImport.update({
  path: '/login/success',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/login.success.lazy').then((d) => d.Route))

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/registration': {
      preLoaderRoute: typeof RegistrationLazyImport
      parentRoute: typeof rootRoute
    }
    '/login/success': {
      preLoaderRoute: typeof LoginSuccessLazyImport
      parentRoute: typeof rootRoute
    }
    '/login/': {
      preLoaderRoute: typeof LoginIndexLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexLazyRoute,
  RegistrationLazyRoute,
  LoginSuccessLazyRoute,
  LoginIndexLazyRoute,
])

/* prettier-ignore-end */
