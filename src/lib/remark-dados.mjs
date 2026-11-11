import { substituirMarcadores } from './legal.ts';

/** Plugin remark: troca `{{chave}}` em texto, links e HTML pelos dados da empresa. */
export function remarkDados(dados) {
  return () => (arvore) => {
    const visitar = (no) => {
      if (typeof no.value === 'string') no.value = substituirMarcadores(no.value, dados);
      if (typeof no.url === 'string') no.url = substituirMarcadores(no.url, dados);
      no.children?.forEach(visitar);
    };
    visitar(arvore);
  };
}
