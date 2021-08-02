export type ImageURISource = {
  uri: string
  method?: 'GET' | 'POST' | 'PUT' | 'get' | 'post' | 'put'
  body?: any
  headers?: Record<string, string>
}