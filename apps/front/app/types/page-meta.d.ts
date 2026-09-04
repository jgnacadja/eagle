interface BreadcrumbItem {
  label: string
  to?: string
}

declare module 'nuxt/app' {
  interface PageMeta {
    breadcrumb?: BreadcrumbItem[]
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    breadcrumb?: BreadcrumbItem[]
  }
}
