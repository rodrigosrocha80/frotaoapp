export type UserMe = {
  id: number
  nome: string
  email: string
  perfil: string
}

export type KPIResponse = {
  mtbf_horas: number
  mttr_horas: number
  disponibilidade_percentual: number
  custo_total_manutencao: number
}

export type Veiculo = {
  id: number
  placa: string
  modelo: string
  km_atual: number
  status: string
}

export type OrdemServico = {
  id: number
  veiculo_id: number
  criada_por_id: number
  responsavel_id: number | null
  tipo_manutencao: string
  status: string
  descricao: string
  custo_total: string | number
  data_abertura: string
  data_inicio: string | null
  data_fim: string | null
  km_abertura: number
  km_fechamento: number | null
}
