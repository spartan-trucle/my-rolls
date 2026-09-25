export interface ThemedValue {
  light: string;
  dark: string;
}

export type Theme = keyof ThemedValue;

export interface NamedToken<V = string> {
  name: string;
  value: V;
  usage: string;
}

export interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  sample: string;
  usage: string;
}

/** Shape of design-tokens/tokens.json (the design-system artifact's project/tokens.json). */
export interface TokensFile {
  name: string;
  version: number;
  color: { themes: Array<{ id: string; name: string }>; tokens: Array<NamedToken<ThemedValue>> };
  type: {
    families: Record<"display" | "sans" | "mono" | "hand", string>;
    groups: Array<{ name: string; family: string; styles: TypeStyle[] }>;
  };
  spacing: { tokens: NamedToken[] };
  radius: { tokens: NamedToken[] };
  shadow: { tokens: Array<NamedToken<ThemedValue>> };
  tilt: { tokens: NamedToken[] };
  opacity: { tokens: NamedToken[] };
}
