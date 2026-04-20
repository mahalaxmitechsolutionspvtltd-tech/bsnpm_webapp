export type DashboardOverviewFilters = {
  financial_year?: string
  month?: number | string
  year?: number | string
}

export type DashboardOverviewResponse = {
  success: boolean
  message: string
  data: {
    filters: {
      financial_year: string | null
      month: number | null
      range_start: string | null
      range_end: string | null
    }
    kpis: {
      total_members: {
        count: number
      }
      total_member_joining_fee: {
        amount: number
      }
      total_loan_amount: {
        amount: number
      }
      total_loan_outstanding: {
        amount: number
      }
      total_share_capital: {
        amount: number
      }
      total_emergency_fund: {
        amount: number
      }
      total_kayam_thev: {
        amount: number
      }
      total_active_loans: {
        count: number
      }
    }
    deposit_schemes: {
      recurring_deposit: {
        scheme_name: string
        amount: number
      }
      lakhpati_yojna_3y: {
        scheme_name: string
        amount: number
      }
      lakhpati_yojna_5y: {
        scheme_name: string
        amount: number
      }
      term_deposit_1_3y: {
        scheme_name: string
        amount: number
      }
      term_deposit_5_10y: {
        scheme_name: string
        amount: number
      }
      damduppat: {
        scheme_name: string
        amount: number
      }
      fixed_deposit: {
        scheme_name: string
        amount: number
      }
      total_deposits_schemes: {
        amount: number
      }
    }
  }
}
