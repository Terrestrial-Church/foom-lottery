/**
 * Renders text with colored segments enclosed in curly braces
 * @param text The text to render, with segments in {braces} for accent color
 * @param customColors Optional custom colors for primary and accent text
 * @returns Array of React span elements with appropriate styling
 */
export const renderColoredText = (
  text: string,
  customColors?: {
    primary?: string
    accent?: string
    bold?: boolean
  }
): React.ReactNode[] => {
  const textWithNewlines = text.replace(/\\n/g, '\n')
  const parts = textWithNewlines.split(/(\{[^}]*\})/g)

  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const content = part.slice(1, -1)
      return (
        <span
          key={index}
          className={`text-accent ${customColors?.bold ? 'font-bold' : ''}`}
        >
          {content}
        </span>
      )
    }

    return (
      <span
        key={index}
        className={customColors?.primary}
      >
        {part}
      </span>
    )
  })
}
