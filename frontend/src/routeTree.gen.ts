/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as RegistrationImport } from './routes/registration'
import { Route as GetmoviesImport } from './routes/getmovies'
import { Route as IndexImport } from './routes/index'
import { Route as MoviesIndexImport } from './routes/movies.index'
import { Route as LoginIndexImport } from './routes/login.index'
import { Route as MoviesMovieIdImport } from './routes/movies.$movieId'
import { Route as UsersUserIdProfileImport } from './routes/users_.$userId.profile'
import { Route as UsersUserIdFavMoviesImport } from './routes/users_.$userId.fav-movies'
import { Route as UsersUserIdActivityImport } from './routes/users_.$userId.activity'

// Create/Update Routes

const RegistrationRoute = RegistrationImport.update({
  path: '/registration',
  getParentRoute: () => rootRoute,
} as any)

const GetmoviesRoute = GetmoviesImport.update({
  path: '/getmovies',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const MoviesIndexRoute = MoviesIndexImport.update({
  path: '/movies/',
  getParentRoute: () => rootRoute,
} as any)

const LoginIndexRoute = LoginIndexImport.update({
  path: '/login/',
  getParentRoute: () => rootRoute,
} as any)

const MoviesMovieIdRoute = MoviesMovieIdImport.update({
  path: '/movies/$movieId',
  getParentRoute: () => rootRoute,
} as any)

const UsersUserIdProfileRoute = UsersUserIdProfileImport.update({
  path: '/users/$userId/profile',
  getParentRoute: () => rootRoute,
} as any)

const UsersUserIdFavMoviesRoute = UsersUserIdFavMoviesImport.update({
  path: '/users/$userId/fav-movies',
  getParentRoute: () => rootRoute,
} as any)

const UsersUserIdActivityRoute = UsersUserIdActivityImport.update({
  path: '/users/$userId/activity',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/getmovies': {
      preLoaderRoute: typeof GetmoviesImport
      parentRoute: typeof rootRoute
    }
    '/registration': {
      preLoaderRoute: typeof RegistrationImport
      parentRoute: typeof rootRoute
    }
    '/movies/$movieId': {
      preLoaderRoute: typeof MoviesMovieIdImport
      parentRoute: typeof rootRoute
    }
    '/login/': {
      preLoaderRoute: typeof LoginIndexImport
      parentRoute: typeof rootRoute
    }
    '/movies/': {
      preLoaderRoute: typeof MoviesIndexImport
      parentRoute: typeof rootRoute
    }
    '/users/$userId/activity': {
      preLoaderRoute: typeof UsersUserIdActivityImport
      parentRoute: typeof rootRoute
    }
    '/users/$userId/fav-movies': {
      preLoaderRoute: typeof UsersUserIdFavMoviesImport
      parentRoute: typeof rootRoute
    }
    '/users/$userId/profile': {
      preLoaderRoute: typeof UsersUserIdProfileImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  GetmoviesRoute,
  RegistrationRoute,
  MoviesMovieIdRoute,
  LoginIndexRoute,
  MoviesIndexRoute,
  UsersUserIdActivityRoute,
  UsersUserIdFavMoviesRoute,
  UsersUserIdProfileRoute,
])

/* prettier-ignore-end */
