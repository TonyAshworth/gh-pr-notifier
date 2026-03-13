import type { Label } from '../types'

interface Props {
  label: Label
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export default function LabelChip({ label }: Props): JSX.Element {
  const hex = label.color.startsWith('#') ? label.color : `#${label.color}`
  const { r, g, b } = hexToRgb(hex)
  const textColor = luminance(r, g, b) > 128 ? '#000000' : '#ffffff'

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 10,
        backgroundColor: hex,
        color: textColor,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
        maxWidth: 120,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      title={label.name}
    >
      {label.name}
    </span>
  )
}
