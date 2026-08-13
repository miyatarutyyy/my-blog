export function getPrimaryFontFamily(fontFamily: string) {
  return fontFamily.split(",")[0]?.trim() ?? fontFamily;
}
