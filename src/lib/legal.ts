/** Troca `{{chave}}` pelos dados da empresa; chave desconhecida fica visível. */
export function substituirMarcadores(texto: string, dados: Record<string, string>): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (m, chave: string) => dados[chave] ?? m);
}

/** O aviso de rascunho some quando o texto for marcado como revisado no frontmatter. */
export function precisaAviso(revisado: boolean): boolean {
  return !revisado;
}
