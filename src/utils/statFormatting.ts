export const formatAppearanceScore = (appearance: number) =>
  `${Number((Math.round((appearance / 10) * 2) / 2).toFixed(1)).toString()}/10`;
