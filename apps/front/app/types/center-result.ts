export interface CenterResult {
  id: string
  name: string
  cp: string
  address: string
  tags: string
  tagsShort: string
  status: { type: 'success' | 'warning' | 'neutral'; label: string }
  pos: { top: string; left: string }
}
