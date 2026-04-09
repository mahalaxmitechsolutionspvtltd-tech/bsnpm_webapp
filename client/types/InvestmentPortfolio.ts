export type InvestmentType = 'scheme' | 'loan' | 'other'

export type MemberInvestmentPortfolioItem = {
    title: string
    type: InvestmentType
    application_no: string
    total_value: number
    entries_count: number
    last_date: string | null
    status: string | null
    payment_status: string | null
    approved_by: string | null
    approved_at: string | null
}

export type MemberInvestmentPortfolioMember = {
    member_id: string
    member_name: string
    total_value: number
    scheme_total_value: number
    loan_total_value: number
    other_total_value: number
    investments: MemberInvestmentPortfolioItem[]
}

export type MemberInvestmentPortfolioData = {
    total_members: number
    members: MemberInvestmentPortfolioMember[]
}

export type MemberInvestmentPortfolioResponse = {
    success: boolean
    message: string
    data: MemberInvestmentPortfolioData
}

export type GetMemberInvestmentPortfolioParams = {
    search?: string
}